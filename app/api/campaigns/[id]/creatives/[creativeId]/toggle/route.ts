import { NextResponse } from "next/server";
import { toggleCreativeActive } from "@/lib/campaign-creatives";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; creativeId: string }> };

async function getClientSlug(campaignId: string): Promise<string | null> {
  try {
    const result = await queryDb<{ client_slug: string }>(
      `SELECT client_slug FROM client_campaigns WHERE id = $1 LIMIT 1`,
      [campaignId]
    );
    return result.rows[0]?.client_slug ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id, creativeId } = await params;
  const clientSlug = await getClientSlug(id);
  if (!clientSlug) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  if (!canAccessClient(user, clientSlug)) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const isActive = body.isActive !== false;
    const creative = await toggleCreativeActive(creativeId, id, isActive);
    return NextResponse.json({ creative });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao alterar status." },
      { status: 400 }
    );
  }
}
