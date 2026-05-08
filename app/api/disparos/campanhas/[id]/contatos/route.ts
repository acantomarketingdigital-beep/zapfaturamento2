import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { bulkInsertContatos, getCampanhaDisparoById, listDisparoLogs } from "@/lib/disparos";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";
  if (!clientSlug || !canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const campanha = await getCampanhaDisparoById(id, clientSlug);
  if (!campanha) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });

  const logs = await listDisparoLogs(id);
  return NextResponse.json({ logs });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const clientSlug = user.clientSlug || searchParams.get("clientSlug") || "";
  if (!clientSlug || !canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const campanha = await getCampanhaDisparoById(id, clientSlug);
  if (!campanha) return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  if (campanha.status === "running") {
    return NextResponse.json({ error: "Nao e possivel importar contatos enquanto o disparo esta em andamento." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({})) as { contacts?: { phone: string; name?: string }[] };
  const contacts = body.contacts;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "contacts[] e obrigatorio e nao pode estar vazio." }, { status: 400 });
  }

  // Validate and clean
  const valid = contacts
    .filter((c) => typeof c.phone === "string" && c.phone.trim())
    .map((c) => ({ phone: c.phone.trim(), name: c.name?.trim() || undefined }));

  if (valid.length === 0) {
    return NextResponse.json({ error: "Nenhum contato valido encontrado." }, { status: 400 });
  }

  const inserted = await bulkInsertContatos(id, valid);
  return NextResponse.json({ inserted }, { status: 201 });
}
