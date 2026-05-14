import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { createCampanhaDisparo, listCampanhasDisparos } from "@/lib/disparos";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";

  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const campanhas = await listCampanhasDisparos(clientSlug);
  return NextResponse.json({ campanhas });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const clientSlug = user.clientSlug || (body.clientSlug as string) || "";

  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const name = body.name as string;
  if (!name?.trim()) return NextResponse.json({ error: "name e obrigatorio." }, { status: 400 });

  const campanha = await createCampanhaDisparo({
    clientSlug,
    name: name.trim(),
    message: (body.message as string) || "",
    instanciaId: (body.instanciaId as string) || null
  });

  return NextResponse.json({ campanha }, { status: 201 });
}
