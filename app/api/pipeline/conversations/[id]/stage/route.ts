import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { setConversationStage } from "@/lib/whatsapp-connections";

const VALID_STAGES = [
  "novo_lead", "primeiro_contato", "em_atendimento",
  "orcamento_enviado", "agendamento", "compareceu",
  "fechado", "perdido"
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as { stage?: string };

  if (!body.stage || !VALID_STAGES.includes(body.stage as typeof VALID_STAGES[number])) {
    return NextResponse.json({ error: "Etapa invalida." }, { status: 400 });
  }

  await setConversationStage(id, body.stage);
  return NextResponse.json({ ok: true });
}
