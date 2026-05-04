import { NextResponse } from "next/server";
import { getCurrentUser, canAccessClient, isAgencyAdmin } from "@/lib/dashboard-auth";
import {
  createGroupCampaign,
  isValidWhatsAppGroupUrl,
  listGroupCampaigns
} from "@/lib/group-campaigns";
import { getUserPermissions } from "@/lib/permissions";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("client_slug") || null;

  const scopeSlug = isAgencyAdmin(user) ? clientSlug : (user.clientSlug ?? null);
  const campaigns = await listGroupCampaigns(scopeSlug);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = (await request.json()) as {
    client_slug?: string;
    name?: string;
    tracking_slug?: string;
    group_url?: string;
  };

  const clientSlug = isAgencyAdmin(user)
    ? (body.client_slug?.trim() ?? "")
    : (user.clientSlug ?? "");

  if (!clientSlug) return NextResponse.json({ error: "Cliente obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const perms = await getUserPermissions(user.id, user.role);
  if (!perms.grupos_create) {
    return NextResponse.json({ error: "Sem permissao para criar grupos." }, { status: 403 });
  }

  const name = body.name?.trim() ?? "";
  const trackingSlug = body.tracking_slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") ?? "";
  const groupUrl = body.group_url?.trim() ?? "";

  if (!name) return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  if (!trackingSlug) return NextResponse.json({ error: "Slug obrigatorio." }, { status: 400 });
  if (!groupUrl) return NextResponse.json({ error: "Link do grupo obrigatorio." }, { status: 400 });
  if (!isValidWhatsAppGroupUrl(groupUrl)) {
    return NextResponse.json(
      { error: "Link invalido. Use apenas links https://chat.whatsapp.com/..." },
      { status: 400 }
    );
  }

  try {
    const campaign = await createGroupCampaign({ clientSlug, name, trackingSlug, groupUrl });
    return NextResponse.json({ campaign });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Ja existe uma campanha com esse slug para este cliente." }, { status: 409 });
    }
    console.error("[GROUP CAMPAIGNS] create failed", msg);
    return NextResponse.json({ error: "Erro ao criar campanha." }, { status: 500 });
  }
}
