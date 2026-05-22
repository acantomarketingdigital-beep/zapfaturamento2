import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import {
  getStripe,
  getPriceIdForPlan,
  isStripeConfigured,
  getBaseUrl,
  type BillingCycle,
} from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/plans";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

// GET: browser navigation guard — not a valid entry point
export function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: Request) {
  const base = getBaseUrl();
  const cancelUrl = `${base}/billing/cancel`;
  const subscribeUrl = `${base}/assinatura`;

  // ── Auth check ────────────────────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user || user.kind === "env_admin") {
    return NextResponse.redirect(subscribeUrl, 303);
  }

  // ── Config check ──────────────────────────────────────────────────────────
  if (!hasDatabaseConfig()) {
    console.error("[stripe/checkout] DATABASE_URL not configured");
    return NextResponse.redirect(subscribeUrl, 303);
  }
  if (!isStripeConfigured()) {
    console.error("[stripe/checkout] Stripe not configured — check STRIPE_SECRET_KEY");
    return NextResponse.redirect(subscribeUrl, 303);
  }

  // ── Read plan and billing cycle from form data ────────────────────────────
  let planKey: PlanKey = "starter";
  let billing: BillingCycle = "monthly";
  try {
    const formData = await request.formData();
    const rawPlan = formData.get("plan");
    const rawBilling = formData.get("billing");
    if (rawPlan && typeof rawPlan === "string" && PLANS[rawPlan as PlanKey]) {
      planKey = rawPlan as PlanKey;
    }
    if (rawBilling === "yearly") billing = "yearly";
  } catch (err) {
    console.error("[stripe/checkout] Failed to parse formData:", err);
  }

  // ── Resolve price ID ──────────────────────────────────────────────────────
  const priceId = getPriceIdForPlan(planKey, billing);
  if (!priceId) {
    console.error(`[stripe/checkout] No price ID for plan="${planKey}" billing="${billing}".`);
    return NextResponse.redirect(subscribeUrl, 303);
  }

  console.log(`[stripe/checkout] userId=${user.id} plan=${planKey} billing=${billing} priceId=${priceId}`);

  // ── DB: get or prepare Stripe customer ───────────────────────────────────
  let customerId: string | null = null;
  let trialExpiresAt: Date | null = null;

  try {
    const dbResult = await queryDb<{
      stripe_customer_id: string | null;
      trial_expires_at: string | null;
    }>(
      `SELECT stripe_customer_id, trial_expires_at FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    const row = dbResult.rows[0];
    customerId = row?.stripe_customer_id ?? null;
    trialExpiresAt = row?.trial_expires_at ? new Date(row.trial_expires_at) : null;
    console.log(`[stripe/checkout] DB ok — customerId=${customerId ?? "null"}`);
  } catch (err) {
    console.error("[stripe/checkout] DB query failed:", String(err));
    return NextResponse.redirect(cancelUrl, 303);
  }

  // ── Create Stripe customer if needed ─────────────────────────────────────
  const stripe = getStripe();

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await queryDb(
        `UPDATE users SET stripe_customer_id = $2 WHERE id = $1`,
        [user.id, customerId]
      );
      console.log(`[stripe/checkout] Stripe customer created: ${customerId}`);
    } catch (err) {
      const e = err as { message?: string; type?: string; code?: string };
      console.error(`[stripe/checkout] Failed to create Stripe customer — type=${e.type} code=${e.code} message=${e.message}`);
      return NextResponse.redirect(cancelUrl, 303);
    }
  }

  // ── Carry over internal trial end to Stripe ───────────────────────────────
  const now = new Date();
  const trialEnd =
    trialExpiresAt && trialExpiresAt > now
      ? Math.floor(trialExpiresAt.getTime() / 1000)
      : undefined;

  // ── Create checkout session ───────────────────────────────────────────────
  let sessionUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialEnd ? { trial_end: trialEnd } : undefined,
      success_url: `${base}/billing/success?plan=${planKey}`,
      cancel_url: cancelUrl,
      metadata: { userId: user.id, plan: planKey, billing },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "pt-BR",
    });

    if (!session.url) {
      console.error("[stripe/checkout] session.url is null — unexpected Stripe response:", session.id);
      return NextResponse.redirect(cancelUrl, 303);
    }

    sessionUrl = session.url;
    console.log(`[stripe/checkout] session created: ${session.id} → ${sessionUrl.slice(0, 60)}...`);
  } catch (err: unknown) {
    const stripeErr = err as { message?: string; type?: string; code?: string };
    console.error(
      `[stripe/checkout] stripe.checkout.sessions.create failed — type=${stripeErr.type} code=${stripeErr.code} message=${stripeErr.message}`
    );
    return NextResponse.redirect(cancelUrl, 303);
  }

  return NextResponse.redirect(sessionUrl, 303);
}
