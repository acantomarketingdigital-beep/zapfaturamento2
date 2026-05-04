import { NextResponse } from "next/server";
import { getCurrentUser, canAccessClient } from "@/lib/dashboard-auth";
import { getAutoImportPreview, executeAutoImport } from "@/lib/investments";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || user.clientSlug || "";
  if (!clientSlug) return NextResponse.json({ error: "clientSlug obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const items = await getAutoImportPreview(clientSlug);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const body = (await request.json()) as { clientSlug?: string; campaignId?: string };
  const clientSlug = body.clientSlug || user.clientSlug || "";
  const { campaignId } = body;

  if (!clientSlug) return NextResponse.json({ error: "clientSlug obrigatorio." }, { status: 400 });
  if (!campaignId) return NextResponse.json({ error: "campaignId obrigatorio." }, { status: 400 });
  if (!canAccessClient(user, clientSlug)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  try {
    const result = await executeAutoImport(clientSlug, campaignId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 400 });
  }
}
