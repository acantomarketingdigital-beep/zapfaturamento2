import { NextResponse } from "next/server";
import { requestMagicLogin } from "@/lib/invites";
import { buildWhatsAppMagicUrl } from "@/lib/invite-shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const emailOrPhone = String(body.emailOrPhone || "").trim();
  if (!emailOrPhone) {
    return NextResponse.json({ error: "Informe e-mail ou WhatsApp." }, { status: 400 });
  }

  const result = await requestMagicLogin(emailOrPhone);
  if (!result.found || !result.magicUrl) {
    // Don't reveal if user exists — always return ok
    return NextResponse.json({ ok: true, waUrl: null });
  }

  const waUrl = result.phone
    ? buildWhatsAppMagicUrl(result.phone, result.magicUrl)
    : null;

  return NextResponse.json({ ok: true, waUrl, magicUrl: result.magicUrl });
}
