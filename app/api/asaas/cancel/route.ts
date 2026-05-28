import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { cancelAsaasSubscription, isAsaasConfigured } from "@/lib/asaas";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

const TAG = "[asaas/cancel]";

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

  try {
    const r = await queryDb<{ subscription_id: string | null }>(
      `SELECT subscription_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    const subscriptionId = r.rows[0]?.subscription_id ?? null;

    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    await cancelAsaasSubscription(subscriptionId);

    await queryDb(
      `UPDATE users SET
         paid_access              = false,
         subscription_status      = 'canceled',
         is_active                = false,
         subscription_canceled_at = COALESCE(subscription_canceled_at, NOW())
       WHERE id = $1`,
      [user.id]
    );

    console.log(`${TAG} canceled subscription=${subscriptionId} userId=${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`${TAG} Error:`, err);
    return NextResponse.json({ error: "Cancel error" }, { status: 500 });
  }
}
