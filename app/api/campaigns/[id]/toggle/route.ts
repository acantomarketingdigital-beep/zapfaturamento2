import { NextResponse } from "next/server";
import { toggleCampaignActive } from "@/lib/campaigns";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { clientSlug, isActive } = body as Record<string, unknown>;

    if (typeof clientSlug !== "string" || !clientSlug) {
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    }

    if (!(await canAccessClient(user, clientSlug))) {
      return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
    }

    const campaign = await toggleCampaignActive(id, clientSlug, isActive === true);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar campanha." },
      { status: 400 }
    );
  }
}
