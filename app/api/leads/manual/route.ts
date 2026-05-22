import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "DB nao configurado." }, { status: 503 });

  const body = (await request.json()) as {
    leadName?: string;
    leadPhone?: string;
    leadEmail?: string;
    note?: string;
    clientSlug?: string;
  };

  const leadName = (body.leadName || "").trim() || null;
  const leadPhone = (body.leadPhone || "").replace(/\D/g, "") || null;
  const leadEmail = (body.leadEmail || "").trim() || null;
  const note = (body.note || "").trim() || null;

  if (!leadName && !leadPhone) {
    return NextResponse.json({ error: "Informe pelo menos nome ou telefone." }, { status: 400 });
  }

  // Agency admins can specify a client; otherwise use their own slug
  const targetSlug = user.role === "agency_admin" && body.clientSlug
    ? body.clientSlug
    : user.clientSlug;

  const result = await queryDb<{ id: number }>(
    `INSERT INTO whatsapp_leads
       (client_slug, whatsapp_number, lead_name, lead_email, lead_phone, source_platform, lead_status)
     VALUES
       ($1, '', $2, $3, $4, 'manual', 'novo_lead')
     RETURNING id`,
    [targetSlug, leadName, leadEmail, leadPhone]
  );

  const leadId = result.rows[0]?.id;

  if (note && leadId) {
    await queryDb(
      `INSERT INTO lead_notes (lead_id, client_slug, author, note)
       VALUES ($1, $2, $3, $4)`,
      [leadId, targetSlug, user.email ?? "sistema", note]
    );
  }

  return NextResponse.json({ ok: true, id: leadId });
}
