import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getStripe, getBaseUrl } from "@/lib/stripe";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.kind === "env_admin") {
    return NextResponse.redirect(new URL("/dashboard/assinatura", request.url), 303);
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.redirect(new URL("/dashboard/assinatura", request.url), 303);
  }

  const dbResult = await queryDb<{ stripe_customer_id: string | null }>(
    `SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
    [user.id]
  );

  const customerId = dbResult.rows[0]?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.redirect(new URL("/dashboard/assinatura", request.url), 303);
  }

  const base = getBaseUrl();
  const stripe = getStripe();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/dashboard/assinatura`,
    });
    return NextResponse.redirect(portalSession.url, 303);
  } catch (err: unknown) {
    const e = err as { message?: string; type?: string; code?: string };
    console.error(`[stripe/portal] billingPortal.sessions.create failed — type=${e.type} code=${e.code} message=${e.message}`);
    return NextResponse.redirect(new URL("/dashboard/assinatura", request.url), 303);
  }
}
