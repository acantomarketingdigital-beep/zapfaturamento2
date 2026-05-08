const META_API_BASE = "https://graph.facebook.com/v18.0";

export type MetaSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendWhatsAppText(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
): Promise<MetaSendResult> {
  const phone = normalizeToE164(to);
  if (!phone) {
    return { ok: false, error: `Numero invalido: ${to}` };
  }

  try {
    const res = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body }
      })
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const msg =
        (data?.error as Record<string, unknown>)?.message ??
        `HTTP ${res.status}`;
      return { ok: false, error: String(msg) };
    }

    const data = (await res.json()) as { messages?: { id: string }[] };
    const messageId = data?.messages?.[0]?.id ?? "";
    return { ok: true, messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function normalizeToE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Already has country code (starts with 55 for Brazil, or other)
  if (digits.length >= 12) return digits;
  // Brazilian numbers without country code (10-11 digits)
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits.length >= 7 ? digits : null;
}
