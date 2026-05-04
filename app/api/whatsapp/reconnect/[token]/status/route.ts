import { NextResponse } from "next/server";
import { getConnectionByReconnectToken } from "@/lib/whatsapp-connections";
import { getEvolutionConnectionState, isEvolutionConfigured } from "@/lib/evolution-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token invalido." }, { status: 400 });

  const connection = await getConnectionByReconnectToken(token);
  if (!connection) {
    return NextResponse.json({ status: "expired" });
  }

  let liveStatus = connection.status;

  if (isEvolutionConfigured()) {
    const state = await getEvolutionConnectionState(connection.session_id);
    if (state === "open") liveStatus = "connected";
    else if (state === "connecting") liveStatus = "connecting";
    else if (state === "close") liveStatus = "disconnected";
  }

  return NextResponse.json({ status: liveStatus });
}
