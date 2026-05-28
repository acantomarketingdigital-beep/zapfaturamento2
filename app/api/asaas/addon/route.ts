import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import {
  isAsaasConfigured,
  createAsaasCustomer,
  createAsaasSubscription,
  getAsaasSubscriptionPayments,
  cancelAsaasSubscription,
  getBaseUrl,
} from "@/lib/asaas";
import { PLANS, type PlanKey } from "@/lib/plans";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[asaas/addon]";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.kind === "env_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }
  if (!isAsaasConfigured()) {
    return NextResponse.json({ error: "Asaas not configured" }, { status: 500 });
  }

  let type: string, quantity: number;
  try {
    const body = await request.json() as { type?: string; quantity?: number };
    type = body.type ?? "";
    quantity = Number(body.quantity);
    if (!["form", "whatsapp"].includes(type) || !Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspaceSlug = user.clientSlug;
  if (!workspaceSlug) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  // Get subscription plan and customer ID
  let planKey: PlanKey = "starter";
  let asaasCustomerId: string | null = null;
  try {
    const r = await queryDb<{
      subscription_plan: string | null;
      stripe_customer_id: string | null;
    }>(
      `SELECT subscription_plan, stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    const row = r.rows[0];
    const rawPlan = row?.subscription_plan ?? "starter";
    if (PLANS[rawPlan as PlanKey]) planKey = rawPlan as PlanKey;
    asaasCustomerId = row?.stripe_customer_id ?? null;
  } catch (err) {
    console.error(`${TAG} DB error:`, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const plan = PLANS[planKey];
  const addonType = type === "form" ? "extra_form" : "extra_whatsapp";
  const unitPrice = type === "form"
    ? (plan.extraFormPriceMonthly ?? 0)
    : (plan.extraWhatsappPriceMonthly ?? 0);

  if (!unitPrice) {
    return NextResponse.json({ error: "Add-on not available for this plan" }, { status: 400 });
  }

  // Cancel: remove existing add-on
  if (quantity === 0) {
    try {
      const existing = await queryDb<{ id: string; stripe_subscription_item_id: string | null }>(
        `SELECT id, stripe_subscription_item_id FROM billing_addons
         WHERE workspace_slug = $1 AND addon_type = $2 AND status = 'active' LIMIT 1`,
        [workspaceSlug, addonType]
      );
      const row = existing.rows[0];
      if (row?.stripe_subscription_item_id) {
        await cancelAsaasSubscription(row.stripe_subscription_item_id).catch((e) =>
          console.warn(`${TAG} Asaas cancel add-on warn:`, e)
        );
      }
      await queryDb(
        `UPDATE billing_addons SET status = 'canceled', updated_at = NOW()
         WHERE workspace_slug = $1 AND addon_type = $2 AND status = 'active'`,
        [workspaceSlug, addonType]
      );
      return NextResponse.json({ ok: true, quantity: 0, addonType });
    } catch (err) {
      console.error(`${TAG} Cancel error:`, err);
      return NextResponse.json({ error: "Cancel error" }, { status: 500 });
    }
  }

  // Activate: create Asaas customer if needed, then create add-on subscription
  if (!asaasCustomerId) {
    try {
      const customer = await createAsaasCustomer({
        name: user.email,
        email: user.email,
        externalReference: user.id,
      });
      asaasCustomerId = customer.id;
      await queryDb(`UPDATE users SET stripe_customer_id = $2 WHERE id = $1`, [user.id, asaasCustomerId]);
    } catch (err) {
      console.error(`${TAG} Create customer error:`, err);
      return NextResponse.json({ error: "Customer error" }, { status: 500 });
    }
  }

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  try {
    const sub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: unitPrice,
      nextDueDate: tomorrow,
      cycle: "MONTHLY",
      description: `Add-on ${type === "form" ? "Formulário Extra" : "WhatsApp Extra"} - ZapFaturamento`,
      externalReference: `${user.id}:addon:${addonType}:${workspaceSlug}`,
    });

    const payments = await getAsaasSubscriptionPayments(sub.id);
    const firstPayment = payments.data[0];
    const invoiceUrl = firstPayment?.invoiceUrl ?? null;

    // Save add-on subscription ID in stripe_subscription_item_id column (repurposed)
    await queryDb(
      `INSERT INTO billing_addons
         (workspace_slug, addon_type, quantity, stripe_subscription_item_id, unit_price, status)
       VALUES ($1, $2, 1, $3, $4, 'active')
       ON CONFLICT (workspace_slug, addon_type) WHERE status = 'active'
       DO UPDATE SET quantity = 1, stripe_subscription_item_id = $3, updated_at = NOW()`,
      [workspaceSlug, addonType, sub.id, unitPrice]
    );

    console.log(`${TAG} userId=${user.id} addon=${addonType} workspace=${workspaceSlug} sub=${sub.id}`);
    return NextResponse.json({ ok: true, quantity, addonType, invoiceUrl });
  } catch (err) {
    console.error(`${TAG} Error:`, err);
    return NextResponse.json({ error: "Asaas error" }, { status: 500 });
  }
}
