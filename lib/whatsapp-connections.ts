import { randomUUID } from "node:crypto";
import { clientSlugScope, hasDatabaseConfig, queryDb } from "@/lib/db";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type WhatsappConnection = {
  id: string;
  created_at: string;
  updated_at: string;
  client_slug: string;
  client_name: string | null;
  connection_name: string;
  provider: string;
  status: ConnectionStatus;
  phone_number: string | null;
  session_id: string;
  qr_code: string | null;
  qr_expires_at: string | null;
  last_connected_at: string | null;
  last_disconnected_at: string | null;
  disconnect_reason: string | null;
  notify_on_disconnect: boolean;
  reconnect_token: string | null;
  reconnect_token_expires_at: string | null;
  is_active: boolean;
};

export type WhatsappConversation = {
  id: string;
  created_at: string;
  updated_at: string;
  client_slug: string;
  connection_id: string;
  lead_id: number | null;
  contact_phone: string;
  contact_name: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
  status: string;
  assigned_to: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  connection_name: string | null;
  client_name: string | null;
  temperature: "cold" | "warm" | "hot";
  hot_reason: string | null;
  hot_marked_at: string | null;
  pipeline_stage: string;
  deal_value: number | null;
  deal_status: "open" | "won" | "lost";
  deal_source: string;
  deal_closed_at: string | null;
};

export type QuickReply = {
  id: string;
  created_at: string;
  updated_at: string;
  client_slug: string | null;
  title: string;
  category: string;
  message: string;
  is_active: boolean;
};

export type WhatsappMessage = {
  id: string;
  created_at: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  text: string | null;
  media_url: string | null;
  status: string;
  provider_message_id: string | null;
};

export type ConnectionUser = {
  id: string;
  created_at: string;
  client_slug: string;
  connection_id: string | null;
  user_name: string;
  user_phone: string | null;
  user_email: string | null;
  cargo: string | null;
  can_reconnect: boolean;
  can_view_inbox: boolean;
  can_reply: boolean;
};

// ─── Connections ────────────────────────────────────────────────────────────

export async function listConnections(clientSlug?: string | null): Promise<WhatsappConnection[]> {
  if (!hasDatabaseConfig()) return [];
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (clientSlug) {
    params.push(clientSlug);
    conditions.push(clientSlugScope(params.length, "wc"));
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await queryDb<WhatsappConnection>(
    `SELECT wc.*, c.client_name
     FROM whatsapp_connections wc
     LEFT JOIN clients c ON c.client_slug = wc.client_slug
     ${where}
     ORDER BY wc.created_at DESC`,
    params
  );
  return result.rows;
}

export async function getConnection(id: string): Promise<WhatsappConnection | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<WhatsappConnection>(
    `SELECT wc.*, c.client_name
     FROM whatsapp_connections wc
     LEFT JOIN clients c ON c.client_slug = wc.client_slug
     WHERE wc.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getConnectionBySessionId(
  sessionId: string
): Promise<WhatsappConnection | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<WhatsappConnection>(
    `SELECT wc.*, c.client_name
     FROM whatsapp_connections wc
     LEFT JOIN clients c ON c.client_slug = wc.client_slug
     WHERE wc.session_id = $1`,
    [sessionId]
  );
  return result.rows[0] ?? null;
}

export async function getClientSlugByWhatsappNumber(phone: string): Promise<string | null> {
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

export async function getConnectionByReconnectToken(
  token: string
): Promise<WhatsappConnection | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<WhatsappConnection>(
    `SELECT wc.*, c.client_name
     FROM whatsapp_connections wc
     LEFT JOIN clients c ON c.client_slug = wc.client_slug
     WHERE wc.reconnect_token = $1
       AND wc.reconnect_token_expires_at > NOW()`,
    [token]
  );
  return result.rows[0] ?? null;
}

export async function createConnection(input: {
  clientSlug: string;
  connectionName: string;
}): Promise<WhatsappConnection> {
  const id = randomUUID();
  const sessionId = `zap-${input.clientSlug.slice(0, 20)}-${id.slice(0, 8)}`;

  const result = await queryDb<WhatsappConnection>(
    `INSERT INTO whatsapp_connections
       (id, client_slug, connection_name, provider, status, session_id)
     VALUES ($1, $2, $3, 'evolution', 'disconnected', $4)
     RETURNING *, NULL AS client_name`,
    [id, input.clientSlug, input.connectionName, sessionId]
  );
  return result.rows[0];
}

export async function updateConnectionStatus(
  id: string,
  status: ConnectionStatus,
  extras?: {
    phoneNumber?: string;
    disconnectReason?: string;
    generateReconnectToken?: boolean;
  }
): Promise<{ reconnectToken?: string }> {
  const sets: string[] = ["status = $2", "updated_at = NOW()"];
  const params: unknown[] = [id, status];
  let reconnectToken: string | undefined;

  if (status === "connected") {
    sets.push("reconnect_token = NULL");
    sets.push("reconnect_token_expires_at = NULL");
    sets.push("disconnect_reason = NULL");
    sets.push(`last_connected_at = $${params.length + 1}`);
    params.push(new Date().toISOString());
    if (extras?.phoneNumber) {
      sets.push(`phone_number = $${params.length + 1}`);
      params.push(extras.phoneNumber);
    }
  }

  if (status === "disconnected") {
    sets.push(`last_disconnected_at = $${params.length + 1}`);
    params.push(new Date().toISOString());
    if (extras?.disconnectReason) {
      sets.push(`disconnect_reason = $${params.length + 1}`);
      params.push(extras.disconnectReason);
    }
    if (extras?.generateReconnectToken) {
      reconnectToken = randomUUID().replace(/-/g, "");
      const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      sets.push(`reconnect_token = $${params.length + 1}`);
      params.push(reconnectToken);
      sets.push(`reconnect_token_expires_at = $${params.length + 1}`);
      params.push(expires);
    }
  }

  await queryDb(
    `UPDATE whatsapp_connections SET ${sets.join(", ")} WHERE id = $1`,
    params
  );

  return { reconnectToken };
}

export async function setConnectionNotifyOnDisconnect(
  id: string,
  notify: boolean
): Promise<void> {
  await queryDb(
    `UPDATE whatsapp_connections SET notify_on_disconnect = $2, updated_at = NOW() WHERE id = $1`,
    [id, notify]
  );
}

export async function invalidateReconnectToken(id: string): Promise<void> {
  await queryDb(
    `UPDATE whatsapp_connections
     SET reconnect_token = NULL, reconnect_token_expires_at = NULL, updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

export async function deleteConnection(id: string): Promise<void> {
  await queryDb(`DELETE FROM whatsapp_connections WHERE id = $1`, [id]);
}

export async function generateConnectToken(id: string): Promise<string> {
  const token = randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await queryDb(
    `UPDATE whatsapp_connections
     SET reconnect_token = $2, reconnect_token_expires_at = $3, updated_at = NOW()
     WHERE id = $1`,
    [id, token, expires]
  );
  return token;
}

export async function countConnectionsByStatus(clientSlug?: string | null): Promise<{
  connected: number;
  disconnected: number;
  error: number;
  connecting: number;
}> {
  if (!hasDatabaseConfig()) return { connected: 0, disconnected: 0, error: 0, connecting: 0 };
  const params: unknown[] = [];
  const where = clientSlug ? `WHERE client_slug = $1` : "";
  if (clientSlug) params.push(clientSlug);

  const result = await queryDb<{ status: string; count: string }>(
    `SELECT status, COUNT(*) AS count FROM whatsapp_connections ${where} GROUP BY status`,
    params
  );
  const counts = { connected: 0, disconnected: 0, error: 0, connecting: 0 };
  for (const row of result.rows) {
    const s = row.status as keyof typeof counts;
    if (s in counts) counts[s] = parseInt(row.count, 10);
  }
  return counts;
}

// ─── Conversations ───────────────────────────────────────────────────────────

export async function listConversations(
  clientSlug: string | null,
  connectionId?: string,
  trafficOnly?: boolean
): Promise<WhatsappConversation[]> {
  if (!hasDatabaseConfig()) return [];
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (clientSlug) {
    params.push(clientSlug);
    conditions.push(clientSlugScope(params.length, "wconv"));
  }
  if (connectionId) {
    params.push(connectionId);
    conditions.push(`wconv.connection_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // When trafficOnly, restrict to conversations whose contact phone
  // has a matching whatsapp_leads record (i.e. came from a redirect hub click).
  if (trafficOnly) {
    conditions.push(
      `EXISTS (SELECT 1 FROM whatsapp_leads wl WHERE wl.client_slug = wconv.client_slug AND wl.lead_phone = wconv.contact_phone)`
    );
  }

  const result = await queryDb<WhatsappConversation>(
    `SELECT wconv.*, wc.connection_name, cl.client_name
     FROM whatsapp_conversations wconv
     LEFT JOIN whatsapp_connections wc ON wc.id = wconv.connection_id
     LEFT JOIN clients cl ON cl.client_slug = wconv.client_slug
     ${where}
     ORDER BY wconv.last_message_at DESC NULLS LAST, wconv.created_at DESC`,
    params
  );
  return result.rows;
}

export async function upsertConversation(input: {
  clientSlug: string;
  connectionId: string;
  contactPhone: string;
  contactName?: string | null;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  direction?: "inbound" | "outbound";
}): Promise<string> {
  const existing = await queryDb<{ id: string }>(
    `SELECT id FROM whatsapp_conversations
     WHERE connection_id = $1 AND contact_phone = $2 LIMIT 1`,
    [input.connectionId, input.contactPhone]
  );

  if (existing.rows[0]) {
    const id = existing.rows[0].id;
    const sets = ["updated_at = NOW()"];
    const params: unknown[] = [id];

    if (input.lastMessageText !== undefined) {
      sets.push(`last_message_text = $${params.length + 1}`);
      params.push(input.lastMessageText);
    }
    if (input.lastMessageAt !== undefined) {
      sets.push(`last_message_at = $${params.length + 1}`);
      params.push(input.lastMessageAt);
    }
    if (input.direction === "inbound") {
      sets.push("unread_count = unread_count + 1");
    }
    if (input.contactName) {
      sets.push(`contact_name = $${params.length + 1}`);
      params.push(input.contactName);
    }

    await queryDb(
      `UPDATE whatsapp_conversations SET ${sets.join(", ")} WHERE id = $1`,
      params
    );
    return id;
  }

  const id = randomUUID();
  await queryDb(
    `INSERT INTO whatsapp_conversations
       (id, client_slug, connection_id, contact_phone, contact_name,
        last_message_text, last_message_at, unread_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      input.clientSlug,
      input.connectionId,
      input.contactPhone,
      input.contactName ?? null,
      input.lastMessageText ?? null,
      input.lastMessageAt ?? null,
      input.direction === "inbound" ? 1 : 0
    ]
  );
  return id;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await queryDb(
    `UPDATE whatsapp_conversations SET unread_count = 0, updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function listMessages(conversationId: string): Promise<WhatsappMessage[]> {
  if (!hasDatabaseConfig()) return [];
  const result = await queryDb<WhatsappMessage>(
    `SELECT id, created_at, conversation_id, direction, message_type, text, media_url, status, provider_message_id
     FROM whatsapp_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

export async function insertMessage(input: {
  clientSlug: string;
  connectionId: string;
  conversationId: string;
  providerMessageId?: string | null;
  direction: "inbound" | "outbound";
  messageType?: string;
  text?: string | null;
  mediaUrl?: string | null;
  rawPayload?: unknown;
}): Promise<void> {
  await queryDb(
    `INSERT INTO whatsapp_messages
       (id, client_slug, connection_id, conversation_id, provider_message_id,
        direction, message_type, text, media_url, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      randomUUID(),
      input.clientSlug,
      input.connectionId,
      input.conversationId,
      input.providerMessageId ?? null,
      input.direction,
      input.messageType ?? "text",
      input.text ?? null,
      input.mediaUrl ?? null,
      input.rawPayload != null ? JSON.stringify(input.rawPayload) : null
    ]
  );
}

// Returns true when the FIRST message recorded for this contact+client was outbound
// (i.e. the admin sent first — this is a notification conversation, not a lead from the redirect)
export async function wasConversationAdminInitiated(
  clientSlug: string,
  contactPhone: string
): Promise<boolean> {
  if (!hasDatabaseConfig()) return false;
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return false;

  const result = await queryDb<{ direction: string }>(
    `SELECT m.direction
     FROM whatsapp_messages m
     JOIN whatsapp_conversations c ON c.id = m.conversation_id
     WHERE c.client_slug = $1
       AND c.contact_phone = $2
     ORDER BY m.created_at ASC
     LIMIT 1`,
    [clientSlug, digits]
  );

  if (result.rows.length === 0) return false;
  return result.rows[0].direction === "outbound";
}

// ─── Connection Users ────────────────────────────────────────────────────────

export async function listConnectionUsers(
  connectionId?: string | null,
  clientSlug?: string | null
): Promise<ConnectionUser[]> {
  if (!hasDatabaseConfig()) return [];
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (connectionId) {
    params.push(connectionId);
    conditions.push(`connection_id = $${params.length}`);
  }
  if (clientSlug) {
    params.push(clientSlug);
    conditions.push(`client_slug = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await queryDb<ConnectionUser>(
    `SELECT * FROM whatsapp_connection_users ${where} ORDER BY user_name ASC`,
    params
  );
  return result.rows;
}

export async function createConnectionUser(input: {
  clientSlug: string;
  connectionId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  cargo?: string;
  canReconnect?: boolean;
  canViewInbox?: boolean;
  canReply?: boolean;
}): Promise<ConnectionUser> {
  const id = randomUUID();
  const result = await queryDb<ConnectionUser>(
    `INSERT INTO whatsapp_connection_users
       (id, client_slug, connection_id, user_name, user_phone, user_email, cargo,
        can_reconnect, can_view_inbox, can_reply)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      input.clientSlug,
      input.connectionId,
      input.userName,
      input.userPhone ?? null,
      input.userEmail ?? null,
      input.cargo ?? null,
      input.canReconnect ?? true,
      input.canViewInbox ?? true,
      input.canReply ?? false
    ]
  );
  return result.rows[0];
}

export async function deleteConnectionUser(id: string): Promise<void> {
  await queryDb(`DELETE FROM whatsapp_connection_users WHERE id = $1`, [id]);
}

// ─── Quick Replies ───────────────────────────────────────────────────────────

export async function listQuickReplies(clientSlug: string | null): Promise<QuickReply[]> {
  if (!hasDatabaseConfig()) return [];
  const params: unknown[] = [];
  const conditions: string[] = ["is_active = TRUE"];
  if (clientSlug) {
    params.push(clientSlug);
    conditions.push(`(client_slug = $${params.length} OR client_slug IS NULL)`);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const result = await queryDb<QuickReply>(
    `SELECT * FROM quick_replies ${where} ORDER BY category ASC, title ASC`,
    params
  );
  return result.rows;
}

export async function createQuickReply(input: {
  clientSlug: string | null;
  title: string;
  category: string;
  message: string;
}): Promise<QuickReply> {
  const result = await queryDb<QuickReply>(
    `INSERT INTO quick_replies (client_slug, title, category, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.clientSlug, input.title, input.category, input.message]
  );
  return result.rows[0];
}

export async function updateQuickReply(
  id: string,
  input: { title?: string; category?: string; message?: string; is_active?: boolean }
): Promise<QuickReply> {
  const sets: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [id];
  if (input.title !== undefined) { sets.push(`title = $${params.length + 1}`); params.push(input.title); }
  if (input.category !== undefined) { sets.push(`category = $${params.length + 1}`); params.push(input.category); }
  if (input.message !== undefined) { sets.push(`message = $${params.length + 1}`); params.push(input.message); }
  if (input.is_active !== undefined) { sets.push(`is_active = $${params.length + 1}`); params.push(input.is_active); }
  const result = await queryDb<QuickReply>(
    `UPDATE quick_replies SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

export async function deleteQuickReply(id: string): Promise<void> {
  await queryDb(`DELETE FROM quick_replies WHERE id = $1`, [id]);
}

// ─── Pipeline / Temperature ──────────────────────────────────────────────────

export async function setConversationTemperature(
  id: string,
  temperature: "cold" | "warm" | "hot",
  reason?: string | null
): Promise<void> {
  const sets = ["temperature = $2", "updated_at = NOW()"];
  const params: unknown[] = [id, temperature];
  if (temperature === "hot") {
    sets.push(`hot_reason = $${params.length + 1}`);
    params.push(reason ?? null);
    sets.push(`hot_marked_at = NOW()`);
  } else {
    sets.push("hot_reason = NULL");
    sets.push("hot_marked_at = NULL");
  }
  await queryDb(`UPDATE whatsapp_conversations SET ${sets.join(", ")} WHERE id = $1`, params);
}

export async function setConversationStage(id: string, stage: string): Promise<void> {
  await queryDb(
    `UPDATE whatsapp_conversations SET pipeline_stage = $2, updated_at = NOW() WHERE id = $1`,
    [id, stage]
  );
}

export async function listConversationsByStage(
  clientSlug: string | null
): Promise<WhatsappConversation[]> {
  if (!hasDatabaseConfig()) return [];
  const params: unknown[] = [];
  const conditions: string[] = ["wconv.pipeline_stage != 'perdido'"];
  if (clientSlug) {
    params.push(clientSlug);
    conditions.push(`wconv.client_slug = $${params.length}`);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const result = await queryDb<WhatsappConversation>(
    `SELECT wconv.*, wc.connection_name, cl.client_name
     FROM whatsapp_conversations wconv
     LEFT JOIN whatsapp_connections wc ON wc.id = wconv.connection_id
     LEFT JOIN clients cl ON cl.client_slug = wconv.client_slug
     ${where}
     ORDER BY wconv.last_message_at DESC NULLS LAST`,
    params
  );
  return result.rows;
}

export async function setConversationDeal(
  id: string,
  input: { value?: number | null; status?: "open" | "won" | "lost" }
): Promise<void> {
  const sets: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [id];
  if (input.value !== undefined) {
    sets.push(`deal_value = $${params.length + 1}`);
    params.push(input.value);
  }
  if (input.status !== undefined) {
    sets.push(`deal_status = $${params.length + 1}`);
    params.push(input.status);
    if (input.status === "won" || input.status === "lost") {
      sets.push("deal_closed_at = NOW()");
    } else {
      sets.push("deal_closed_at = NULL");
    }
  }
  await queryDb(`UPDATE whatsapp_conversations SET ${sets.join(", ")} WHERE id = $1`, params);
}

// ─── Financial Metrics ───────────────────────────────────────────────────────

export type FinancialMetrics = {
  faturamento_total: number;
  leads_total: number;
  leads_quentes: number;
  deals_ganhos: number;
  taxa_conversao: number;
  ticket_medio: number;
};

export type FinancialDeal = {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  deal_value: number | null;
  deal_status: string;
  deal_source: string;
  pipeline_stage: string;
  temperature: string;
  connection_name: string | null;
  last_message_at: string | null;
  deal_closed_at: string | null;
  created_at: string;
};

export async function getFinancialMetrics(input: {
  clientSlug: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
}): Promise<{ metrics: FinancialMetrics; deals: FinancialDeal[] }> {
  if (!hasDatabaseConfig()) {
    return {
      metrics: { faturamento_total: 0, leads_total: 0, leads_quentes: 0, deals_ganhos: 0, taxa_conversao: 0, ticket_medio: 0 },
      deals: []
    };
  }

  const params: unknown[] = [];
  const conditions: string[] = [];

  if (input.clientSlug) {
    params.push(input.clientSlug);
    conditions.push(`wconv.client_slug = $${params.length}`);
  }
  if (input.dateStart) {
    params.push(input.dateStart);
    conditions.push(`wconv.created_at >= $${params.length}`);
  }
  if (input.dateEnd) {
    params.push(input.dateEnd + "T23:59:59");
    conditions.push(`wconv.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [metricsRes, dealsRes] = await Promise.all([
    queryDb<{
      faturamento_total: string;
      leads_total: string;
      leads_quentes: string;
      deals_ganhos: string;
    }>(
      `SELECT
         COALESCE(SUM(deal_value) FILTER (WHERE deal_status = 'won'), 0) AS faturamento_total,
         COUNT(*) AS leads_total,
         COUNT(*) FILTER (WHERE temperature = 'hot') AS leads_quentes,
         COUNT(*) FILTER (WHERE deal_status = 'won') AS deals_ganhos
       FROM whatsapp_conversations wconv
       ${where}`,
      params
    ),
    queryDb<FinancialDeal>(
      `SELECT wconv.id, wconv.contact_name, wconv.contact_phone,
              wconv.deal_value, wconv.deal_status, wconv.deal_source,
              wconv.pipeline_stage, wconv.temperature,
              wc.connection_name, wconv.last_message_at,
              wconv.deal_closed_at, wconv.created_at
       FROM whatsapp_conversations wconv
       LEFT JOIN whatsapp_connections wc ON wc.id = wconv.connection_id
       ${where}
       ORDER BY wconv.last_message_at DESC NULLS LAST
       LIMIT 200`,
      params
    )
  ]);

  const row = metricsRes.rows[0];
  const faturamento = parseFloat(row?.faturamento_total ?? "0");
  const leads = parseInt(row?.leads_total ?? "0", 10);
  const ganhos = parseInt(row?.deals_ganhos ?? "0", 10);

  return {
    metrics: {
      faturamento_total: faturamento,
      leads_total: leads,
      leads_quentes: parseInt(row?.leads_quentes ?? "0", 10),
      deals_ganhos: ganhos,
      taxa_conversao: leads > 0 ? (ganhos / leads) * 100 : 0,
      ticket_medio: ganhos > 0 ? faturamento / ganhos : 0
    },
    deals: dealsRes.rows
  };
}
