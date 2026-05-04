import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { deleteTestLeads, type DeleteLeadsMode } from "@/lib/leads";

export const runtime = "nodejs";

const VALID_MODES: DeleteLeadsMode[] = [
  "test_only",
  "client_all",
  "campaign_all",
  "last_n_days",
  "missing_utm_campaign",
];

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  let body: {
    mode?: string;
    clientSlug?: string;
    campaignId?: number;
    days?: number;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo da requisicao invalido." }, { status: 400 });
  }

  const mode = body.mode as DeleteLeadsMode | undefined;
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `Modo invalido. Use: ${VALID_MODES.join(", ")}.` },
      { status: 400 }
    );
  }

  if (mode === "client_all" && !body.clientSlug) {
    return NextResponse.json({ error: "clientSlug obrigatorio para client_all." }, { status: 400 });
  }
  if (mode === "campaign_all" && (!body.clientSlug || !body.campaignId)) {
    return NextResponse.json({ error: "clientSlug e campaignId obrigatorios para campaign_all." }, { status: 400 });
  }

  try {
    const deleted = await deleteTestLeads({
      mode,
      clientSlug: body.clientSlug,
      campaignId: body.campaignId,
      days: body.days,
      userId: user.id,
      userEmail: user.email,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 }
    );
  }
}
