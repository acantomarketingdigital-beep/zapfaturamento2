import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { createConnectionUser, getConnection, listConnectionUsers } from "@/lib/whatsapp-connections";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connection_id") ?? undefined;
  const clientSlug = user.role === "client_user" ? (user.clientSlug ?? undefined) : undefined;

  const users = await listConnectionUsers(connectionId ?? null, clientSlug ?? null);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = (await request.json()) as {
    connection_id?: string;
    user_name?: string;
    user_phone?: string;
    user_email?: string;
    cargo?: string;
    can_reconnect?: boolean;
    can_view_inbox?: boolean;
    can_reply?: boolean;
  };

  const connectionId = body.connection_id?.trim() ?? "";
  const userName = body.user_name?.trim() ?? "";

  if (!connectionId || !userName) {
    return NextResponse.json({ error: "connection_id e user_name sao obrigatorios." }, { status: 400 });
  }

  const connection = await getConnection(connectionId);
  if (!connection) return NextResponse.json({ error: "Conexao nao encontrada." }, { status: 404 });

  if (!canAccessClient(user, connection.client_slug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const created = await createConnectionUser({
    clientSlug: connection.client_slug,
    connectionId,
    userName,
    userPhone: body.user_phone,
    userEmail: body.user_email,
    cargo: body.cargo,
    canReconnect: body.can_reconnect ?? true,
    canViewInbox: body.can_view_inbox ?? true,
    canReply: body.can_reply ?? false
  });

  return NextResponse.json({ user: created }, { status: 201 });
}
