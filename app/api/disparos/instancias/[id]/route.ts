import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { deleteInstancia, getInstanciaById } from "@/lib/disparos";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";

  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const instancia = await getInstanciaById(id, clientSlug);
  if (!instancia) return NextResponse.json({ error: "Instancia nao encontrada." }, { status: 404 });

  await deleteInstancia(id, clientSlug);
  return NextResponse.json({ ok: true });
}
