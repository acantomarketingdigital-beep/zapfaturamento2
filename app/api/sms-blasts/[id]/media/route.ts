import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  const clientSlug = formData.get("clientSlug") as string | null;

  if (!file || !clientSlug)
    return NextResponse.json({ error: "file e clientSlug sao obrigatorios." }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Apenas imagens sao aceitas." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Imagem deve ter no maximo 10 MB." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug)))
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const current = await queryDb<{ url: string | null }>(
    `SELECT promo_image_url AS url FROM sms_blast_campaigns WHERE id=$1 AND client_slug=$2 LIMIT 1`,
    [id, clientSlug]
  );
  const oldUrl = current.rows[0]?.url ?? null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const blobPath = `sms-blasts/${clientSlug}/${id}/promo.${ext}`;
  const { url } = await put(blobPath, file, { access: "public", addRandomSuffix: true });

  if (oldUrl) { try { await del(oldUrl); } catch { /* ignore */ } }

  await queryDb(
    `UPDATE sms_blast_campaigns SET promo_image_url=$1, updated_at=NOW() WHERE id=$2 AND client_slug=$3`,
    [url, id, clientSlug]
  );

  return NextResponse.json({ url });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const { clientSlug } = body;

  if (typeof clientSlug !== "string" || !clientSlug)
    return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug)))
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const current = await queryDb<{ url: string | null }>(
    `SELECT promo_image_url AS url FROM sms_blast_campaigns WHERE id=$1 AND client_slug=$2 LIMIT 1`,
    [id, clientSlug]
  );
  const oldUrl = current.rows[0]?.url ?? null;

  await queryDb(
    `UPDATE sms_blast_campaigns SET promo_image_url=NULL, updated_at=NOW() WHERE id=$1 AND client_slug=$2`,
    [id, clientSlug]
  );

  if (oldUrl) { try { await del(oldUrl); } catch { /* ignore */ } }

  return NextResponse.json({ success: true });
}
