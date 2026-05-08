import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { createInstancia, listInstancias } from "@/lib/disparos";

export const runtime = "nodejs";

function resolveClientSlug(user: Awaited<ReturnType<typeof getCurrentUser>>, body?: string): string | null {
  if (!user) return null;
  if (user.clientSlug) return user.clientSlug;
  return typeof body === "string" ? body : null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";

  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const instancias = await listInstancias(clientSlug);
  // Never expose access_token in list
  return NextResponse.json({
    instancias: instancias.map((i) => ({
      id: i.id,
      client_slug: i.client_slug,
      name: i.name,
      phone_number_id: i.phone_number_id,
      waba_id: i.waba_id,
      created_at: i.created_at
    }))
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const clientSlug = resolveClientSlug(user, body.clientSlug as string) ?? (body.clientSlug as string);

  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const { name, phoneNumberId, accessToken, wabaId } = body as Record<string, string>;
  if (!name || !phoneNumberId || !accessToken) {
    return NextResponse.json({ error: "name, phoneNumberId e accessToken sao obrigatorios." }, { status: 400 });
  }

  const instancia = await createInstancia({ clientSlug, name, phoneNumberId, accessToken, wabaId });
  return NextResponse.json({
    instancia: {
      id: instancia.id,
      client_slug: instancia.client_slug,
      name: instancia.name,
      phone_number_id: instancia.phone_number_id,
      waba_id: instancia.waba_id,
      created_at: instancia.created_at
    }
  }, { status: 201 });
}
