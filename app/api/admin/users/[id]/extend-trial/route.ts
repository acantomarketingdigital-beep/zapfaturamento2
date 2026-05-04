import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await queryDb(
    `UPDATE users
     SET trial_expires_at = GREATEST(trial_expires_at, NOW()) + INTERVAL '7 days'
     WHERE id = $1 AND plan_type = 'trial'`,
    [id]
  );

  const back = request.headers.get("referer") ?? "/dashboard/admin/business";
  return NextResponse.redirect(new URL(back, request.url), 303);
}
