import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { setConversationDeal } from "@/lib/whatsapp-connections";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    value?: number | null;
    status?: "open" | "won" | "lost";
  };

  if (body.status && !["open", "won", "lost"].includes(body.status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  await setConversationDeal(id, body);
  return NextResponse.json({ ok: true });
}
