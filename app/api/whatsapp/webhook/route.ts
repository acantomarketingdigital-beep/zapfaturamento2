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
import { linkLeadContact, findRecentLeadForCapi, confirmLeadCapi, ensureWhatsappInboundLead } from "@/lib/leads";
import { isCrmPlan } from "@/lib/plans";
import { queryDb } from "@/lib/db";
import { setLeadRepliedByPhone } from "@/lib/kanban";
import { getClinicBackendConfigBySlug } from "@/lib/clinics";
import { sendMetaCapiEvent, buildMetaExternalId, buildMetaFbc } from "@/lib/meta-capi";

// Matches common Portuguese ad phrases: "vim do", "vim pelo", "vim da", "vim de", "vim via"
const VIM_DO_PHRASE = /\bvim\b/i;

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

async function tryFireCapiForInbound(clientSlug: string) {
  const lead = await findRecentLeadForCapi(clientSlug);
  if (!lead) return;

  const client = await getClinicBackendConfigBySlug(clientSlug) as {
    metaPixelId?: string;
    metaCapiAccessToken?: string;
    metaTestEventCode?: string;
  } | null;

  if (!client?.metaPixelId || !client?.metaCapiAccessToken) return;

  const eventId = lead.meta_capi_event_id ?? `vim-do-${lead.id}-${Date.now()}`;
  const fbc = lead.fbclid ? buildMetaFbc(lead.fbclid) : undefined;

  try {
    await sendMetaCapiEvent({
      pixelId: client.metaPixelId,
      accessToken: client.metaCapiAccessToken,
      testEventCode: client.metaTestEventCode || undefined,
      eventName: "Lead",
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      actionSource: "website",
      eventSourceUrl: lead.page_url || "",
      userData: {
        client_user_agent: lead.user_agent || undefined,
        fbc: fbc || undefined,
        external_id: buildMetaExternalId(`${clientSlug}:${lead.whatsapp_number}:${eventId}`)
      },
      customData: {
        client_slug: clientSlug,
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
        whatsapp_number: lead.whatsapp_number
      }
    });
    await confirmLeadCapi(lead.id, true, eventId, null);
    console.log("[WA WEBHOOK] CAPI Lead disparado via 'Vim do'", { clientSlug, leadId: lead.id, eventId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await confirmLeadCapi(lead.id, false, eventId, msg).catch(() => {});
    console.error("[WA WEBHOOK] CAPI via 'Vim do' falhou", { clientSlug, leadId: lead.id, err: msg });
  }
}

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
  // Normalize: "messages.upsert" -> "MESSAGES_UPSERT", "connection.update" -> "CONNECTION_UPDATE"
  const event = rawEvent?.replace(/\./g, "_").toUpperCase() ?? "";
  const instanceName = (body.instance as string) ?? "";

  console.log("[WA WEBHOOK] received", { rawEvent, event, instanceName, preview: JSON.stringify(body).slice(0, 800) });

  if (!event || !instanceName) {
    console.log("[WA WEBHOOK] missing event or instance — ignoring");
    return NextResponse.json({ ok: true });
  }

  const connection = await getConnectionBySessionId(instanceName);

  if (!connection) {
    const senderRaw = body.sender as string | undefined;
    const instancePhone = senderRaw ? senderRaw.replace(/@.*/, "").replace(/\D/g, "") : null;
    console.log("[WA WEBHOOK] no connection for instance — trying phone fallback", { instanceName, instancePhone });

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
            pushName?: string;
          };
          const remoteJid = msg.key?.remoteJid ?? "";
          if (!remoteJid || remoteJid.endsWith("@g.us")) continue;
          const contactPhone = remoteJid.replace(/@.*/, "");
          const direction = msg.key?.fromMe ? "outbound" : "inbound";
          if (direction === "inbound") {
            const fallbackText = (msg as { message?: { conversation?: string } }).message?.conversation ?? "";
            const isAdMsg = VIM_DO_PHRASE.test(fallbackText);
            console.log("[WA WEBHOOK] fallback inbound — linking lead", { fallbackSlug, contactPhone, isAdMsg });
            await linkLeadContact(fallbackSlug, contactPhone, msg.pushName ?? null);
            await setLeadRepliedByPhone(fallbackSlug, contactPhone);
            if (isAdMsg) {
              tryFireCapiForInbound(fallbackSlug).catch(() => {});
            }
          }
        }
        return NextResponse.json({ ok: true });
      }
    }

    console.log("[WA WEBHOOK] no connection found and fallback failed for instance", instanceName);
    return NextResponse.json({ ok: true });
  }

  console.log("[WA WEBHOOK] connection", { clientSlug: connection.client_slug, connectionId: connection.id });

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

        // Find a connected sender (any other active connection)
        const allConns = await listConnections();
        const sender = allConns.find((c) => c.status === "connected" && c.id !== connection.id);

        if (sender) {
          const targets: string[] = [];

          // Send to the phone number that was connected
          if (connection.phone_number) {
            targets.push(connection.phone_number);
          }

          // Send to all responsible users who can reconnect and have a phone
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
              console.log(`[WA WEBHOOK] disconnect alert sent to ${phone} via ${sender.session_id}`);
            } catch (err) {
              console.error(`[WA WEBHOOK] failed to send disconnect alert to ${phone}`, String(err));
            }
          }
        } else {
          console.log("[WA WEBHOOK] no active sender found to deliver disconnect alert");
        }
      }
    } else if (state === "connecting") {
      await updateConnectionStatus(connection.id, "connecting");
    }
  }

  if (event === "MESSAGES_UPSERT") {
    const dataRaw = body.data;
    // Handle all Evolution API formats:
    // 1. data is an array of messages (some v2 configs)
    // 2. data.messages is an array (v1 format)
    // 3. data is a single message object with a "key" field (v2 byEvents)
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

    console.log("[WA WEBHOOK] MESSAGES_UPSERT count:", messages.length, "dataType:", Array.isArray(dataRaw) ? "array" : typeof dataRaw, "keys:", dataRaw && typeof dataRaw === "object" ? Object.keys(dataRaw as object).join(",") : "n/a");

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

      console.log("[WA WEBHOOK] msg", { direction, contactPhone, pushName: msg.pushName, msgType: msg.messageType, remoteJid });

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
          const isAdMessage = Boolean(text && VIM_DO_PHRASE.test(text));
          console.log("[WA WEBHOOK] inbound — linking lead", { clientSlug: connection.client_slug, contactPhone, isAdMessage });
          await linkLeadContact(connection.client_slug, contactPhone, msg.pushName ?? null);
          if (await isClientOnCrmPlan(connection.client_slug)) {
            await ensureWhatsappInboundLead(connection.client_slug, contactPhone, msg.pushName ?? null);
          }
          await setLeadRepliedByPhone(connection.client_slug, contactPhone);

          if (isAdMessage) {
            tryFireCapiForInbound(connection.client_slug).catch(() => {});
          }
        } catch (err) {
          console.error("[WA WEBHOOK] linkLead failed (non-fatal)", { err: String(err) });
        }
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
