import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "DB nao configurado." }, { status: 503 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "ID invalido." }, { status: 400 });

  const result = await queryDb<{ id: number; author: string; note: string; created_at: string }>(
    `SELECT id, author, note, created_at
     FROM lead_notes
     WHERE lead_id = $1
       AND client_slug = $2
     ORDER BY created_at ASC`,
    [leadId, user.clientSlug]
  );

  return NextResponse.json({ notes: result.rows });
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "DB nao configurado." }, { status: 503 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "ID invalido." }, { status: 400 });

  const body = (await request.json()) as { note?: string };
  const note = (body.note || "").trim();
  if (!note) return NextResponse.json({ error: "Nota nao pode ser vazia." }, { status: 400 });

  const targetSlug = user.clientSlug ?? "admin";

  const result = await queryDb<{ id: number }>(
    `INSERT INTO lead_notes (lead_id, client_slug, author, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [leadId, targetSlug, user.email ?? "sistema", note]
  );

  return NextResponse.json({ ok: true, id: result.rows[0]?.id });
}
