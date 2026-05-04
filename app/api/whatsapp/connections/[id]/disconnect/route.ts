import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { deleteConnection, getConnection } from "@/lib/whatsapp-connections";
import { deleteEvolutionInstance } from "@/lib/evolution-api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const connection = await getConnection(id);
  if (!connection) {
    return NextResponse.json({ error: "Conexao nao encontrada." }, { status: 404 });
  }

  if (!canAccessClient(user, connection.client_slug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  await deleteEvolutionInstance(connection.session_id);
  await deleteConnection(id);

  return NextResponse.json({ ok: true });
}
