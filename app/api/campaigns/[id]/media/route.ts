import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const slot = formData.get("slot") as string | null;
  const clientSlug = formData.get("clientSlug") as string | null;

  if (!file || !slot || !clientSlug) {
    return NextResponse.json({ error: "file, slot e clientSlug sao obrigatorios." }, { status: 400 });
  }
  if (slot !== "1" && slot !== "2") {
    return NextResponse.json({ error: "slot deve ser 1 ou 2." }, { status: 400 });
  }
  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Apenas imagens e videos sao aceitos." }, { status: 400 });
  }

  const maxBytes = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: isImage ? "Imagem deve ter no maximo 5 MB." : "Video deve ter no maximo 50 MB." },
      { status: 400 }
    );
  }

  const col = slot === "1" ? "media_1" : "media_2";

  const current = await queryDb<{ url: string | null }>(
    `SELECT ${col}_url AS url FROM client_campaigns WHERE id = $1 AND client_slug = $2 LIMIT 1`,
    [id, clientSlug]
  );
  const oldUrl = current.rows[0]?.url ?? null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? (isImage ? "jpg" : "mp4");
  const blobPath = `campaigns/${clientSlug}/${id}/media-${slot}.${ext}`;
  const { url } = await put(blobPath, file, { access: "public", addRandomSuffix: true });

  if (oldUrl) {
    try { await del(oldUrl); } catch { /* ignore stale blob */ }
  }

  const mediaType = isImage ? "image" : "video";
  await queryDb(
    `UPDATE client_campaigns SET ${col}_url = $1, ${col}_type = $2 WHERE id = $3 AND client_slug = $4`,
    [url, mediaType, id, clientSlug]
  );

  return NextResponse.json({ url, type: mediaType });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;

  let body: { clientSlug?: string; slot?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const { clientSlug, slot } = body;
  if (!clientSlug || !slot || (slot !== "1" && slot !== "2")) {
    return NextResponse.json({ error: "clientSlug e slot sao obrigatorios." }, { status: 400 });
  }
  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
  }

  const col = slot === "1" ? "media_1" : "media_2";

  const current = await queryDb<{ url: string | null }>(
    `SELECT ${col}_url AS url FROM client_campaigns WHERE id = $1 AND client_slug = $2 LIMIT 1`,
    [id, clientSlug]
  );
  const oldUrl = current.rows[0]?.url ?? null;

  await queryDb(
    `UPDATE client_campaigns SET ${col}_url = NULL, ${col}_type = NULL WHERE id = $1 AND client_slug = $2`,
    [id, clientSlug]
  );

  if (oldUrl) {
    try { await del(oldUrl); } catch { /* ignore */ }
  }

  return NextResponse.json({ success: true });
}
