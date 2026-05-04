import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await params;
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "Banco nao configurado." }, { status: 500 });
  }

  const scopeClientSlug = user.role === "client_user" ? user.clientSlug : null;

  let result;
  if (scopeClientSlug) {
    result = await queryDb<{ id: number }>(
      `DELETE FROM ad_spend WHERE id = $1 AND client_slug = $2 RETURNING id`,
      [Number(id), scopeClientSlug]
    );
  } else {
    result = await queryDb<{ id: number }>(
      `DELETE FROM ad_spend WHERE id = $1 RETURNING id`,
      [Number(id)]
    );
  }

  if (!result.rows[0]) {
    return NextResponse.json({ error: "Registro nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
