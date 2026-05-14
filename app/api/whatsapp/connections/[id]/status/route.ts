import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { getConnection, updateConnectionStatus } from "@/lib/whatsapp-connections";
import { getEvolutionConnectionState, isEvolutionConfigured, setEvolutionWebhook } from "@/lib/evolution-api";

export async function GET(
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

  if (!(await canAccessClient(user, connection.client_slug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  let liveStatus = connection.status;

  if (isEvolutionConfigured()) {
    const state = await getEvolutionConnectionState(connection.session_id);
    if (state === "open") {
      liveStatus = "connected";
      if (connection.status !== "connected") {
        await updateConnectionStatus(id, "connected");
      }
      // Always refresh webhook config so messages start arriving
      void setEvolutionWebhook(connection.session_id);
    } else if (state === "connecting") {
      liveStatus = "connecting";
    } else if (state === "close") {
      liveStatus = "disconnected";
      if (connection.status === "connected") {
        await updateConnectionStatus(id, "disconnected");
      }
    }
  }

  return NextResponse.json({ status: liveStatus, phone_number: connection.phone_number });
}
