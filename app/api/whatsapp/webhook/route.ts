import { NextResponse } from "next/server";
import {
  getConnectionBySessionId,
  getClientSlugByWhatsappNumber,
  insertMessage,
  listConnectionUsers,
  listConnections,
  updateConnectionStatus,
  upsertConversation
} from "@/lib/whatsapp-connections";
import { isEvolutionConfigured, sendEvolutionTextMessage } from "@/lib/evolution-api";
import {
  linkLeadContact,
  linkLeadByRefCode,
  linkLeadByConnectionWhatsapp,
  getLeadByIdForCapi,
  confirmLeadCapi,
  ensureWhatsappInboundLead
} from "@/lib/leads";
import { isCrmPlan } from "@/lib/plans";
import { queryDb } from "@/lib/db";
import { setLeadRepliedByPhone } from "@/lib/kanban";
import { getClinicBackendConfigBySlug } from "@/lib/clinics";
import {
  sendMetaCapiEvent,
  buildMetaExternalId,
  buildMetaFbc,
  buildMetaHashedPhone
} from "@/lib/meta-capi";

// Level-2 trigger: message contains the word "vim" (Portuguese ad phrase)
const VIM_PHRASE = /\bvim\b/i;

// Level-1 trigger: tracking code injected at click time → (Cod: XXXX)
const REF_CODE_REGEX = /\(Cod:\s*([A-Za-z0-9]+)\)/i;

// ─── Types ────────────────────────────────────────────────────────────────────

type CapiClientConfig = {
  metaPixelId: string;
  metaCapiAccessToken: string;
  metaTestEventCode?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCapiConfig(clientSlug: string): Promise<CapiClientConfig | null> {
  const client = (await getClinicBackendConfigBySlug(clientSlug)) as {
    metaPixelId?: string;
    metaCapiAccessToken?: string;
    metaTestEventCode?: string;
  } | null;
  if (!client?.metaPixelId || !client?.metaCapiAccessToken) return null;
  return {
    metaPixelId: client.metaPixelId,
    metaCapiAccessToken: client.metaCapiAccessToken,
    metaTestEventCode: client.metaTestEventCode || undefined
  };
}

async function isClientOnCrmPlan(clientSlug: string): Promise<boolean> {
  try {
    const r = await queryDb<{ subscription_plan: string | null }>(
      `SELECT subscription_plan FROM users WHERE client_slug = $1 AND role = 'agency_admin' LIMIT 1`,
      [clientSlug]
    );
    return isCrmPlan(r.rows[0]?.subscription_plan);
  } catch {
    return false;
  }
}

// ─── CAPI fire helpers ────────────────────────────────────────────────────────

async function fireCapiForLead(
  leadId: number,
  contactPhone: string,
  config: CapiClientConfig,
  cascadeLevel: 1 | 2 | 3
): Promise<void> {
  const lead = await getLeadByIdForCapi(leadId);
  if (!lead || lead.meta_capi_success === true) return;

  const digits = contactPhone.replace(/\D/g, "");
  const eventId = lead.meta_capi_event_id ?? `wh-l${cascadeLevel}-${lead.id}-${Date.now()}`;
  const fbc = lead.fbclid ? buildMetaFbc(lead.fbclid) : undefined;

  try {
    await sendMetaCapiEvent({
      pixelId: config.metaPixelId,
      accessToken: config.metaCapiAccessToken,
      testEventCode: config.metaTestEventCode,
      eventName: "Lead",
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      actionSource: "website",
      eventSourceUrl: lead.page_url || "",
      userData: {
        client_user_agent: lead.user_agent || undefined,
        fbc: fbc || undefined,
        external_id: buildMetaExternalId(`${lead.client_slug}:${lead.whatsapp_number}:${eventId}`),
        ph: digits ? buildMetaHashedPhone(digits) : undefined
      },
      customData: {
        client_slug: lead.client_slug,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        utm_content: lead.utm_content,
        utm_term: lead.utm_term,
        campaign_id: lead.campaign_id,
        adset_id: lead.adset_id,
        ad_id: lead.ad_id,
        placement: lead.placement,
        fbclid: lead.fbclid,
        gclid: lead.gclid,
        whatsapp_number: lead.whatsapp_number,
        cascade_level: cascadeLevel
      }
    });
    await confirmLeadCapi(lead.id, true, eventId, null);
    console.log(`[WA WEBHOOK] CAPI Level-${cascadeLevel} disparado`, { clientSlug: lead.client_slug, leadId: lead.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await confirmLeadCapi(lead.id, false, eventId, msg).catch(() => {});
    console.error(`[WA WEBHOOK] CAPI Level-${cascadeLevel} falhou`, { leadId, err: msg });
  }
}

async function fireCapiPhoneOnly(
  clientSlug: string,
  connectionWhatsappNumber: string,
  contactPhone: string,
  config: CapiClientConfig,
  cascadeLevel: 2 | 3
): Promise<void> {
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return;
  const eventId = `wh-ph${cascadeLevel}-${Date.now()}-${digits.slice(-4)}`;

  try {
    await sendMetaCapiEvent({
      pixelId: config.metaPixelId,
      accessToken: config.metaCapiAccessToken,
      testEventCode: config.metaTestEventCode,
      eventName: "Lead",
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      actionSource: "website",
      eventSourceUrl: "",
      userData: {
        external_id: buildMetaExternalId(`${clientSlug}:${connectionWhatsappNumber}:${digits}`),
        ph: buildMetaHashedPhone(digits)
      },
      customData: {
        client_slug: clientSlug,
        whatsapp_number: connectionWhatsappNumber,
        cascade_level: cascadeLevel
      }
    });
    console.log(`[WA WEBHOOK] CAPI phone-only Level-${cascadeLevel}`, { clientSlug, digits });
  } catch (err) {
    console.error(`[WA WEBHOOK] CAPI phone-only Level-${cascadeLevel} falhou`, String(err));
  }
}

// ─── 3-Level cascade ─────────────────────────────────────────────────────────

async function processInboundCascade(params: {
  clientSlug: string;
  connectionWhatsappNumber: string;
  contactPhone: string;
  pushName: string | null;
  text: string | null;
}): Promise<void> {
  const { clientSlug, connectionWhatsappNumber, contactPhone, pushName, text } = params;
  const config = await getCapiConfig(clientSlug);

  // ── Level 1: exact (Cod: XXXX) match ───────────────────────────────────────
  const codeMatch = text?.match(REF_CODE_REGEX);
  if (codeMatch) {
    const refCode = codeMatch[1];
    const linked = await linkLeadByRefCode(clientSlug, refCode, contactPhone, pushName);
    if (linked) {
      // Use lead's actual client_slug for CAPI (may differ from connection's client)
      const capiConfig =
        linked.clientSlug !== clientSlug
          ? await getCapiConfig(linked.clientSlug)
          : config;
      if (capiConfig) await fireCapiForLead(linked.leadId, contactPhone, capiConfig, 1);
      console.log("[WA WEBHOOK] cascade Level-1 match", { refCode, leadId: linked.leadId, leadClient: linked.clientSlug });
      return;
    }
    // Code present but not in DB (deleted/expired) → fall through to Level 2
    console.log("[WA WEBHOOK] cascade Level-1 code not found, falling to Level-2", { refCode });
  }

  // ── Level 2: keyword "vim" ──────────────────────────────────────────────────
  if (text && VIM_PHRASE.test(text)) {
    const { leadId } = await linkLeadContact(clientSlug, contactPhone, pushName);
    if (leadId) {
      if (config) await fireCapiForLead(leadId, contactPhone, config, 2);
    } else if (config) {
      await fireCapiPhoneOnly(clientSlug, connectionWhatsappNumber, contactPhone, config, 2);
    }
    console.log("[WA WEBHOOK] cascade Level-2 (vim keyword)", { leadId });
    return;
  }

  // ── Level 3: route / connection match ──────────────────────────────────────
  const linked3 = await linkLeadByConnectionWhatsapp(
    clientSlug,
    connectionWhatsappNumber,
    contactPhone,
    pushName
  );
  if (linked3) {
    if (config && linked3.wasPending) {
      await fireCapiForLead(linked3.leadId, contactPhone, config, 3);
    }
    console.log("[WA WEBHOOK] cascade Level-3 (connection route)", { leadId: linked3.leadId });
  } else if (config) {
    await fireCapiPhoneOnly(clientSlug, connectionWhatsappNumber, contactPhone, config, 3);
    console.log("[WA WEBHOOK] cascade Level-3 phone-only (no unlinked lead in 24h)");
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "whatsapp-webhook", ts: new Date().toISOString() });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided =
      request.headers.get("x-webhook-secret") ?? request.headers.get("apikey") ?? "";
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawEvent = body.event as string;
  const event = rawEvent?.replace(/\./g, "_").toUpperCase() ?? "";
  const instanceName = (body.instance as string) ?? "";

  console.log("[WA WEBHOOK] received", { rawEvent, event, instanceName, preview: JSON.stringify(body).slice(0, 800) });

  if (!event || !instanceName) {
    console.log("[WA WEBHOOK] missing event or instance — ignoring");
    return NextResponse.json({ ok: true });
  }

  const connection = await getConnectionBySessionId(instanceName);

  // ── Fallback: no registered connection — try to match by phone number ───────
  if (!connection) {
    const senderRaw = body.sender as string | undefined;
    const instancePhone = senderRaw ? senderRaw.replace(/@.*/, "").replace(/\D/g, "") : null;
    console.log("[WA WEBHOOK] no connection — trying phone fallback", { instanceName, instancePhone });

    if (event === "MESSAGES_UPSERT" && instancePhone) {
      const fallbackSlug = await getClientSlugByWhatsappNumber(instancePhone);
      console.log("[WA WEBHOOK] phone fallback result", { instancePhone, fallbackSlug });

      if (fallbackSlug) {
        const data = body.data as Record<string, unknown>;
        const messages: unknown[] = Array.isArray(data?.messages)
          ? (data.messages as unknown[])
          : data?.key != null
            ? [data]
            : [];

        for (const rawMsg of messages) {
          const msg = rawMsg as {
            key?: { remoteJid?: string; fromMe?: boolean };
            message?: { conversation?: string };
            pushName?: string;
          };
          const remoteJid = msg.key?.remoteJid ?? "";
          if (!remoteJid || remoteJid.endsWith("@g.us")) continue;
          const contactPhone = remoteJid.replace(/@.*/, "");
          const direction = msg.key?.fromMe ? "outbound" : "inbound";

          if (direction === "inbound") {
            const fallbackText = msg.message?.conversation ?? "";
            await processInboundCascade({
              clientSlug: fallbackSlug,
              connectionWhatsappNumber: instancePhone,
              contactPhone,
              pushName: msg.pushName ?? null,
              text: fallbackText || null
            });
            await setLeadRepliedByPhone(fallbackSlug, contactPhone);
          }
        }
        return NextResponse.json({ ok: true });
      }
    }

    console.log("[WA WEBHOOK] fallback failed for instance", instanceName);
    return NextResponse.json({ ok: true });
  }

  console.log("[WA WEBHOOK] connection", { clientSlug: connection.client_slug, connectionId: connection.id });

  // ── CONNECTION_UPDATE ────────────────────────────────────────────────────────
  if (event === "CONNECTION_UPDATE") {
    const data = body.data as { state?: string; statusReason?: number };
    const state = data?.state;

    if (state === "open") {
      const sender = body.sender as string | undefined;
      const phoneNumber = sender ? sender.replace(/@.*/, "").replace(/\D/g, "") : undefined;
      await updateConnectionStatus(connection.id, "connected", { phoneNumber });
    } else if (state === "close") {
      const { reconnectToken } = await updateConnectionStatus(connection.id, "disconnected", {
        disconnectReason: `statusReason: ${data?.statusReason ?? "desconhecido"}`,
        generateReconnectToken: connection.notify_on_disconnect
      });

      if (reconnectToken && isEvolutionConfigured()) {
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim().replace(/\/$/, "");
        const reconnectUrl = `${baseUrl}/reconectar/${reconnectToken}`;
        const msg =
          `⚠️ *WhatsApp desconectado!*\n\n` +
          `A conexao *"${connection.connection_name}"* foi desconectada do ZapFaturamento.\n\n` +
          `Para reconectar, acesse o link abaixo e escaneie o QR Code:\n\n` +
          `${reconnectUrl}\n\n` +
          `_O link expira em 4 horas._`;

        const allConns = await listConnections();
        const sender = allConns.find((c) => c.status === "connected" && c.id !== connection.id);

        if (sender) {
          const targets: string[] = [];
          if (connection.phone_number) targets.push(connection.phone_number);
          const users = await listConnectionUsers(connection.id);
          for (const u of users) {
            if (u.can_reconnect && u.user_phone) {
              const phone = u.user_phone.replace(/\D/g, "");
              if (phone && !targets.includes(phone)) targets.push(phone);
            }
          }
          for (const phone of targets) {
            try {
              await sendEvolutionTextMessage(sender.session_id, phone, msg);
              console.log(`[WA WEBHOOK] disconnect alert sent to ${phone}`);
            } catch (err) {
              console.error(`[WA WEBHOOK] failed to send disconnect alert to ${phone}`, String(err));
            }
          }
        } else {
          console.log("[WA WEBHOOK] no active sender for disconnect alert");
        }
      }
    } else if (state === "connecting") {
      await updateConnectionStatus(connection.id, "connecting");
    }
  }

  // ── MESSAGES_UPSERT ──────────────────────────────────────────────────────────
  if (event === "MESSAGES_UPSERT") {
    const dataRaw = body.data;
    let messages: unknown[];
    if (Array.isArray(dataRaw)) {
      messages = dataRaw;
    } else {
      const d = dataRaw as Record<string, unknown>;
      messages = Array.isArray(d?.messages)
        ? (d.messages as unknown[])
        : d?.key != null
          ? [d]
          : [];
    }

    console.log("[WA WEBHOOK] MESSAGES_UPSERT count:", messages.length);

    for (const rawMsg of messages) {
      const msg = rawMsg as {
        key?: { remoteJid?: string; id?: string; fromMe?: boolean };
        message?: {
          conversation?: string;
          extendedTextMessage?: { text?: string };
          imageMessage?: { caption?: string };
          audioMessage?: Record<string, unknown>;
          videoMessage?: { caption?: string };
          documentMessage?: { caption?: string; fileName?: string };
        };
        pushName?: string;
        messageTimestamp?: number;
        messageType?: string;
      };

      const remoteJid = msg.key?.remoteJid ?? "";
      if (!remoteJid || remoteJid.endsWith("@g.us")) continue;

      const contactPhone = remoteJid.replace(/@.*/, "");
      const direction = msg.key?.fromMe ? "outbound" : "inbound";

      console.log("[WA WEBHOOK] msg", { direction, contactPhone, pushName: msg.pushName, msgType: msg.messageType });

      const msgType = msg.messageType ?? "text";
      const text =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        msg.message?.imageMessage?.caption ??
        msg.message?.videoMessage?.caption ??
        msg.message?.documentMessage?.caption ??
        null;

      const messageAt = msg.messageTimestamp
        ? new Date(msg.messageTimestamp * 1000).toISOString()
        : new Date().toISOString();

      const displayText = text ?? (msgType === "audioMessage" ? "(áudio)" : "(mídia)");

      let conversationId: string;
      try {
        conversationId = await upsertConversation({
          clientSlug: connection.client_slug,
          connectionId: connection.id,
          contactPhone,
          contactName: direction === "inbound" ? (msg.pushName ?? null) : null,
          lastMessageText: displayText,
          lastMessageAt: messageAt,
          direction
        });
      } catch (err) {
        console.error("[WA WEBHOOK] upsertConversation failed", { err: String(err), contactPhone });
        continue;
      }

      if (direction === "inbound") {
        try {
          await processInboundCascade({
            clientSlug: connection.client_slug,
            connectionWhatsappNumber: connection.phone_number ?? "",
            contactPhone,
            pushName: msg.pushName ?? null,
            text
          });

          await setLeadRepliedByPhone(connection.client_slug, contactPhone);

          if (await isClientOnCrmPlan(connection.client_slug)) {
            await ensureWhatsappInboundLead(connection.client_slug, contactPhone, msg.pushName ?? null);
          }
        } catch (err) {
          console.error("[WA WEBHOOK] inbound processing failed (non-fatal)", { err: String(err) });
        }

        // Link conversation to lead if resolved
        try {
          const leadRow = await queryDb<{ id: number }>(
            `SELECT id FROM whatsapp_leads
             WHERE client_slug = $1 AND lead_phone = $2
             ORDER BY created_at DESC LIMIT 1`,
            [connection.client_slug, contactPhone.replace(/\D/g, "")]
          );
          if (leadRow.rows[0]?.id) {
            await queryDb(
              `UPDATE whatsapp_conversations SET lead_id = $1 WHERE id = $2`,
              [leadRow.rows[0].id, conversationId]
            );
          }
        } catch { /* non-fatal */ }
      }

      try {
        await insertMessage({
          clientSlug: connection.client_slug,
          connectionId: connection.id,
          conversationId,
          providerMessageId: msg.key?.id ?? null,
          direction,
          messageType: msgType,
          text: text ?? null,
          rawPayload: rawMsg
        });
        console.log("[WA WEBHOOK] message saved", { conversationId, direction, contactPhone });
      } catch (err) {
        console.error("[WA WEBHOOK] insertMessage failed", { err: String(err) });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
