import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET, getPlanFromPriceId } from "@/lib/stripe";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

// ─── User lookup helpers ──────────────────────────────────────────────────────

async function findByCustomerId(cid: string): Promise<{ id: string } | null> {
  const r = await queryDb<{ id: string }>(
    `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
    [cid]
  );
  return r.rows[0] ?? null;
}

async function findBySubscriptionId(sid: string): Promise<{ id: string } | null> {
  const r = await queryDb<{ id: string }>(
    `SELECT id FROM users WHERE subscription_id = $1 LIMIT 1`,
    [sid]
  );
  return r.rows[0] ?? null;
}

// ─── Subscription state sync ──────────────────────────────────────────────────

async function syncSubscription(
  subscription: Stripe.Subscription,
  overridePlan?: string
): Promise<void> {
  const user =
    (await findBySubscriptionId(subscription.id)) ??
    (await findByCustomerId(subscription.customer as string));

  if (!user) return;

  const status      = subscription.status;
  const periodEndTs = subscription.items.data[0]?.current_period_end ?? 0;
  const periodEnd   = new Date(periodEndTs * 1000);
  const priceId     = subscription.items.data[0]?.price?.id ?? null;
  const plan        = overridePlan ?? (priceId ? getPlanFromPriceId(priceId) : "monthly");
  const paidAccess  = status === "active" || status === "trialing";

  if (status === "active") {
    await queryDb(
      `UPDATE users SET
         plan_type                = 'pro',
         is_active                = true,
         paid_access              = true,
         subscription_status      = 'active',
         subscription_id          = $2,
         stripe_price_id          = COALESCE($4, stripe_price_id),
         subscription_plan        = $5,
         plan_expires_at          = $3,
         subscription_started_at  = COALESCE(subscription_started_at, NOW()),
         subscription_canceled_at = NULL,
         next_payment_at          = $3
       WHERE id = $1`,
      [user.id, subscription.id, periodEnd.toISOString(), priceId, plan]
    );
  } else if (status === "trialing") {
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    await queryDb(
      `UPDATE users SET
         paid_access              = true,
         subscription_status      = 'trialing',
         subscription_id          = $2,
         stripe_price_id          = COALESCE($4, stripe_price_id),
         subscription_plan        = $5,
         trial_expires_at         = COALESCE($3, trial_expires_at)
       WHERE id = $1`,
      [user.id, subscription.id, trialEnd?.toISOString() ?? null, priceId, plan]
    );
  } else if (status === "past_due" || status === "unpaid") {
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = 'past_due'
       WHERE id = $1`,
      [user.id]
    );
  } else if (status === "incomplete_expired") {
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = 'incomplete_expired'
       WHERE id = $1`,
      [user.id]
    );
  } else if (status === "canceled") {
    await queryDb(
      `UPDATE users SET
         paid_access              = false,
         subscription_status      = 'canceled',
         is_active                = false,
         subscription_canceled_at = COALESCE(subscription_canceled_at, NOW())
       WHERE id = $1`,
      [user.id]
    );
  } else {
    // Unknown/other status: revoke access to be safe
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = $2
       WHERE id = $1`,
      [user.id, status]
    );
  }
}

// ─── Invoice helpers ──────────────────────────────────────────────────────────

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as {
    subscription_details?: { subscription?: string | Stripe.Subscription };
  } | null;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Checkout completed ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session        = event.data.object as Stripe.Checkout.Session;
        const userId         = session.metadata?.userId;
        const plan           = session.metadata?.plan ?? "monthly";
        const customerId     = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!userId) break;

        // Persist Stripe customer and subscription IDs
        await queryDb(
          `UPDATE users SET
             stripe_customer_id = COALESCE(stripe_customer_id, $2),
             subscription_id    = COALESCE($3, subscription_id)
           WHERE id = $1`,
          [userId, customerId, subscriptionId]
        );

        // Sync full subscription state (pass plan from metadata so it's saved immediately)
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription, plan);
        }
        break;
      }

      // ── Subscription created / updated ─────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }

      // ── Subscription deleted (fully canceled) ──────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user =
          (await findBySubscriptionId(subscription.id)) ??
          (await findByCustomerId(subscription.customer as string));

        if (user) {
          await queryDb(
            `UPDATE users SET
               paid_access              = false,
               subscription_status      = 'canceled',
               is_active                = false,
               subscription_canceled_at = COALESCE(subscription_canceled_at, NOW())
             WHERE id = $1`,
            [user.id]
          );
        }
        break;
      }

      // ── Payment succeeded ──────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice        = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (!subscriptionId) break;

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);

        const user =
          (await findBySubscriptionId(subscriptionId)) ??
          (await findByCustomerId(invoice.customer as string));

        if (user) {
          await queryDb(
            `UPDATE users SET last_payment_at = NOW() WHERE id = $1`,
            [user.id]
          );
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice        = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        const user = subscriptionId
          ? (await findBySubscriptionId(subscriptionId)) ??
            (await findByCustomerId(invoice.customer as string))
          : await findByCustomerId(invoice.customer as string);

        if (user) {
          await queryDb(
            `UPDATE users SET
               paid_access         = false,
               subscription_status = 'past_due'
             WHERE id = $1`,
            [user.id]
          );
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
