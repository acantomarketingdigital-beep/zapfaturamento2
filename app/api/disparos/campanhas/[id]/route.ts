import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { deleteCampanhaDisparo, getCampanhaDisparoById, updateCampanhaDisparo } from "@/lib/disparos";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function resolveSlug(user: Awaited<ReturnType<typeof getCurrentUser>>, searchParams: URLSearchParams): string {
  if (!user) return "";
  return user.clientSlug || searchParams.get("clientSlug") || "";
}

export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const clientSlug = resolveSlug(user, new URL(req.url).searchParams);
  if (!clientSlug || !canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const campanha = await getCampanhaDisparoById(id, clientSlug);
  if (!campanha) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });

  return NextResponse.json({ campanha });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const clientSlug = resolveSlug(user, new URL(request.url).searchParams) || (body.clientSlug as string) || "";
  if (!clientSlug || !canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const updated = await updateCampanhaDisparo(id, clientSlug, {
    name: body.name as string | undefined,
    message: body.message as string | undefined,
    instanciaId: body.instanciaId as string | null | undefined
  });

  if (!updated) {
    return NextResponse.json({ error: "Campanha nao encontrada ou nao pode ser editada (status diferente de draft)." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const clientSlug = resolveSlug(user, new URL(req.url).searchParams);
  if (!clientSlug || !canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const deleted = await deleteCampanhaDisparo(id, clientSlug);
  if (!deleted) {
    return NextResponse.json({ error: "Campanha nao encontrada ou com disparo em andamento." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
