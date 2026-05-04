import { getCurrentUser } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id: conversationId, msgId } = await params;

  const result = await queryDb<{
    provider_message_id: string | null;
    direction: string;
    message_type: string;
    contact_phone: string;
    session_id: string;
  }>(
    `SELECT m.provider_message_id, m.direction, m.message_type,
            conv.contact_phone, conn.session_id
     FROM whatsapp_messages m
     JOIN whatsapp_conversations conv ON conv.id = m.conversation_id
     JOIN whatsapp_connections conn ON conn.id = conv.connection_id
     WHERE m.id = $1 AND m.conversation_id = $2
     LIMIT 1`,
    [msgId, conversationId]
  );

  const row = result.rows[0];
  if (!row?.provider_message_id) {
    console.error("[MEDIA] no provider_message_id for message", msgId);
    return new Response("Not found", { status: 404 });
  }

  const evoUrl = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
  const evoKey = process.env.EVOLUTION_API_KEY ?? "";

  const remoteJid = row.contact_phone.includes("@")
    ? row.contact_phone
    : `${row.contact_phone}@s.whatsapp.net`;

  const reqBody = {
    key: {
      id: row.provider_message_id,
      remoteJid,
      fromMe: row.direction === "outbound"
    }
  };

  console.log("[MEDIA] fetching from Evolution API", {
    url: `${evoUrl}/message/getBase64FromMediaMessage/${row.session_id}`,
    body: reqBody
  });

  try {
    const res = await fetch(
      `${evoUrl}/chat/getBase64FromMediaMessage/${row.session_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({ message: reqBody })
      }
    );

    const rawText = await res.text();
    console.log("[MEDIA] Evolution API response", res.status, rawText.slice(0, 500));

    if (!res.ok) {
      return new Response(`Media unavailable: ${rawText.slice(0, 200)}`, { status: 404 });
    }

    // Parse the response — handle both JSON and raw base64
    let base64: string | null = null;
    let mimetype: string | null = null;

    try {
      const data = JSON.parse(rawText) as Record<string, unknown>;
      // Try common field names across Evolution API versions
      const b64 = (data.base64 ?? data.data ?? data.buffer ?? data.content) as string | undefined;
      base64 = b64 ?? null;
      mimetype = (data.mimetype ?? data.mimeType ?? data.mime_type) as string | null ?? null;
    } catch {
      // Response might be raw base64 string
      base64 = rawText.trim();
    }

    if (!base64) {
      console.error("[MEDIA] no base64 in response");
      return new Response("No media data", { status: 404 });
    }

    // Strip data URL prefix if present (e.g. "data:audio/ogg;base64,XXXX")
    const raw = base64.includes(",") ? base64.split(",")[1] : base64;
    const buf = Buffer.from(raw, "base64");

    const mimeType =
      mimetype ??
      (row.message_type === "audioMessage" ? "audio/ogg; codecs=opus" : "application/octet-stream");

    return new Response(buf, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (err) {
    console.error("[MEDIA] error", String(err));
    return new Response("Error fetching media", { status: 500 });
  }
}
