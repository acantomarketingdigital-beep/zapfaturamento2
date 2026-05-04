import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { createMagicLoginToken } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const userId = String(body.userId || "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });
  }

  try {
    const { token, phone } = await createMagicLoginToken(userId);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").replace(/\/$/, "");
    const magicUrl = `${baseUrl}/login/magic/${token}`;
    return NextResponse.json({ magicUrl, phone });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar link." },
      { status: 400 }
    );
  }
}
