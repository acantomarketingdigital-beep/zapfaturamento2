import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { normalizeMetaMessage, upsertMetaLead, handleWhatsappCloudMessage } from "@/lib/meta-webhook";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // skip validation when secret not configured
  if (!signature) return false;

  const eqIdx = signature.indexOf("=");
  if (eqIdx === -1) return false;
  const algo = signature.slice(0, eqIdx);
  const hex = signature.slice(eqIdx + 1);

  if (algo !== "sha256" || !hex) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== hex.length) return false;

  // Timing-safe comparison
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ hex.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    return NextResponse.json(
      { error: "META_WEBHOOK_VERIFY_TOKEN not configured" },
      { status: 500 }
    );
  }

  console.log("[META VERIFY]", {
    tokenFromMeta: token,
    tokenServer: verifyToken ? verifyToken.slice(0, 4) + "****" : "(not set)",
    match: token === verifyToken,
  });

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  console.log("[META WA] received", { object: b.object });

  // WhatsApp Cloud API
  if (b.object === "whatsapp_business_account") {
    await handleWhatsappCloudMessage(b);
    return NextResponse.json({ ok: true });
  }

  // Instagram / Messenger
  const messages = normalizeMetaMessage(body);
  await Promise.all(messages.map(upsertMetaLead));

  return NextResponse.json({ ok: true });
}
