import { NextResponse } from "next/server";
import { deleteCampaign, saveCampaign } from "@/lib/campaigns";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { clientSlug, name, slug, defaultMessage, isActive, dailyBudgetCents, currency, creativeUrl } = body as Record<string, unknown>;

    if (typeof clientSlug !== "string" || !clientSlug) {
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    }

    if (!canAccessClient(user, clientSlug)) {
      return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
    }

    const campaign = await saveCampaign({
      id,
      clientSlug,
      name: typeof name === "string" ? name : "",
      slug: typeof slug === "string" ? slug : "",
      defaultMessage: typeof defaultMessage === "string" ? defaultMessage : "",
      isActive: isActive !== false,
      dailyBudgetCents: typeof dailyBudgetCents === "number" ? dailyBudgetCents : 0,
      currency: typeof currency === "string" ? currency as import("@/lib/format").Currency : "BRL",
      creativeUrl: typeof creativeUrl === "string" ? creativeUrl : null
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar campanha." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { clientSlug } = body as Record<string, unknown>;

    if (typeof clientSlug !== "string" || !clientSlug) {
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    }

    if (!canAccessClient(user, clientSlug)) {
      return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
    }

    await deleteCampaign(id, clientSlug);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover campanha." },
      { status: 400 }
    );
  }
}
