import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { slug } = await params;
  if (user.clientSlug && user.clientSlug !== slug)
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  if (!hasDatabaseConfig()) return NextResponse.json({ numbers: [] });

  const result = await queryDb<{ id: number; phone_number: string; label: string }>(
    `SELECT id, phone_number, label FROM client_whatsapp_numbers WHERE client_slug = $1 ORDER BY id`,
    [slug]
  );
  return NextResponse.json({ numbers: result.rows });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { slug } = await params;
  if (user.clientSlug && user.clientSlug !== slug)
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json() as { phone_number?: string; label?: string };
  const phone = (body.phone_number ?? "").replace(/\D/g, "");
  const label = (body.label ?? "").trim();

  if (!phone) return NextResponse.json({ error: "Numero invalido." }, { status: 400 });

  const result = await queryDb<{ id: number; phone_number: string; label: string }>(
    `INSERT INTO client_whatsapp_numbers (client_slug, phone_number, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_slug, phone_number) DO UPDATE SET label = EXCLUDED.label
     RETURNING id, phone_number, label`,
    [slug, phone, label]
  );
  return NextResponse.json({ number: result.rows[0] });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { slug } = await params;
  if (user.clientSlug && user.clientSlug !== slug)
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  await queryDb(
    `DELETE FROM client_whatsapp_numbers WHERE id = $1 AND client_slug = $2`,
    [id, slug]
  );
  return NextResponse.json({ ok: true });
}
