import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { getConnection, updateConnectionStatus } from "@/lib/whatsapp-connections";
import {
  createEvolutionInstance,
  deleteEvolutionInstance,
  getEvolutionQRCode,
  isEvolutionConfigured,
  setEvolutionWebhook
} from "@/lib/evolution-api";

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

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: "Evolution API nao configurada." }, { status: 503 });
  }

  try {
    // Try to get QR; if instance doesn't exist or QR is empty, delete and recreate
    let qr = await getEvolutionQRCode(connection.session_id).catch(() => null);

    if (!qr?.base64) {
      // Instance missing or QR expired — force delete and recreate for a fresh QR
      await deleteEvolutionInstance(connection.session_id);
      await createEvolutionInstance(connection.session_id);
      qr = await getEvolutionQRCode(connection.session_id);
    }

    // Always ensure webhook is correctly configured on this instance
    await setEvolutionWebhook(connection.session_id);

    await updateConnectionStatus(id, "connecting");
    return NextResponse.json({ base64: qr.base64, code: qr.code });
  } catch (err) {
    await updateConnectionStatus(id, "error");
    return NextResponse.json(
      { error: `Erro ao obter QR Code: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
