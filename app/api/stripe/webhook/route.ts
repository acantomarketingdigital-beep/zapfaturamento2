import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripe,
  STRIPE_WEBHOOK_SECRET,
  getPlanFromPriceId,
  getBillingCycleFromPriceId,
} from "@/lib/stripe";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[stripe-webhook]";

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
  overridePlan?: string,
  overrideBilling?: string,
): Promise<void> {
  const user =
    (await findBySubscriptionId(subscription.id)) ??
    (await findByCustomerId(subscription.customer as string));

  if (!user) {
    console.warn(
      `${TAG} syncSubscription — no user found for subscription=${subscription.id} customer=${subscription.customer}`
    );
    return;
  }

  const status      = subscription.status;
  const periodEndTs = subscription.items.data[0]?.current_period_end ?? 0;
  const periodEnd   = new Date(periodEndTs * 1000);
  const priceId     = subscription.items.data[0]?.price?.id ?? null;
  const plan        = overridePlan   ?? (priceId ? getPlanFromPriceId(priceId)        : "starter");
  const billing     = overrideBilling ?? (priceId ? getBillingCycleFromPriceId(priceId) : "monthly");

  console.log(
    `${TAG} syncSubscription — userId=${user.id} subscription=${subscription.id}` +
    ` status=${status} plan=${plan} billing=${billing} priceId=${priceId ?? "null"}`
  );

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
         billing_cycle            = $6,
         plan_expires_at          = $3,
         subscription_started_at  = COALESCE(subscription_started_at, NOW()),
         subscription_canceled_at = NULL,
         next_payment_at          = $3
       WHERE id = $1`,
      [user.id, subscription.id, periodEnd.toISOString(), priceId, plan, billing]
    );
    console.log(`${TAG} DB updated — userId=${user.id} status=active plan=${plan} billing=${billing} expires=${periodEnd.toISOString()}`);

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
         billing_cycle            = $6,
         trial_expires_at         = COALESCE($3, trial_expires_at)
       WHERE id = $1`,
      [user.id, subscription.id, trialEnd?.toISOString() ?? null, priceId, plan, billing]
    );
    console.log(`${TAG} DB updated — userId=${user.id} status=trialing plan=${plan} billing=${billing} trialEnd=${trialEnd?.toISOString() ?? "null"}`);

  } else if (status === "past_due" || status === "unpaid") {
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = 'past_due'
       WHERE id = $1`,
      [user.id]
    );
    console.log(`${TAG} DB updated — userId=${user.id} status=past_due (payment overdue)`);

  } else if (status === "incomplete_expired") {
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = 'incomplete_expired'
       WHERE id = $1`,
      [user.id]
    );
    console.log(`${TAG} DB updated — userId=${user.id} status=incomplete_expired`);

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
    console.log(`${TAG} DB updated — userId=${user.id} status=canceled`);

  } else {
    await queryDb(
      `UPDATE users SET
         paid_access         = false,
         subscription_status = $2
       WHERE id = $1`,
      [user.id, status]
    );
    console.log(`${TAG} DB updated — userId=${user.id} unknown status=${status} → access revoked`);
  }
}

// ─── Invoice subscription ID helper ──────────────────────────────────────────

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
    console.error(`${TAG} DB not configured — rejecting`);
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  // Raw body required for Stripe signature verification
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    console.error(
      `${TAG} Missing stripe-signature=${!signature} or STRIPE_WEBHOOK_SECRET=${!STRIPE_WEBHOOK_SECRET}`
    );
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`${TAG} Signature verification failed:`, String(err));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`${TAG} ▶ event=${event.type} id=${event.id}`);

  try {
    switch (event.type) {

      // ── Checkout session completed ──────────────────────────────────────────
      case "checkout.session.completed": {
        const session        = event.data.object as Stripe.Checkout.Session;
        const userId         = session.metadata?.userId;
        const addonType      = session.metadata?.addonType ?? null;
        const plan           = session.metadata?.plan    ?? "starter";
        const billing        = session.metadata?.billing ?? "monthly";
        const customerId     = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        console.log(
          `${TAG} checkout.session.completed — userId=${userId ?? "MISSING"}` +
          ` addonType=${addonType ?? "none"} plan=${plan} billing=${billing}` +
          ` customerId=${customerId ?? "null"} subscriptionId=${subscriptionId ?? "null"}`
        );

        if (!userId) {
          console.error(`${TAG} checkout.session.completed — metadata.userId missing, skipping DB update`);
          break;
        }

        // Persist customer ID immediately (always safe)
        await queryDb(
          `UPDATE users SET stripe_customer_id = COALESCE(stripe_customer_id, $2) WHERE id = $1`,
          [userId, customerId]
        );

        // ── Add-on checkout: activate add-on, skip plan sync ──────────────────
        if (addonType) {
          const workspaceSlug = session.metadata?.workspaceSlug ?? null;
          const dbAddonType   = addonType === "whatsapp" ? "extra_whatsapp" : `extra_${addonType}`;
          const unitPrice     = addonType === "whatsapp" ? 29 : 49;

          console.log(`${TAG} addon checkout — activating ${dbAddonType} for workspace=${workspaceSlug ?? "null"}`);

          if (workspaceSlug) {
            await queryDb(
              `INSERT INTO billing_addons
                 (workspace_slug, addon_type, quantity, stripe_subscription_item_id, stripe_price_id, unit_price, status)
               VALUES ($1, $2, 1, NULL, NULL, $3, 'active')
               ON CONFLICT (workspace_slug, addon_type) WHERE status = 'active'
               DO UPDATE SET quantity = 1, updated_at = NOW()`,
              [workspaceSlug, dbAddonType, unitPrice]
            );
            console.log(`${TAG} billing_addons upserted — workspace=${workspaceSlug} type=${dbAddonType}`);
          }
          break; // Do NOT sync subscription plan for add-on checkouts
        }

        // ── Regular plan checkout ─────────────────────────────────────────────
        if (subscriptionId) {
          await queryDb(
            `UPDATE users SET subscription_id = COALESCE($2, subscription_id) WHERE id = $1`,
            [userId, subscriptionId]
          );
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription, plan, billing);
        }
        console.log(`${TAG} checkout — IDs persisted for userId=${userId}`);
        break;
      }

      // ── Subscription created / updated ─────────────────────────────────────
      // Handles renewals, plan changes, and billing cycle updates from Stripe
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `${TAG} ${event.type} — subscription=${subscription.id} status=${subscription.status}`
        );
        // billing cycle is inferred from price ID via getBillingCycleFromPriceId
        await syncSubscription(subscription);
        break;
      }

      // ── Subscription fully canceled ─────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`${TAG} customer.subscription.deleted — subscription=${subscription.id}`);

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
          console.log(`${TAG} DB updated — userId=${user.id} canceled (subscription deleted)`);
        } else {
          console.warn(
            `${TAG} customer.subscription.deleted — no user found for subscription=${subscription.id}`
          );
        }
        break;
      }

      // ── Payment succeeded ───────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice        = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        console.log(
          `${TAG} invoice.payment_succeeded — invoice=${invoice.id} subscription=${subscriptionId ?? "null"}`
        );

        if (!subscriptionId) break;

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);

        const user =
          (await findBySubscriptionId(subscriptionId)) ??
          (await findByCustomerId(invoice.customer as string));

        if (user) {
          await queryDb(`UPDATE users SET last_payment_at = NOW() WHERE id = $1`, [user.id]);
          console.log(`${TAG} last_payment_at updated — userId=${user.id}`);
        }
        break;
      }

      // ── Payment failed ──────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice        = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        console.log(
          `${TAG} invoice.payment_failed — invoice=${invoice.id} subscription=${subscriptionId ?? "null"}`
        );

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
          console.log(`${TAG} DB updated — userId=${user.id} past_due (payment failed)`);
        }
        break;
      }

      default:
        console.log(`${TAG} Unhandled event type=${event.type} — ignoring`);
        break;
    }
  } catch (err) {
    console.error(`${TAG} Handler error for event=${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
