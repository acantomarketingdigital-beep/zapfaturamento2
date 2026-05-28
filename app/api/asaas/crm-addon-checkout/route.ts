import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import {
  isAsaasConfigured,
  createAsaasCustomer,
  createAsaasSubscription,
  getAsaasSubscriptionPayments,
  getBaseUrl,
} from "@/lib/asaas";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[asaas/crm-addon-checkout]";

const ADDON_CONFIG: Record<string, { value: number; description: string }> = {
  whatsapp: { value: 29, description: "WhatsApp Adicional - ZapFaturamento CRM" },
};

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

  let addonType: string;
  try {
    const body = await request.json() as { addonType?: string };
    addonType = body.addonType ?? "";
    if (!ADDON_CONFIG[addonType]) {
      return NextResponse.json({ error: "Invalid addonType" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspaceSlug = user.clientSlug;
  if (!workspaceSlug) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const addon = ADDON_CONFIG[addonType];

  // Get or create Asaas customer
  let asaasCustomerId: string | null = null;
  try {
    const r = await queryDb<{ stripe_customer_id: string | null }>(
      `SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    asaasCustomerId = r.rows[0]?.stripe_customer_id ?? null;
  } catch (err) {
    console.error(`${TAG} DB error:`, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

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
  const dbAddonType = `extra_${addonType}`;

  try {
    const sub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: addon.value,
      nextDueDate: tomorrow,
      cycle: "MONTHLY",
      description: addon.description,
      externalReference: `${user.id}:addon:${dbAddonType}:${workspaceSlug}`,
    });

    const payments = await getAsaasSubscriptionPayments(sub.id);
    const invoiceUrl = payments.data[0]?.invoiceUrl ?? null;

    if (!invoiceUrl) {
      console.error(`${TAG} No invoiceUrl for sub=${sub.id}`);
      return NextResponse.json({ error: "No payment URL" }, { status: 500 });
    }

    console.log(`${TAG} userId=${user.id} addon=${addonType} workspace=${workspaceSlug} → ${invoiceUrl}`);
    return NextResponse.json({ url: invoiceUrl });
  } catch (err) {
    console.error(`${TAG} Error:`, err);
    return NextResponse.json({ error: "Asaas error" }, { status: 500 });
  }
}
