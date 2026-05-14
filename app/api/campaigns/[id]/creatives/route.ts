import { NextResponse } from "next/server";
import { listCreatives, saveCreative } from "@/lib/campaign-creatives";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";
import { getUserPermissions } from "@/lib/permissions";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const clientSlug = await getClientSlug(id);
  if (!clientSlug) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  if (!(await canAccessClient(user, clientSlug))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const creatives = await listCreatives(id);
  return NextResponse.json({ creatives });
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const clientSlug = await getClientSlug(id);
  if (!clientSlug) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  if (!(await canAccessClient(user, clientSlug))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const perms = await getUserPermissions(user.id, user.role);
  if (!perms.criativos_create) {
    return NextResponse.json({ error: "Sem permissao para criar criativos." }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const creative = await saveCreative({
      campaignId: id,
      clientSlug,
      name: typeof body.name === "string" ? body.name : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      defaultMessage: typeof body.defaultMessage === "string" ? body.defaultMessage : null,
      metaAdsUrl: typeof body.metaAdsUrl === "string" ? body.metaAdsUrl : null,
      isActive: body.isActive !== false,
      isSitelink: body.isSitelink === true,
      sitelinkDesc1: typeof body.sitelinkDesc1 === "string" ? body.sitelinkDesc1 : null,
      sitelinkDesc2: typeof body.sitelinkDesc2 === "string" ? body.sitelinkDesc2 : null,
    });
    return NextResponse.json({ creative }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar criativo." },
      { status: 400 }
    );
  }
}
