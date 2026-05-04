import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { saveInvestment } from "@/lib/investments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    const clientSlug =
      user.role === "client_user"
        ? user.clientSlug || ""
        : String(body.clientSlug || "");

    if (!clientSlug) {
      return NextResponse.json({ error: "Selecione o cliente." }, { status: 400 });
    }

    await saveInvestment({
      clientSlug,
      campaign: String(body.campaign || ""),
      campaignName: body.campaignName != null ? String(body.campaignName) : null,
      internalCampaignId: body.internalCampaignId != null ? Number(body.internalCampaignId) : null,
      internalCampaignSlug: body.internalCampaignSlug != null ? String(body.internalCampaignSlug) : null,
      creative: body.creative != null ? String(body.creative) : null,
      audience: body.audience != null ? String(body.audience) : null,
      investmentCents: Math.round(Number(body.investmentCents || 0)),
      currency: (body.currency === "USD" || body.currency === "EUR") ? body.currency : "BRL",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar investimento." },
      { status: 400 }
    );
  }
}
