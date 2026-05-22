import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getStripe } from "@/lib/stripe";
import { queryDb, hasDatabaseConfig } from "@/lib/db";
import { PLANS, type PlanKey } from "@/lib/plans";

export const runtime = "nodejs";

const TAG = "[stripe/addon]";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.kind === "env_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  let type: string, quantity: number;
  try {
    const body = await request.json();
    type = body.type;
    quantity = Number(body.quantity);
    if (!["form", "whatsapp"].includes(type) || !Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspaceSlug = user.clientSlug;
  if (!workspaceSlug) {
    return NextResponse.json({ error: "No workspace associated with this account" }, { status: 400 });
  }

  // Get user's subscription ID and plan
  let subscriptionId: string | null = null;
  let planKey: PlanKey = "starter";
  try {
    const r = await queryDb<{ subscription_id: string | null; subscription_plan: string | null }>(
      `SELECT subscription_id, subscription_plan FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    const row = r.rows[0];
    subscriptionId = row?.subscription_id ?? null;
    const rawPlan = row?.subscription_plan ?? "starter";
    if (PLANS[rawPlan as PlanKey]) planKey = rawPlan as PlanKey;
  } catch (err) {
    console.error(`${TAG} DB query failed:`, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const plan      = PLANS[planKey];
  const addonType = type === "form" ? "extra_form" : "extra_whatsapp";
  const priceId   = type === "form" ? plan.stripeExtraFormPriceId     : plan.stripeExtraWhatsappPriceId;
  const unitPrice = type === "form" ? (plan.extraFormPriceMonthly ?? 0) : (plan.extraWhatsappPriceMonthly ?? 0);

  if (!priceId) {
    return NextResponse.json(
      { error: "Add-ons not available for this plan (already unlimited)" },
      { status: 400 }
    );
  }

  const stripe = getStripe();

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items"],
    });

    const existingItem = subscription.items.data.find((item) => item.price.id === priceId);
    let stripeItemId: string | null = null;

    if (existingItem) {
      if (quantity === 0) {
        await stripe.subscriptionItems.del(existingItem.id, {
          proration_behavior: "create_prorations",
        });
        // Cancel in DB
        await queryDb(
          `UPDATE billing_addons
           SET status = 'canceled', updated_at = NOW()
           WHERE workspace_slug = $1 AND addon_type = $2 AND status = 'active'`,
          [workspaceSlug, addonType]
        );
      } else {
        await stripe.subscriptionItems.update(existingItem.id, {
          quantity,
          proration_behavior: "create_prorations",
        });
        stripeItemId = existingItem.id;
      }
    } else if (quantity > 0) {
      const newItem = await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId,
        quantity,
        proration_behavior: "create_prorations",
      });
      stripeItemId = newItem.id;
    }

    // Upsert in DB when quantity > 0
    if (quantity > 0 && stripeItemId) {
      await queryDb(
        `INSERT INTO billing_addons
           (workspace_slug, addon_type, quantity, stripe_subscription_item_id, stripe_price_id, unit_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (workspace_slug, addon_type) WHERE status = 'active'
         DO UPDATE SET
           quantity                    = EXCLUDED.quantity,
           stripe_subscription_item_id = EXCLUDED.stripe_subscription_item_id,
           unit_price                  = EXCLUDED.unit_price,
           updated_at                  = NOW()`,
        [workspaceSlug, addonType, quantity, stripeItemId, priceId, unitPrice]
      );
    }

    console.log(
      `${TAG} userId=${user.id} workspace=${workspaceSlug} plan=${planKey}` +
      ` type=${type} qty=${quantity} priceId=${priceId} itemId=${stripeItemId ?? "removed"}`
    );
    return NextResponse.json({ ok: true, quantity, addonType, stripeItemId });
  } catch (err) {
    const e = err as { message?: string; type?: string; code?: string };
    console.error(`${TAG} Stripe error — type=${e.type} code=${e.code} message=${e.message}`);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
