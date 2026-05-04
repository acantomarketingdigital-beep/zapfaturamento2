import { NextResponse } from "next/server";
import { getConnectionByReconnectToken, updateConnectionStatus } from "@/lib/whatsapp-connections";
import {
  createEvolutionInstance,
  getEvolutionQRCode,
  isEvolutionConfigured
} from "@/lib/evolution-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token invalido." }, { status: 400 });

  const connection = await getConnectionByReconnectToken(token);
  if (!connection) {
    return NextResponse.json(
      { error: "Token invalido ou expirado. Solicite um novo link." },
      { status: 404 }
    );
  }

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: "Servico nao configurado." }, { status: 503 });
  }

  try {
    let qr;
    try {
      qr = await getEvolutionQRCode(connection.session_id);
    } catch {
      await createEvolutionInstance(connection.session_id);
      qr = await getEvolutionQRCode(connection.session_id);
    }

    await updateConnectionStatus(connection.id, "connecting");

    return NextResponse.json({
      base64: qr.base64,
      code: qr.code,
      connectionId: connection.id,
      connectionName: connection.connection_name,
      clientName: connection.client_name ?? connection.client_slug
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao gerar QR Code: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
