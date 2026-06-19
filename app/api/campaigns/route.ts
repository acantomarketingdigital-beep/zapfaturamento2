import { NextResponse } from "next/server";
import { listCampaigns, saveCampaign } from "@/lib/campaigns";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { getUserPermissions } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || "";

  if (!clientSlug) {
    return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  }

  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
  }

  const campaigns = await listCampaigns(clientSlug);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientSlug, name, slug, defaultMessage, isActive, dailyBudgetCents, currency, creativeUrl,
            campaignSource, seoKeywords, seoLocations, seoTitle, seoDescription, seoBullets,
            channel, smsPhone } = body as Record<string, unknown>;

    if (typeof clientSlug !== "string" || !clientSlug) {
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    }

    if (!(await canAccessClient(user, clientSlug))) {
      return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
    }

    const perms = await getUserPermissions(user.id, user.role);
    if (!perms.campanhas_create) {
      return NextResponse.json({ error: "Sem permissao para criar campanhas." }, { status: 403 });
    }

    const campaign = await saveCampaign({
      clientSlug,
      name: typeof name === "string" ? name : "",
      slug: typeof slug === "string" ? slug : "",
      defaultMessage: typeof defaultMessage === "string" ? defaultMessage : "",
      isActive: isActive !== false,
      dailyBudgetCents: typeof dailyBudgetCents === "number" ? dailyBudgetCents : 0,
      currency: typeof currency === "string" ? currency as import("@/lib/format").Currency : "BRL",
      creativeUrl: typeof creativeUrl === "string" ? creativeUrl : null,
      campaignSource: typeof campaignSource === "string" ? campaignSource as import("@/lib/campaigns").CampaignSource : "direct",
      seoKeywords: Array.isArray(seoKeywords) ? seoKeywords.filter((k): k is string => typeof k === "string") : [],
      seoLocations: Array.isArray(seoLocations) ? seoLocations.filter((l): l is string => typeof l === "string") : [],
      seoTitle: typeof seoTitle === "string" ? seoTitle : null,
      seoDescription: typeof seoDescription === "string" ? seoDescription : null,
      seoBullets: Array.isArray(seoBullets) ? seoBullets.filter((b): b is string => typeof b === "string") : null,
      channel: typeof channel === "string" ? channel as import("@/lib/campaigns").CampaignChannel : "whatsapp",
      smsPhone: typeof smsPhone === "string" ? smsPhone : null,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar campanha." },
      { status: 400 }
    );
  }
}
