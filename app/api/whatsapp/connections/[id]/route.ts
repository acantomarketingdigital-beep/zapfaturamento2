import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { getConnection, setConnectionNotifyOnDisconnect } from "@/lib/whatsapp-connections";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const connection = await getConnection(id);
  if (!connection) return NextResponse.json({ error: "Conexao nao encontrada." }, { status: 404 });

  if (!canAccessClient(user, connection.client_slug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = (await request.json()) as { notify_on_disconnect?: boolean };

  if (typeof body.notify_on_disconnect === "boolean") {
    await setConnectionNotifyOnDisconnect(id, body.notify_on_disconnect);
  }

  return NextResponse.json({ ok: true });
}
