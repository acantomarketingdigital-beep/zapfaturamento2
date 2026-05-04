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
     SET is_active                = false,
         subscription_canceled_at = COALESCE(subscription_canceled_at, NOW())
     WHERE id = $1`,
    [id]
  );

  const back = request.headers.get("referer") ?? "/dashboard/admin/business";
  return NextResponse.redirect(new URL(back, request.url), 303);
}
