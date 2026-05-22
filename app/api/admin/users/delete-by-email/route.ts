import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email obrigatorio." }, { status: 400 });

  const result = await queryDb<{ id: string; client_slug: string | null }>(
    `DELETE FROM users WHERE email = $1 RETURNING id, client_slug`,
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: result.rows });
}
