import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { listMessages, markConversationRead } from "@/lib/whatsapp-connections";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const messages = await listMessages(id);
  await markConversationRead(id);

  return NextResponse.json({ messages });
}
