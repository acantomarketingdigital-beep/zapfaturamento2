import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "DB nao configurado." }, { status: 503 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "ID invalido." }, { status: 400 });

  const body = (await request.json()) as { tags?: string[]; assignedTo?: string | null };

  const setParts: string[] = [];
  const values: unknown[] = [leadId];

  if (body.tags !== undefined) {
    values.push(body.tags);
    setParts.push(`tags = $${values.length}`);
  }

  if ("assignedTo" in body) {
    values.push(body.assignedTo ?? null);
    setParts.push(`assigned_to = $${values.length}`);
  }

  if (setParts.length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  await queryDb(
    `UPDATE whatsapp_leads SET ${setParts.join(", ")} WHERE id = $1`,
    values
  );

  return NextResponse.json({ ok: true });
}
