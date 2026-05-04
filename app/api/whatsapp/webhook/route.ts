import { NextResponse } from "next/server";
import {
  getConnectionBySessionId,
  getClientSlugByWhatsappNumber,
  insertMessage,
  listConnectionUsers,
  listConnections,
  updateConnectionStatus,
  upsertConversation,
  wasConversationAdminInitiated
} from "@/lib/whatsapp-connections";
import { isEvolutionConfigured, sendEvolutionTextMessage } from "@/lib/evolution-api";
import { linkLeadContact } from "@/lib/leads";
import { setLeadRepliedByPhone } from "@/lib/kanban";

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
            const adminStarted = await wasConversationAdminInitiated(fallbackSlug, contactPhone);
            if (!adminStarted) {
              console.log("[WA WEBHOOK] fallback inbound — linking lead", { fallbackSlug, contactPhone, pushName: msg.pushName });
              await linkLeadContact(fallbackSlug, contactPhone, msg.pushName ?? null);
            } else {
              console.log("[WA WEBHOOK] fallback inbound — skipping link (admin-initiated conversation)", { fallbackSlug, contactPhone });
            }
            await setLeadRepliedByPhone(fallbackSlug, contactPhone);
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
          const adminStarted = await wasConversationAdminInitiated(connection.client_slug, contactPhone);
          if (!adminStarted) {
            console.log("[WA WEBHOOK] inbound — linking lead", { clientSlug: connection.client_slug, contactPhone });
            await linkLeadContact(connection.client_slug, contactPhone, msg.pushName ?? null);
          } else {
            console.log("[WA WEBHOOK] inbound — skipping link (admin-initiated conversation)", { clientSlug: connection.client_slug, contactPhone });
          }
          await setLeadRepliedByPhone(connection.client_slug, contactPhone);
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
