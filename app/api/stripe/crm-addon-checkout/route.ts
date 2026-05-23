import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getStripe, isStripeConfigured, getBaseUrl } from "@/lib/stripe";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[stripe/crm-addon-checkout]";

const ADDON_CONFIG: Record<string, { priceId: string; unitPrice: number }> = {
  whatsapp: { priceId: "price_crm_extra_wa_placeholder", unitPrice: 29 },
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.kind === "env_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
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

  // Get or create Stripe customer
  let customerId: string | null = null;
  try {
    const r = await queryDb<{ stripe_customer_id: string | null }>(
      `SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    customerId = r.rows[0]?.stripe_customer_id ?? null;
  } catch (err) {
    console.error(`${TAG} DB error:`, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

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
    } catch (err) {
      console.error(`${TAG} Failed to create customer:`, err);
      return NextResponse.json({ error: "Stripe customer error" }, { status: 500 });
    }
  }

  const base = getBaseUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: addon.priceId, quantity: 1 }],
      success_url: `${base}/dashboard/assinatura?addon_success=${addonType}`,
      cancel_url: `${base}/dashboard/assinatura`,
      metadata: { userId: user.id, addonType, workspaceSlug },
      locale: "pt-BR",
    });

    console.log(`${TAG} session created userId=${user.id} addon=${addonType} workspace=${workspaceSlug}`);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const e = err as { message?: string; type?: string };
    console.error(`${TAG} stripe.checkout.sessions.create failed:`, e.message);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
