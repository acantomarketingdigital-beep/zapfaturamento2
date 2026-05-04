import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { listQuickReplies, createQuickReply } from "@/lib/whatsapp-connections";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const clientSlug = user.clientSlug;
  const replies = await listQuickReplies(clientSlug);
  return NextResponse.json({ replies });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = (await request.json()) as { title?: string; category?: string; message?: string };
  if (!body.title?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Titulo e mensagem sao obrigatorios." }, { status: 400 });
  }

  const clientSlug = user.clientSlug;
  const reply = await createQuickReply({
    clientSlug,
    title: body.title.trim(),
    category: body.category?.trim() || "Geral",
    message: body.message.trim()
  });
  return NextResponse.json({ reply }, { status: 201 });
}
