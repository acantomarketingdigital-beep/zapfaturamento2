import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";
import { isEvolutionConfigured, sendEvolutionTextMessage } from "@/lib/evolution-api";
import { insertMessage, upsertConversation } from "@/lib/whatsapp-connections";

type ConvRow = {
  id: string;
  connection_id: string;
  contact_phone: string;
  client_slug: string;
  session_id: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id: conversationId } = await params;
  const body = (await request.json()) as { text?: string };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: "Evolution API nao configurada." }, { status: 503 });
  }

  const convResult = await queryDb<ConvRow>(
    `SELECT wconv.id, wconv.connection_id, wconv.contact_phone, wconv.client_slug, wc.session_id
     FROM whatsapp_conversations wconv
     JOIN whatsapp_connections wc ON wc.id = wconv.connection_id
     WHERE wconv.id = $1`,
    [conversationId]
  );

  const conv = convResult.rows[0];
  if (!conv) return NextResponse.json({ error: "Conversa nao encontrada." }, { status: 404 });

  if (user.role === "client_user" && user.clientSlug !== conv.client_slug) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const text = body.text.trim();
  await sendEvolutionTextMessage(conv.session_id, conv.contact_phone, text);

  const now = new Date().toISOString();
  await upsertConversation({
    clientSlug: conv.client_slug,
    connectionId: conv.connection_id,
    contactPhone: conv.contact_phone,
    lastMessageText: text,
    lastMessageAt: now,
    direction: "outbound"
  });

  await insertMessage({
    clientSlug: conv.client_slug,
    connectionId: conv.connection_id,
    conversationId,
    direction: "outbound",
    messageType: "text",
    text
  });

  return NextResponse.json({ ok: true });
}
