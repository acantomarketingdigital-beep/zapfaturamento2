import { hasDatabaseConfig, queryDb } from "@/lib/db";

// ─── WhatsApp Cloud API ───────────────────────────────────────────────────────

type WACloudValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<{
    from?: string;
    id?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
  }>;
};

async function getClientSlugByBusinessPhone(phone: string): Promise<string | null> {
  if (!hasDatabaseConfig()) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const result = await queryDb<{ client_slug: string }>(
    `SELECT DISTINCT client_slug FROM whatsapp_leads
     WHERE REGEXP_REPLACE(whatsapp_number, '[^0-9]', '', 'g') = $1
     LIMIT 1`,
    [digits]
  );
  return result.rows[0]?.client_slug ?? null;
}

async function linkWhatsappLeadByPhone(
  clientSlug: string,
  contactPhone: string,
  pushName: string | null
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return;
  try {
    const result = await queryDb<{ id: number }>(
      `UPDATE whatsapp_leads
       SET lead_phone  = $2,
           lead_name   = COALESCE(NULLIF(lead_name, ''), $3),
           has_replied = true,
           replied_at  = COALESCE(replied_at, NOW())
       WHERE id = (
         SELECT id FROM whatsapp_leads
         WHERE client_slug = $1
           AND (lead_phone IS NULL OR lead_phone = $2)
         ORDER BY created_at DESC
         LIMIT 1
       )
       RETURNING id`,
      [clientSlug, digits, pushName ?? null]
    );
    if (result.rows.length > 0) {
      console.log("[META WA] lead linked", { id: result.rows[0].id, clientSlug, digits, pushName });
    } else {
      console.log("[META WA] no lead found to link", { clientSlug, digits });
    }
  } catch (err) {
    console.error("[META WA] linkWhatsappLeadByPhone error:", err);
  }
}

const norm = (v: string | null | undefined) => String(v ?? "").replace(/\D/g, "");

export async function handleWhatsappCloudMessage(body: Record<string, unknown>): Promise<void> {
  console.log("[META WA] RAW BODY", JSON.stringify(body, null, 2));

  const entries = body.entry as Array<Record<string, unknown>> | undefined;
  if (!entries?.length) {
    console.log("[META WA] no entries — ignoring");
    return;
  }

  for (const entry of entries) {
    const changes = entry.changes as Array<Record<string, unknown>> | undefined;
    if (!changes?.length) continue;

    for (const change of changes) {
      console.log("[META WA] change.field", change.field);
      if (change.field !== "messages") continue;

      const value = change.value as WACloudValue | undefined;
      const metadata = value?.metadata;
      const messages = value?.messages;
      const contacts = value?.contacts;

      console.log("[META WA] metadata", metadata);
      console.log("[META WA] contacts", JSON.stringify(contacts));
      console.log("[META WA] messages count", messages?.length ?? 0);

      if (!messages?.length) {
        console.log("[META WA] no messages array — likely status/read update");
        continue;
      }

      const rawBusinessPhone = metadata?.display_phone_number ?? "";
      const businessPhone = norm(rawBusinessPhone);
      console.log("[META WA] phone from payload", { raw: rawBusinessPhone, normalized: businessPhone });

      const clientSlug = await getClientSlugByBusinessPhone(businessPhone);
      console.log("[META WA] clientSlug", clientSlug, "| businessPhone", businessPhone);

      if (!clientSlug) {
        console.log("[META WA] no client found — whatsapp_number in DB does not match businessPhone", businessPhone);
        continue;
      }

      for (const msg of messages) {
        console.log("[META WA] message", JSON.stringify(msg));

        const rawFrom = msg.from ?? "";
        const contactPhone = norm(rawFrom);
        if (!contactPhone) {
          console.log("[META WA] empty from — skipping");
          continue;
        }

        const contactRecord = contacts?.find((c) => c.wa_id === msg.from);
        const pushName = contactRecord?.profile?.name ?? null;

        console.log("[META WA] contact", JSON.stringify(contactRecord));
        console.log("[META WA] contactPhone raw=", rawFrom, "normalized=", contactPhone);
        console.log("[META WA] pushName", pushName);
        console.log("[META WA] lead linking attempt", { clientSlug, contactPhone, pushName });

        await linkWhatsappLeadByPhone(clientSlug, contactPhone, pushName);
      }
    }
  }
}

export type MetaChannel = "instagram" | "messenger";

export type NormalizedMetaMessage = {
  channel: MetaChannel;
  leadExternalId: string;
  pageId: string;
  leadName: string | null;
  leadUsername: string | null;
  messageText: string | null;
  messageType: "text" | "attachment" | "postback" | "unknown";
  timestamp: string;
  rawPayload: unknown;
};

type MetaMessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type: string; payload?: unknown }>;
  };
  postback?: {
    payload: string;
    title: string;
  };
};

type MetaWebhookPayload = {
  object: string;
  entry: Array<{
    id: string;
    messaging?: MetaMessagingEvent[];
    time?: number;
  }>;
};

export function normalizeMetaMessage(body: unknown): NormalizedMetaMessage[] {
  const payload = body as MetaWebhookPayload;
  if (!payload?.entry?.length) return [];

  const channel: MetaChannel = payload.object === "instagram" ? "instagram" : "messenger";
  const results: NormalizedMetaMessage[] = [];

  for (const entry of payload.entry) {
    const pageId = entry.id;
    const events = entry.messaging ?? [];

    for (const event of events) {
      const senderId = event.sender?.id;
      if (!senderId) continue;
      if (event.message?.is_echo) continue;

      const timestamp = event.timestamp
        ? new Date(event.timestamp).toISOString()
        : new Date().toISOString();

      let messageText: string | null = null;
      let messageType: NormalizedMetaMessage["messageType"] = "unknown";

      if (event.message) {
        if (event.message.text) {
          messageText = event.message.text;
          messageType = "text";
        } else if (event.message.attachments?.length) {
          messageType = "attachment";
          messageText = `(${event.message.attachments[0]?.type ?? "anexo"})`;
        }
      } else if (event.postback) {
        messageType = "postback";
        messageText = event.postback.title || event.postback.payload;
      }

      results.push({
        channel,
        leadExternalId: senderId,
        pageId,
        leadName: null,
        leadUsername: null,
        messageText,
        messageType,
        timestamp,
        rawPayload: event,
      });
    }
  }

  return results;
}

async function getClientForPage(
  channel: MetaChannel,
  pageId: string
): Promise<{ clientSlug: string; clientName: string } | null> {
  if (!hasDatabaseConfig()) return null;
  const col = channel === "instagram" ? "meta_instagram_id" : "meta_page_id";
  try {
    const result = await queryDb<{ client_slug: string; client_name: string }>(
      `SELECT client_slug, client_name FROM clients WHERE ${col} = $1 AND is_active = TRUE LIMIT 1`,
      [pageId]
    );
    const row = result.rows[0];
    if (row) return { clientSlug: row.client_slug, clientName: row.client_name };
  } catch {
    // non-fatal
  }
  return null;
}

export async function upsertMetaLead(msg: NormalizedMetaMessage): Promise<void> {
  if (!hasDatabaseConfig()) return;

  const client = await getClientForPage(msg.channel, msg.pageId);
  const clientSlug = client?.clientSlug ?? `meta-${msg.pageId}`;
  const clientName = client?.clientName ?? (msg.channel === "instagram" ? "Instagram" : "Messenger");
  const sourcePlatform = msg.channel === "instagram" ? "Instagram Direct" : "Facebook Messenger";

  try {
    await queryDb(
      `INSERT INTO whatsapp_leads
         (channel, lead_external_id, page_id, lead_name, lead_username,
          message_text, last_message_at, source_payload,
          client_slug, client_name, whatsapp_number,
          source_platform, page_url, page_path, redirect_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::jsonb, $9, $10, '', $11, '', '', '')
       ON CONFLICT (channel, lead_external_id)
       WHERE lead_external_id IS NOT NULL
       DO UPDATE SET
         message_text    = EXCLUDED.message_text,
         last_message_at = EXCLUDED.last_message_at,
         source_payload  = EXCLUDED.source_payload,
         lead_name       = COALESCE(whatsapp_leads.lead_name, EXCLUDED.lead_name),
         lead_username   = COALESCE(whatsapp_leads.lead_username, EXCLUDED.lead_username)`,
      [
        msg.channel,
        msg.leadExternalId,
        msg.pageId,
        msg.leadName,
        msg.leadUsername,
        msg.messageText,
        msg.timestamp,
        JSON.stringify(msg.rawPayload),
        clientSlug,
        clientName,
        sourcePlatform,
      ]
    );
  } catch (err) {
    console.error("[meta-webhook] upsertMetaLead error:", err);
  }
}
