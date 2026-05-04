import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { setConversationTemperature } from "@/lib/whatsapp-connections";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as { temperature?: string; reason?: string };

  const temp = body.temperature as "cold" | "warm" | "hot" | undefined;
  if (!temp || !["cold", "warm", "hot"].includes(temp)) {
    return NextResponse.json({ error: "Temperatura invalida." }, { status: 400 });
  }

  await setConversationTemperature(id, temp, body.reason ?? null);
  return NextResponse.json({ ok: true });
}
