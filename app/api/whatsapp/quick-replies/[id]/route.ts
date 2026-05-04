import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { updateQuickReply, deleteQuickReply } from "@/lib/whatsapp-connections";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    category?: string;
    message?: string;
    is_active?: boolean;
  };

  const reply = await updateQuickReply(id, body);
  return NextResponse.json({ reply });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  await deleteQuickReply(id);
  return NextResponse.json({ ok: true });
}
