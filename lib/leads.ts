import { clientSlugScope, hasDatabaseConfig, queryDb } from "@/lib/db";
import type { LeadCapturePayload } from "@/lib/utm";
import { recordBillableLead } from "@/lib/billing-usage";

export type KommoLeadStatus = "pending" | "success" | "error" | "disabled";

export type LeadEventPayload = LeadCapturePayload & {
  redirectUrl: string;
};

type InsertLeadEventParams = {
  kommoEnabled: boolean;
  kommoStatus: KommoLeadStatus;
  kommoSuccess: boolean | null;
  kommoLeadId: number | null;
  kommoError: string | null;
  metaCapiSuccess: boolean | null;
  metaCapiEventId: string | null;
  metaCapiError: string | null;
};

type UpdateLeadEventParams = InsertLeadEventParams;

export type LeadEventRecord = {
  id: number;
  created_at: string;
  client_slug: string;
  client_name: string;
  whatsapp_number: string;
  lead_phone: string | null;
  source_platform: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  placement: string | null;
  fbclid: string | null;
  gclid: string | null;
  device: string | null;
  keyword: string | null;
  matchtype: string | null;
  network: string | null;
  page_url: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  kommo_enabled: boolean;
  kommo_success: boolean | null;
  kommo_status: KommoLeadStatus;
  kommo_lead_id: number | null;
  kommo_error: string | null;
  meta_capi_success: boolean | null;
  meta_capi_event_id: string | null;
  meta_capi_error: string | null;
  redirect_url: string;
  is_test: boolean;
  duplicate: boolean;
};

export type DashboardFilters = {
  period: "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
  clientSlug: string;
  origin: string;
  campaign: string;
  creative: string;
  audience: string;
  kommoStatus: "all" | KommoLeadStatus;
  leadType: "all" | "real" | "test" | "whatsapp";
  query: string;
};

export type SummaryMetrics = {
  totalLeads: number;
  leadsToday: number;
  leadsLast7Days: number;
  metaAdsLeads: number;
  googleAdsLeads: number;
  kommoSuccessRate: number;
  leadsAgendados: number;
  leadsFechados: number;
  leadsExportaveis: number;
};

export type ChartDatum = {
  label: string;
  value: number;
};

export type FilterOptions = {
  clients: Array<{ value: string; label: string }>;
  campaigns: string[];
  creatives: string[];
  audiences: string[];
};

export type DashboardData = {
  summary: SummaryMetrics;
  leadsByDay: ChartDatum[];
  leadsByClinic: ChartDatum[];
  leadsByCampaign: ChartDatum[];
  leadsByCreative: ChartDatum[];
  leadsByAudience: ChartDatum[];
  leadsBySource: ChartDatum[];
  rows: LeadEventRecord[];
  filterOptions: FilterOptions;
  databaseReady: boolean;
};

const EMPTY_SUMMARY: SummaryMetrics = {
  totalLeads: 0,
  leadsToday: 0,
  leadsLast7Days: 0,
  metaAdsLeads: 0,
  googleAdsLeads: 0,
  kommoSuccessRate: 0,
  leadsAgendados: 0,
  leadsFechados: 0,
  leadsExportaveis: 0
};

function nullable(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function isTestLead(payload: LeadEventPayload): boolean {
  const campaign = payload.utm_campaign?.trim() || "";
  const content = payload.utm_content?.trim() || "";
  const term = payload.utm_term?.trim() || "";
  return (
    !campaign ||
    content === "{{ad.name}}" ||
    term === "{{adset.name}}"
  );
}

const BOT_UA_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /telegram/i, /discordbot/i,
  /python-requests/i, /python-urllib/i, /curl\//i, /wget\//i,
  /go-http-client/i, /java\//i, /libwww/i,
  /headlesschrome/i, /phantomjs/i, /prerender/i, /lighthouse/i,
];

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

async function checkIsDuplicate(
  clientSlug: string,
  fbclid: string | null | undefined,
  gclid: string | null | undefined,
  internalCampaignSlug: string | null | undefined,
  internalCreativeSlug: string | null | undefined
): Promise<{ id: number } | null> {
  if (!hasDatabaseConfig()) return null;

  // Strong key: fbclid or gclid uniquely identifies a single ad click
  const cleanFbclid = fbclid?.trim() || null;
  const cleanGclid = gclid?.trim() || null;

  if (cleanFbclid || cleanGclid) {
    const orParts: string[] = [];
    const values: unknown[] = [clientSlug];

    if (cleanFbclid) {
      values.push(cleanFbclid);
      orParts.push(`fbclid = $${values.length}`);
    }
    if (cleanGclid) {
      values.push(cleanGclid);
      orParts.push(`gclid = $${values.length}`);
    }

    const result = await queryDb<{ id: number }>(
      `SELECT id FROM whatsapp_leads
       WHERE client_slug = $1
         AND (${orParts.join(" OR ")})
       ORDER BY created_at DESC
       LIMIT 1`,
      values
    );
    if (result.rows.length > 0) return result.rows[0];
  }

  // Campaign + creative time window: same combination within 5 minutes
  const cleanCampaign = internalCampaignSlug?.trim() || null;
  const cleanCreative = internalCreativeSlug?.trim() || null;

  if (cleanCampaign && cleanCreative) {
    const result = await queryDb<{ id: number }>(
      `SELECT id FROM whatsapp_leads
       WHERE client_slug = $1
         AND internal_campaign_slug = $2
         AND creative_slug = $3
         AND created_at > NOW() - INTERVAL '5 minutes'
       ORDER BY created_at DESC
       LIMIT 1`,
      [clientSlug, cleanCampaign, cleanCreative]
    );
    if (result.rows.length > 0) return result.rows[0];
  }

  return null;
}

export async function insertLeadEvent(
  payload: LeadEventPayload,
  status: InsertLeadEventParams
) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (isBot(payload.userAgent)) {
    console.log(`[leads] Bot detectado, lead ignorado — UA: ${String(payload.userAgent).slice(0, 100)}`);
    return null;
  }

  const isTest = isTestLead(payload);
  const existing = await checkIsDuplicate(
    payload.clientSlug,
    payload.fbclid,
    payload.gclid,
    payload.internalCampaignSlug,
    payload.internalCreativeSlug
  );

  if (existing) {
    console.log(`[leads] Lead duplicado evitado — id=${existing.id} client=${payload.clientSlug}`);
    return existing.id;
  }

  const internalCampaignId = payload.internalCampaignId
    ? parseInt(payload.internalCampaignId, 10) || null
    : null;

  const result = await queryDb<{ id: number }>(
    `
      INSERT INTO whatsapp_leads (
        client_slug,
        client_name,
        whatsapp_number,
        source_platform,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        campaign_id,
        adset_id,
        ad_id,
        placement,
        fbclid,
        gclid,
        device,
        keyword,
        matchtype,
        network,
        page_url,
        page_path,
        referrer,
        user_agent,
        kommo_enabled,
        kommo_success,
        kommo_status,
        kommo_lead_id,
        kommo_error,
        meta_capi_success,
        meta_capi_event_id,
        meta_capi_error,
        redirect_url,
        is_test,
        duplicate,
        internal_campaign_id,
        internal_campaign_slug,
        creative_id,
        creative_slug
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38
      )
      RETURNING id
    `,
    [
      payload.clientSlug,
      payload.clientName,
      payload.whatsappNumber,
      payload.sourcePlatform,
      nullable(payload.utm_source),
      nullable(payload.utm_medium),
      nullable(payload.utm_campaign),
      nullable(payload.utm_content),
      nullable(payload.utm_term),
      nullable(payload.campaign_id),
      nullable(payload.adset_id),
      nullable(payload.ad_id),
      nullable(payload.placement),
      nullable(payload.fbclid),
      nullable(payload.gclid),
      nullable(payload.device),
      nullable(payload.keyword),
      nullable(payload.matchtype),
      nullable(payload.network),
      payload.pageUrl,
      payload.pagePath,
      nullable(payload.referrer),
      nullable(payload.userAgent),
      status.kommoEnabled,
      status.kommoSuccess,
      status.kommoStatus,
      status.kommoLeadId,
      nullable(status.kommoError),
      status.metaCapiSuccess,
      nullable(status.metaCapiEventId),
      nullable(status.metaCapiError),
      payload.redirectUrl,
      isTest,
      false,
      internalCampaignId,
      nullable(payload.internalCampaignSlug),
      payload.internalCreativeId ? parseInt(payload.internalCreativeId, 10) || null : null,
      nullable(payload.internalCreativeSlug)
    ]
  );

  const leadId = result.rows[0]?.id ?? null;
  if (leadId) {
    recordBillableLead({ clientSlug: payload.clientSlug, leadId, source: "whatsapp" }).catch(() => {});
  }
  return leadId;
}

export async function linkLeadContact(
  clientSlug: string,
  contactPhone: string,
  name: string | null
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return;
  const safeName = name?.trim() || null;

  console.log("[linkLeadContact]", { clientSlug, digits, name: safeName });

  // 1. Lead already linked to this phone (repeat message) — update name + replied
  const linked = await queryDb<{ id: number }>(
    `UPDATE whatsapp_leads
     SET lead_name   = COALESCE(lead_name, $3),
         has_replied = true,
         replied_at  = COALESCE(replied_at, NOW())
     WHERE client_slug = $1
       AND lead_phone   = $2
       AND created_at > NOW() - INTERVAL '7 days'
     RETURNING id`,
    [clientSlug, digits, safeName]
  );

  if (linked.rows.length > 0) {
    console.log("[linkLeadContact] existing lead updated, ids:", linked.rows.map((r) => r.id));
    return;
  }

  // 2. No lead linked yet — link the most recent unlinked lead from the last 60 min
  try {
    const updated = await queryDb<{ id: number; lead_phone: string; lead_name: string | null }>(
      `UPDATE whatsapp_leads
       SET lead_phone  = $2,
           lead_name   = COALESCE(lead_name, $3),
           has_replied = true,
           replied_at  = COALESCE(replied_at, NOW())
       WHERE id = (
         SELECT id FROM whatsapp_leads
         WHERE client_slug = $1
           AND lead_phone IS NULL
           AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY created_at DESC
         LIMIT 1
       )
       RETURNING id, lead_phone, lead_name`,
      [clientSlug, digits, safeName]
    );

    if (updated.rows.length > 0) {
      console.log("[linkLeadContact] new link:", updated.rows[0]);
    } else {
      console.log("[linkLeadContact] no unlinked lead found in last 60 min for", clientSlug);
    }
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === "23505") {
      // Unique constraint: this phone is already on another lead created outside the 7-day window
      console.log("[linkLeadContact] unique conflict — phone already linked on older lead; updating replied");
      await queryDb(
        `UPDATE whatsapp_leads
         SET has_replied = true,
             replied_at  = COALESCE(replied_at, NOW()),
             lead_name   = COALESCE(lead_name, $3)
         WHERE id = (
           SELECT id FROM whatsapp_leads
           WHERE client_slug = $1
             AND lead_phone   = $2
           ORDER BY created_at DESC
           LIMIT 1
         )`,
        [clientSlug, digits, safeName]
      );
    } else {
      console.error("[linkLeadContact] unexpected error", err);
    }
  }
}

export async function ensureWhatsappInboundLead(
  clientSlug: string,
  contactPhone: string,
  contactName: string | null
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  const digits = contactPhone.replace(/\D/g, "");
  if (!digits) return;

  // Check if there's already a lead for this phone in the last 30 days
  const existing = await queryDb<{ id: number }>(
    `SELECT id FROM whatsapp_leads
     WHERE client_slug = $1
       AND lead_phone = $2
       AND created_at > NOW() - INTERVAL '30 days'
     LIMIT 1`,
    [clientSlug, digits]
  );
  if (existing.rows.length > 0) return;

  // Auto-create a lead for this inbound WhatsApp contact
  await queryDb(
    `INSERT INTO whatsapp_leads
       (client_slug, whatsapp_number, lead_name, lead_phone, source_platform, lead_status, has_replied, replied_at)
     VALUES ($1, '', $2, $3, 'whatsapp_inbound', 'novo_lead', true, NOW())
     ON CONFLICT DO NOTHING`,
    [clientSlug, contactName, digits]
  );
  console.log("[ensureWhatsappInboundLead] created inbound lead", { clientSlug, digits });
}

export async function updateLeadEventStatus(
  eventId: number,
  status: UpdateLeadEventParams
) {
  if (!hasDatabaseConfig()) {
    return;
  }

  await queryDb(
    `
      UPDATE whatsapp_leads
      SET
        kommo_enabled = $2,
        kommo_success = $3,
        kommo_status = $4,
        kommo_lead_id = $5,
        kommo_error = $6,
        meta_capi_success = $7,
        meta_capi_event_id = $8,
        meta_capi_error = $9
      WHERE id = $1
    `,
    [
      eventId,
      status.kommoEnabled,
      status.kommoSuccess,
      status.kommoStatus,
      status.kommoLeadId,
      nullable(status.kommoError),
      status.metaCapiSuccess,
      nullable(status.metaCapiEventId),
      nullable(status.metaCapiError)
    ]
  );
}

export async function findRecentLeadForCapi(clientSlug: string): Promise<LeadEventRecord | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<LeadEventRecord>(
    `SELECT * FROM whatsapp_leads
     WHERE client_slug = $1
       AND meta_capi_success IS NULL
       AND source_platform != 'form'
       AND is_test = false
       AND created_at > NOW() - INTERVAL '60 minutes'
     ORDER BY created_at DESC
     LIMIT 1`,
    [clientSlug]
  );
  return result.rows[0] ?? null;
}

export async function confirmLeadCapi(
  leadId: number,
  success: boolean,
  eventId: string | null,
  error: string | null
): Promise<void> {
  if (!hasDatabaseConfig()) return;
  await queryDb(
    `UPDATE whatsapp_leads
     SET meta_capi_success = $2, meta_capi_event_id = $3, meta_capi_error = $4
     WHERE id = $1`,
    [leadId, success, eventId, error ?? null]
  );
}

export type DeleteLeadsMode =
  | "test_only"
  | "client_all"
  | "campaign_all"
  | "last_n_days"
  | "missing_utm_campaign";

export async function deleteTestLeads(options: {
  mode: DeleteLeadsMode;
  clientSlug?: string;
  campaignId?: number;
  days?: number;
  userId?: string;
  userEmail?: string;
}): Promise<number> {
  if (!hasDatabaseConfig()) throw new Error("Database nao configurada.");

  let whereSql: string;
  const whereValues: unknown[] = [];

  switch (options.mode) {
    case "test_only":
      whereSql = "WHERE is_test = TRUE";
      break;
    case "client_all":
      if (!options.clientSlug) throw new Error("clientSlug obrigatorio para modo client_all.");
      whereValues.push(options.clientSlug);
      whereSql = "WHERE client_slug = $1";
      break;
    case "campaign_all":
      if (!options.campaignId) throw new Error("campaignId obrigatorio para modo campaign_all.");
      whereValues.push(options.campaignId);
      whereSql = "WHERE internal_campaign_id = $1";
      break;
    case "last_n_days": {
      const days = Math.max(1, Math.min(365, Number(options.days) || 7));
      whereValues.push(days);
      whereSql = "WHERE is_test = TRUE AND created_at >= NOW() - ($1 * INTERVAL '1 day')";
      break;
    }
    case "missing_utm_campaign":
      whereSql = "WHERE (utm_campaign IS NULL OR utm_campaign = '')";
      break;
    default:
      throw new Error("Modo invalido.");
  }

  // Single round-trip: cascade deletes/nulls via CTE
  const result = await queryDb<{ cnt: string }>(
    `
    WITH deleted_leads AS (
      DELETE FROM whatsapp_leads ${whereSql} RETURNING id
    ),
    del_history AS (
      DELETE FROM lead_status_history
      WHERE lead_id IN (SELECT id FROM deleted_leads)
    ),
    null_convs AS (
      UPDATE whatsapp_conversations
      SET lead_id = NULL
      WHERE lead_id IN (SELECT id FROM deleted_leads)
    ),
    null_msgs AS (
      UPDATE whatsapp_messages
      SET lead_id = NULL
      WHERE lead_id IN (SELECT id FROM deleted_leads)
    )
    SELECT COUNT(*)::int AS cnt FROM deleted_leads
    `,
    whereValues
  );

  const count = Number(result.rows[0]?.cnt ?? 0);

  // Log — graceful failure if system_logs not yet created
  try {
    await queryDb(
      `INSERT INTO system_logs
         (user_id, user_email, action, mode, client_slug, campaign_id, affected_count, details)
       VALUES ($1, $2, 'delete_leads', $3, $4, $5, $6, $7::jsonb)`,
      [
        options.userId  ?? null,
        options.userEmail ?? null,
        options.mode,
        options.clientSlug  ?? null,
        options.campaignId  ?? null,
        count,
        JSON.stringify({ timestamp: new Date().toISOString() }),
      ]
    );
  } catch {
    // non-fatal
  }

  return count;
}

function buildWhereClause(filters: DashboardFilters) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.period === "today") {
    clauses.push(`created_at >= CURRENT_DATE`);
  } else if (filters.period === "yesterday") {
    clauses.push(`created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`);
  } else if (filters.period === "7d") {
    clauses.push(`created_at >= NOW() - INTERVAL '7 days'`);
  } else if (filters.period === "30d") {
    clauses.push(`created_at >= NOW() - INTERVAL '30 days'`);
  } else if (filters.period === "90d") {
    clauses.push(`created_at >= NOW() - INTERVAL '90 days'`);
  }

  if (filters.clientSlug) {
    values.push(filters.clientSlug);
    clauses.push(clientSlugScope(values.length));
  }

  if (filters.origin) {
    values.push(filters.origin);
    clauses.push(`source_platform = $${values.length}`);
  }

  if (filters.campaign) {
    values.push(filters.campaign);
    clauses.push(`utm_campaign = $${values.length}`);
  }

  if (filters.creative) {
    values.push(filters.creative);
    clauses.push(`utm_content = $${values.length}`);
  }

  if (filters.audience) {
    values.push(filters.audience);
    clauses.push(`utm_term = $${values.length}`);
  }

  if (filters.kommoStatus !== "all") {
    values.push(filters.kommoStatus);
    clauses.push(`kommo_status = $${values.length}`);
  }

  if (filters.leadType === "real") {
    clauses.push("(is_test IS FALSE OR is_test IS NULL)");
  } else if (filters.leadType === "test") {
    clauses.push("is_test = TRUE");
  } else if (filters.leadType === "whatsapp") {
    clauses.push("has_replied = TRUE");
    clauses.push("(is_test IS FALSE OR is_test IS NULL)");
  }

  if (filters.query) {
    values.push(`%${filters.query}%`);
    clauses.push(
      `(client_name ILIKE $${values.length}
        OR client_slug ILIKE $${values.length}
        OR whatsapp_number ILIKE $${values.length}
        OR COALESCE(utm_campaign, '') ILIKE $${values.length}
        OR COALESCE(utm_content, '') ILIKE $${values.length}
        OR COALESCE(utm_term, '') ILIKE $${values.length})`
    );
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
}

async function getSummary(filters: DashboardFilters) {
  const { whereSql, values } = buildWhereClause(filters);
  const result = await queryDb<{
    total_leads: string;
    leads_today: string;
    leads_last_7_days: string;
    meta_ads_leads: string;
    google_ads_leads: string;
    kommo_success_rate: string;
    leads_agendados: string;
    leads_fechados: string;
    leads_exportaveis: string;
  }>(
    `
      SELECT
        COUNT(*)::int AS total_leads,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS leads_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS leads_last_7_days,
        COUNT(*) FILTER (WHERE source_platform = 'Meta Ads')::int AS meta_ads_leads,
        COUNT(*) FILTER (WHERE source_platform = 'Google Ads')::int AS google_ads_leads,
        COALESCE(
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE kommo_status = 'success')
            / NULLIF(COUNT(*) FILTER (WHERE kommo_enabled IS TRUE), 0),
            1
          ),
          0
        ) AS kommo_success_rate,
        COUNT(*) FILTER (WHERE lead_status = 'agendado')::int AS leads_agendados,
        COUNT(*) FILTER (WHERE lead_status IN ('pago', 'finalizado'))::int AS leads_fechados,
        COUNT(*) FILTER (WHERE lead_phone IS NOT NULL OR lead_email IS NOT NULL)::int AS leads_exportaveis
      FROM whatsapp_leads
      ${whereSql}
    `,
    values
  );

  const row = result.rows[0];

  return {
    totalLeads: Number(row?.total_leads || 0),
    leadsToday: Number(row?.leads_today || 0),
    leadsLast7Days: Number(row?.leads_last_7_days || 0),
    metaAdsLeads: Number(row?.meta_ads_leads || 0),
    googleAdsLeads: Number(row?.google_ads_leads || 0),
    kommoSuccessRate: Number(row?.kommo_success_rate || 0),
    leadsAgendados: Number(row?.leads_agendados || 0),
    leadsFechados: Number(row?.leads_fechados || 0),
    leadsExportaveis: Number(row?.leads_exportaveis || 0)
  };
}

async function getAggregateData(
  filters: DashboardFilters,
  selectSql: string,
  labelColumn: string
) {
  const { whereSql, values } = buildWhereClause(filters);
  const result = await queryDb<{ label: string; value: string }>(
    `
      SELECT ${selectSql} AS label, COUNT(*)::int AS value
      FROM whatsapp_leads
      ${whereSql}
      GROUP BY ${labelColumn}
      ORDER BY COUNT(*) DESC, ${labelColumn} ASC
      LIMIT 8
    `,
    values
  );

  return result.rows
    .map((row) => ({
      label: row.label || "Nao informado",
      value: Number(row.value)
    }))
    .filter((item) => item.value > 0);
}

async function getLeadsByDay(filters: DashboardFilters) {
  const { whereSql, values } = buildWhereClause(filters);
  const result = await queryDb<{ label: string; value: string }>(
    `
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'America/Sao_Paulo'), 'DD/MM') AS label,
        COUNT(*)::int AS value
      FROM whatsapp_leads
      ${whereSql}
      GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Sao_Paulo') DESC
      LIMIT 14
    `,
    values
  );

  return result.rows
    .map((row) => ({
      label: row.label,
      value: Number(row.value)
    }))
    .reverse();
}

async function getLeadRows(filters: DashboardFilters) {
  const { whereSql, values } = buildWhereClause(filters);
  const result = await queryDb<LeadEventRecord>(
    `
      SELECT
        id,
        created_at,
        client_slug,
        client_name,
        whatsapp_number,
        lead_phone,
        source_platform,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        campaign_id,
        adset_id,
        ad_id,
        placement,
        fbclid,
        gclid,
        device,
        keyword,
        matchtype,
        network,
        page_url,
        page_path,
        referrer,
        user_agent,
        kommo_enabled,
        kommo_success,
        kommo_status,
        kommo_lead_id,
        kommo_error,
        meta_capi_success,
        meta_capi_event_id,
        meta_capi_error,
        redirect_url,
        COALESCE(is_test, FALSE) AS is_test,
        COALESCE(duplicate, FALSE) AS duplicate
      FROM whatsapp_leads
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT 200
    `,
    values
  );

  return result.rows;
}

async function getFilterOptions(scopeClientSlug?: string | null) {
  const values: unknown[] = [];
  const whereSql = scopeClientSlug
    ? `WHERE ${clientSlugScope(values.push(scopeClientSlug) as number)}`
    : "";
  const suffixSql = whereSql ? `AND ${clientSlugScope(1)}` : "";

  const [clientRows, campaignRows, creativeRows, audienceRows] = await Promise.all([
    queryDb<{ client_slug: string; client_name: string }>(
      `
        SELECT client_slug, MAX(client_name) AS client_name
        FROM whatsapp_leads
        ${whereSql}
        GROUP BY client_slug
        ORDER BY MAX(client_name) ASC
      `,
      values
    ),
    queryDb<{ utm_campaign: string | null }>(
      `
        SELECT DISTINCT utm_campaign
        FROM whatsapp_leads
        WHERE utm_campaign IS NOT NULL AND utm_campaign <> ''
        ${suffixSql}
        ORDER BY utm_campaign ASC
        LIMIT 100
      `,
      values
    ),
    queryDb<{ utm_content: string | null }>(
      `
        SELECT DISTINCT utm_content
        FROM whatsapp_leads
        WHERE utm_content IS NOT NULL AND utm_content <> ''
        ${suffixSql}
        ORDER BY utm_content ASC
        LIMIT 100
      `,
      values
    ),
    queryDb<{ utm_term: string | null }>(
      `
        SELECT DISTINCT utm_term
        FROM whatsapp_leads
        WHERE utm_term IS NOT NULL AND utm_term <> ''
        ${suffixSql}
        ORDER BY utm_term ASC
        LIMIT 100
      `,
      values
    )
  ]);

  return {
    clients: clientRows.rows.map((row) => ({
      value: row.client_slug,
      label: row.client_name
    })),
    campaigns: campaignRows.rows.map((row) => row.utm_campaign || "").filter(Boolean),
    creatives: creativeRows.rows.map((row) => row.utm_content || "").filter(Boolean),
    audiences: audienceRows.rows.map((row) => row.utm_term || "").filter(Boolean)
  };
}

export function getDefaultDashboardFilters(
  input: Record<string, string | string[] | undefined>
): DashboardFilters {
  const readSingle = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] || "" : value || "";
  const period = readSingle(input.period);
  const kommoStatus = readSingle(input.kommo);
  const leadType = readSingle(input.lead_type);

  return {
    period:
      period === "today" ||
      period === "yesterday" ||
      period === "7d" ||
      period === "30d" ||
      period === "90d"
        ? period
        : "all",
    clientSlug: readSingle(input.client),
    origin: readSingle(input.origin),
    campaign: readSingle(input.campaign),
    creative: readSingle(input.creative),
    audience: readSingle(input.audience),
    kommoStatus:
      kommoStatus === "success" ||
      kommoStatus === "error" ||
      kommoStatus === "pending" ||
      kommoStatus === "disabled"
        ? kommoStatus
        : "all",
    leadType:
      leadType === "real" || leadType === "test" || leadType === "whatsapp" ? leadType : "all",
    query: readSingle(input.q)
  };
}

export async function getDashboardData(
  filters: DashboardFilters,
  scopeClientSlug?: string | null
): Promise<DashboardData> {
  // If the user has a workspace scope, prefer their explicit client selection (more specific),
  // falling back to the workspace slug (shows all clients in workspace).
  const scopedFilters: DashboardFilters = scopeClientSlug
    ? {
        ...filters,
        clientSlug: filters.clientSlug || scopeClientSlug
      }
    : filters;

  if (!hasDatabaseConfig()) {
    return {
      summary: EMPTY_SUMMARY,
      leadsByDay: [],
      leadsByClinic: [],
      leadsByCampaign: [],
      leadsByCreative: [],
      leadsByAudience: [],
      leadsBySource: [],
      rows: [],
      filterOptions: {
        clients: [],
        campaigns: [],
        creatives: [],
        audiences: []
      },
      databaseReady: false
    };
  }

  try {
    const [
      summary,
      leadsByDay,
      leadsByClinic,
      leadsByCampaign,
      leadsByCreative,
      leadsByAudience,
      leadsBySource,
      rows,
      filterOptions
    ] = await Promise.all([
      getSummary(scopedFilters),
      getLeadsByDay(scopedFilters),
      getAggregateData(scopedFilters, "COALESCE(client_name, 'Nao informado')", "client_name"),
      getAggregateData(scopedFilters, "COALESCE(utm_campaign, 'Nao informado')", "utm_campaign"),
      getAggregateData(scopedFilters, "COALESCE(utm_content, 'Nao informado')", "utm_content"),
      getAggregateData(scopedFilters, "COALESCE(utm_term, 'Nao informado')", "utm_term"),
      getAggregateData(scopedFilters, "COALESCE(source_platform, 'Nao informado')", "source_platform"),
      getLeadRows(scopedFilters),
      getFilterOptions(scopeClientSlug)
    ]);

    return {
      summary,
      leadsByDay,
      leadsByClinic,
      leadsByCampaign,
      leadsByCreative,
      leadsByAudience,
      leadsBySource,
      rows,
      filterOptions,
      databaseReady: true
    };
  } catch {
    return {
      summary: EMPTY_SUMMARY,
      leadsByDay: [],
      leadsByClinic: [],
      leadsByCampaign: [],
      leadsByCreative: [],
      leadsByAudience: [],
      leadsBySource: [],
      rows: [],
      filterOptions: {
        clients: [],
        campaigns: [],
        creatives: [],
        audiences: []
      },
      databaseReady: false
    };
  }
}
