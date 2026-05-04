import { hasDatabaseConfig, queryDb } from "@/lib/db";
import {
  LEAD_STATUS_LABELS,
  normalizeLeadStatus,
  type LeadStatus
} from "@/lib/kanban-shared";

export type KanbanLead = {
  id: number;
  created_at: string;
  client_slug: string;
  client_name: string;
  whatsapp_number: string;
  lead_name: string | null;
  lead_email: string | null;
  source_platform: string;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  internal_campaign_slug: string | null;
  creative_slug: string | null;
  lead_status: LeadStatus;
  paid_amount_cents: number | null;
  paid_at: string | null;
  closed_at: string | null;
  scheduled_at: string | null;
  kommo_enabled: boolean;
  kommo_status: string;
  kommo_lead_id: number | null;
  page_url: string;
  lead_phone: string | null;
  has_replied: boolean;
  replied_at: string | null;
  follow_up_at: string | null;
  follow_up_note: string | null;
  follow_up_done: boolean;
  channel: string;
  lead_external_id: string | null;
  lead_username: string | null;
  message_text: string | null;
  last_message_at: string | null;
  fbclid: string | null;
  gclid: string | null;
};

function toNullableNumber(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function mapKommoStatusToLeadStatus(value?: string | null): LeadStatus {
  const normalized = (value || "").trim().toLowerCase();

  if (
    normalized.includes("novo") ||
    normalized.includes("lead novo")
  ) {
    return "novo_lead";
  }

  if (
    normalized.includes("contato") ||
    normalized.includes("atendimento")
  ) {
    return "em_atendimento";
  }

  if (normalized.includes("agend")) {
    return "agendado";
  }

  if (normalized.includes("compare")) {
    return "compareceu";
  }

  if (normalized.includes("negoc")) {
    return "negociacao";
  }

  if (normalized.includes("pagamento pendente")) {
    return "pagamento_pendente";
  }

  if (normalized.includes("pago")) {
    return "pago";
  }

  if (normalized.includes("final")) {
    return "finalizado";
  }

  if (normalized.includes("perd")) {
    return "perdido";
  }

  return "em_atendimento";
}

export async function listKanbanLeads(clientSlug?: string | null) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const values: unknown[] = [];
  const whereSql = clientSlug
    ? `WHERE client_slug = $${values.push(clientSlug)} AND lead_phone IS NOT NULL`
    : "WHERE lead_phone IS NOT NULL";

  const result = await queryDb<KanbanLead>(
    `
      SELECT
        id,
        created_at,
        client_slug,
        client_name,
        whatsapp_number,
        lead_name,
        lead_email,
        source_platform,
        utm_campaign,
        utm_content,
        utm_term,
        internal_campaign_slug,
        creative_slug,
        lead_status,
        paid_amount_cents,
        paid_at,
        closed_at,
        scheduled_at,
        kommo_enabled,
        kommo_status,
        kommo_lead_id,
        page_url,
        lead_phone,
        has_replied,
        replied_at,
        follow_up_at,
        follow_up_note,
        follow_up_done,
        COALESCE(channel, 'whatsapp') AS channel,
        lead_external_id,
        lead_username,
        message_text,
        last_message_at,
        fbclid,
        gclid
      FROM whatsapp_leads
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT 500
    `,
    values
  );

  return result.rows.map((row) => ({
    ...row,
    lead_status: normalizeLeadStatus(row.lead_status),
    paid_amount_cents: toNullableNumber(row.paid_amount_cents),
    kommo_lead_id: toNullableNumber(row.kommo_lead_id)
  }));
}

export async function updateLeadStatus(
  leadId: number,
  status: LeadStatus,
  options?: {
    paidAmountCents?: number | null;
    scopeClientSlug?: string | null;
    leadEmail?: string | null;
    leadName?: string | null;
    changedBy?: string | null;
  }
) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  const oldRow = await queryDb<{
    lead_status: string;
    client_slug: string;
    internal_campaign_id: number | null;
    internal_campaign_slug: string | null;
  }>(
    `SELECT lead_status, client_slug, internal_campaign_id, internal_campaign_slug
     FROM whatsapp_leads WHERE id = $1`,
    [leadId]
  );

  const values: unknown[] = [leadId, status];
  const clauses = [
    "lead_status = $2",
    "closed_at = CASE WHEN $2 IN ('pago', 'finalizado', 'perdido') THEN COALESCE(closed_at, NOW()) ELSE closed_at END",
    "scheduled_at = CASE WHEN $2 = 'agendado' THEN COALESCE(scheduled_at, NOW()) ELSE scheduled_at END"
  ];

  if (status === "pago") {
    values.push(options?.paidAmountCents ?? null);
    clauses.push("paid_amount_cents = COALESCE($3, paid_amount_cents)");
    clauses.push("paid_at = COALESCE(paid_at, NOW())");
  }

  const leadEmail = options?.leadEmail?.trim() || null;
  const leadName = options?.leadName?.trim() || null;
  if (leadEmail) {
    values.push(leadEmail);
    clauses.push(`lead_email = $${values.length}`);
  }
  if (leadName) {
    values.push(leadName);
    clauses.push(`lead_name = $${values.length}`);
  }

  const scopeSql = options?.scopeClientSlug
    ? `AND client_slug = $${values.push(options.scopeClientSlug)}`
    : "";

  await queryDb(
    `
      UPDATE whatsapp_leads
      SET ${clauses.join(", ")}
      WHERE id = $1
      ${scopeSql}
    `,
    values
  );

  const lead = oldRow.rows[0];
  if (lead) {
    await queryDb(
      `
        INSERT INTO lead_status_history
          (lead_id, client_slug, old_status, new_status, changed_by, internal_campaign_id, internal_campaign_slug)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        leadId,
        lead.client_slug,
        lead.lead_status,
        status,
        options?.changedBy ?? null,
        lead.internal_campaign_id,
        lead.internal_campaign_slug
      ]
    );
  }
}

export async function updateLeadByKommoLeadId(params: {
  kommoLeadId: number;
  status: LeadStatus;
  paidAmountCents?: number | null;
}) {
  if (!hasDatabaseConfig()) {
    return false;
  }

  const values: unknown[] = [params.kommoLeadId, params.status];
  const clauses = [
    "lead_status = $2",
    "closed_at = CASE WHEN $2 IN ('pago', 'finalizado', 'perdido') THEN COALESCE(closed_at, NOW()) ELSE closed_at END"
  ];

  if (params.status === "pago") {
    values.push(params.paidAmountCents ?? null);
    clauses.push("paid_amount_cents = COALESCE($3, paid_amount_cents)");
    clauses.push("paid_at = COALESCE(paid_at, NOW())");
  }

  await queryDb(
    `
      UPDATE whatsapp_leads
      SET ${clauses.join(", ")}
      WHERE kommo_lead_id = $1
    `,
    values
  );

  return true;
}

export async function setLeadReply(
  leadId: number,
  hasReplied: boolean,
  scopeClientSlug?: string | null
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const values: unknown[] = [leadId, hasReplied];
  const scopeSql = scopeClientSlug
    ? `AND client_slug = $${values.push(scopeClientSlug)}`
    : "";
  await queryDb(
    `UPDATE whatsapp_leads
     SET has_replied = $2,
         replied_at  = CASE WHEN $2 THEN COALESCE(replied_at, NOW()) ELSE NULL END
     WHERE id = $1 ${scopeSql}`,
    values
  );
}

export async function setLeadRepliedByPhone(
  clientSlug: string,
  contactPhone: string
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return;
  await queryDb(
    `UPDATE whatsapp_leads
     SET has_replied = true,
         replied_at  = COALESCE(replied_at, NOW())
     WHERE id = (
       SELECT id FROM whatsapp_leads
       WHERE client_slug = $1
         AND lead_phone   = $2
       ORDER BY created_at DESC
       LIMIT 1
     )`,
    [clientSlug, digits]
  );
}

export async function setLeadFollowUp(
  leadId: number,
  params: {
    followUpAt?: string | null;
    followUpNote?: string | null;
    followUpDone?: boolean;
    scopeClientSlug?: string | null;
  }
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const sets: string[] = [];
  const values: unknown[] = [leadId];

  if (params.followUpAt !== undefined) {
    values.push(params.followUpAt);
    sets.push(`follow_up_at = $${values.length}`);
  }
  if (params.followUpNote !== undefined) {
    values.push(params.followUpNote);
    sets.push(`follow_up_note = $${values.length}`);
  }
  if (params.followUpDone !== undefined) {
    values.push(params.followUpDone);
    sets.push(`follow_up_done = $${values.length}`);
  }
  if (!sets.length) return;

  const scopeSql = params.scopeClientSlug
    ? `AND client_slug = $${values.push(params.scopeClientSlug)}`
    : "";
  await queryDb(
    `UPDATE whatsapp_leads SET ${sets.join(", ")} WHERE id = $1 ${scopeSql}`,
    values
  );
}
