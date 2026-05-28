import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import {
  isAsaasConfigured,
  createAsaasCustomer,
  createAsaasSubscription,
  getAsaasSubscriptionPayments,
  getBaseUrl,
} from "@/lib/asaas";
import { PLANS, type PlanKey } from "@/lib/plans";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[asaas/checkout]";

export function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: Request) {
  const base = getBaseUrl();
  const subscribeUrl = `${base}/assinatura`;

  const user = await getCurrentUser();
  if (!user || user.kind === "env_admin") {
    return NextResponse.redirect(subscribeUrl, 303);
  }
  if (!hasDatabaseConfig()) {
    return NextResponse.redirect(subscribeUrl, 303);
  }
  if (!isAsaasConfigured()) {
    console.error(`${TAG} ASAAS_API_KEY not configured`);
    return NextResponse.redirect(subscribeUrl, 303);
  }

  let planKey: PlanKey = "starter";
  let billing: "monthly" | "yearly" = "monthly";
  try {
    const fd = await request.formData();
    const rawPlan = fd.get("plan");
    const rawBilling = fd.get("billing");
    if (rawPlan && typeof rawPlan === "string" && PLANS[rawPlan as PlanKey]) {
      planKey = rawPlan as PlanKey;
    }
    if (rawBilling === "yearly") billing = "yearly";
  } catch {
    // use defaults
  }

  const cancelUrl = `${base}/billing/cancel?plan=${planKey}&billing=${billing}`;
  const plan = PLANS[planKey];
  const value = billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const cycle = billing === "yearly" ? ("YEARLY" as const) : ("MONTHLY" as const);

  // DB: get existing Asaas customer ID and trial info
  let asaasCustomerId: string | null = null;
  let trialExpiresAt: Date | null = null;
  try {
    const r = await queryDb<{ stripe_customer_id: string | null; trial_expires_at: string | null }>(
      `SELECT stripe_customer_id, trial_expires_at FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    asaasCustomerId = r.rows[0]?.stripe_customer_id ?? null;
    trialExpiresAt = r.rows[0]?.trial_expires_at ? new Date(r.rows[0].trial_expires_at) : null;
  } catch (err) {
    console.error(`${TAG} DB error:`, err);
    return NextResponse.redirect(cancelUrl, 303);
  }

  // Create Asaas customer if not exists
  if (!asaasCustomerId) {
    try {
      const customer = await createAsaasCustomer({
        name: user.email,
        email: user.email,
        externalReference: user.id,
      });
      asaasCustomerId = customer.id;
      await queryDb(`UPDATE users SET stripe_customer_id = $2 WHERE id = $1`, [user.id, asaasCustomerId]);
      console.log(`${TAG} Asaas customer created: ${asaasCustomerId}`);
    } catch (err) {
      console.error(`${TAG} Failed to create customer:`, err);
      return NextResponse.redirect(cancelUrl, 303);
    }
  }

  // Honor remaining trial as first due date
  const now = new Date();
  const hasTrial = trialExpiresAt && trialExpiresAt > now;
  const nextDueDate = hasTrial
    ? trialExpiresAt!.toISOString().split("T")[0]
    : new Date(now.getTime() + 86_400_000).toISOString().split("T")[0]; // tomorrow

  try {
    const subscription = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value,
      nextDueDate,
      cycle,
      description: `Plano ${plan.name} - ZapFaturamento`,
      externalReference: `${user.id}:${planKey}:${billing}`,
    });

    const payments = await getAsaasSubscriptionPayments(subscription.id);
    const firstPayment = payments.data[0];

    if (!firstPayment?.invoiceUrl) {
      console.error(`${TAG} No invoiceUrl for subscription=${subscription.id}`);
      return NextResponse.redirect(cancelUrl, 303);
    }

    await queryDb(
      `UPDATE users SET subscription_id = $2, subscription_plan = $3, billing_cycle = $4 WHERE id = $1`,
      [user.id, subscription.id, planKey, billing]
    );

    console.log(`${TAG} userId=${user.id} plan=${planKey} billing=${billing} → ${firstPayment.invoiceUrl}`);
    return NextResponse.redirect(firstPayment.invoiceUrl, 303);
  } catch (err) {
    console.error(`${TAG} Error:`, err);
    return NextResponse.redirect(cancelUrl, 303);
  }
}
