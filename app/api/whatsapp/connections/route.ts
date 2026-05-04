import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { createConnection, listConnections } from "@/lib/whatsapp-connections";
import { createEvolutionInstance, isEvolutionConfigured } from "@/lib/evolution-api";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("client_slug") || null;
  const scopedSlug = user.clientSlug ?? clientSlug;

  const connections = await listConnections(scopedSlug);
  return NextResponse.json({ connections });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = (await request.json()) as { client_slug?: string; connection_name?: string };
  const clientSlug = user.clientSlug || body.client_slug?.trim() || "";
  const connectionName = body.connection_name?.trim() ?? "";

  if (!clientSlug || !connectionName) {
    return NextResponse.json(
      { error: "client_slug e connection_name sao obrigatorios." },
      { status: 400 }
    );
  }

  if (!canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
  }

  const connection = await createConnection({ clientSlug, connectionName });

  if (isEvolutionConfigured()) {
    try {
      await createEvolutionInstance(connection.session_id);
    } catch (err) {
      console.error("Evolution API createInstance failed:", err);
    }
  }

  return NextResponse.json({ connection }, { status: 201 });
}
