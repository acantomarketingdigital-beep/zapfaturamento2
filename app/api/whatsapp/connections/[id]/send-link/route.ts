import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { generateConnectToken, getConnection, listConnections } from "@/lib/whatsapp-connections";
import { isEvolutionConfigured, sendEvolutionTextMessage } from "@/lib/evolution-api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const connection = await getConnection(id);
  if (!connection) return NextResponse.json({ error: "Conexao nao encontrada." }, { status: 404 });

  if (!(await canAccessClient(user, connection.client_slug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = (await request.json()) as { phone?: string };
  const phone = body.phone?.replace(/\D/g, "") ?? "";

  const token = await generateConnectToken(id);
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br"
  ).trim().replace(/\/$/, "");
  const link = `${baseUrl}/reconectar/${token}`;

  let sent = false;

  if (phone && isEvolutionConfigured()) {
    const allConns = await listConnections();
    const sender = allConns.find((c) => c.status === "connected");
    if (sender) {
      try {
        const msg =
          `Ola! Para conectar o WhatsApp ao *ZapFaturamento*, acesse o link abaixo:\n\n` +
          `${link}\n\n` +
          `Siga as instrucoes na tela para escanear o QR Code com seu WhatsApp Business.\n\n` +
          `_O link expira em 48 horas._`;
        await sendEvolutionTextMessage(sender.session_id, phone, msg);
        sent = true;
      } catch (err) {
        console.error("[SEND-LINK] failed to send whatsapp", String(err));
      }
    }
  }

  return NextResponse.json({ ok: true, link, sent });
}
