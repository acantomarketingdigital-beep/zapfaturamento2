import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { deleteGroupCampaign, toggleGroupCampaign } from "@/lib/group-campaigns";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as { is_active?: boolean };

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active obrigatorio." }, { status: 400 });
  }

  const scopeSlug = isAgencyAdmin(user) ? null : (user.clientSlug ?? null);
  await toggleGroupCampaign(id, body.is_active, scopeSlug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  if (!isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Apenas admins podem excluir." }, { status: 403 });
  }

  const { id } = await params;
  await deleteGroupCampaign(id);
  return NextResponse.json({ ok: true });
}
