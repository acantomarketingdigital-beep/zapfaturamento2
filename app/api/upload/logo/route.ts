import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml"
]);

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Tipo nao permitido. Use PNG, JPG, WEBP ou SVG." },
      { status: 422 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Maximo 2MB." },
      { status: 422 }
    );
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const pathname = `clients/logos/logo-${randomUUID()}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("BLOB_READ_WRITE_TOKEN") || msg.includes("token")) {
      return NextResponse.json(
        { error: "Storage nao configurado. Adicione BLOB_READ_WRITE_TOKEN ao projeto." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro interno ao fazer upload." }, { status: 500 });
  }
}
