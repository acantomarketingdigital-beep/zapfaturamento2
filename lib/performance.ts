import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type PerformanceRow = {
  client_slug: string;
  campaign: string;
  creative: string;
  audience: string;
  impressions: number;
  leads: number;
  investment_cents: number;
  cpl_cents: number;
  agendados: number;
  compareceram: number;
  fechados: number;
  faturamento_cents: number;
  ticket_medio_cents: number;
  taxa_agendamento: number;
  taxa_comparecimento: number;
  taxa_conversao: number;
  roas: number;
};

function toNumber(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getPerformanceRows(clientSlug?: string | null) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const values: unknown[] = [];
  const spendWhere = clientSlug
    ? `WHERE client_slug = $${values.push(clientSlug)}`
    : "";
  const leadsWhere = clientSlug
    ? `WHERE client_slug = $${values.push(clientSlug)}`
    : "";

  const result = await queryDb<PerformanceRow>(
    `
      WITH spend AS (
        SELECT
          client_slug,
          campaign,
          COALESCE(creative, '') AS creative,
          COALESCE(audience, '') AS audience,
          SUM(impressions)::bigint AS impressions,
          SUM(investment_cents)::bigint AS investment_cents
        FROM ad_spend
        ${spendWhere}
        GROUP BY client_slug, campaign, COALESCE(creative, ''), COALESCE(audience, '')
      ),
      leads AS (
        SELECT
          client_slug,
          COALESCE(utm_campaign, '') AS campaign,
          COALESCE(utm_content, '') AS creative,
          COALESCE(utm_term, '') AS audience,
          COUNT(*)::bigint AS leads,
          COUNT(*) FILTER (WHERE lead_status = 'agendado')::bigint AS agendados,
          COUNT(*) FILTER (WHERE lead_status = 'compareceu')::bigint AS compareceram,
          COUNT(*) FILTER (WHERE lead_status IN ('pago', 'finalizado'))::bigint AS fechados,
          COALESCE(SUM(paid_amount_cents), 0)::bigint AS faturamento_cents
        FROM whatsapp_leads
        ${leadsWhere}
        GROUP BY client_slug, COALESCE(utm_campaign, ''), COALESCE(utm_content, ''), COALESCE(utm_term, '')
      )
      SELECT
        COALESCE(spend.client_slug, leads.client_slug) AS client_slug,
        NULLIF(COALESCE(spend.campaign, leads.campaign), '') AS campaign,
        COALESCE(spend.creative, leads.creative) AS creative,
        COALESCE(spend.audience, leads.audience) AS audience,
        COALESCE(spend.impressions, 0)::bigint AS impressions,
        COALESCE(leads.leads, 0)::bigint AS leads,
        COALESCE(spend.investment_cents, 0)::bigint AS investment_cents,
        CASE
          WHEN COALESCE(leads.leads, 0) > 0
            THEN ROUND(COALESCE(spend.investment_cents, 0)::numeric / leads.leads)
          ELSE 0
        END::bigint AS cpl_cents,
        COALESCE(leads.agendados, 0)::bigint AS agendados,
        COALESCE(leads.compareceram, 0)::bigint AS compareceram,
        COALESCE(leads.fechados, 0)::bigint AS fechados,
        COALESCE(leads.faturamento_cents, 0)::bigint AS faturamento_cents,
        CASE
          WHEN COALESCE(leads.fechados, 0) > 0
            THEN ROUND(COALESCE(leads.faturamento_cents, 0)::numeric / leads.fechados)
          ELSE 0
        END::bigint AS ticket_medio_cents,
        CASE
          WHEN COALESCE(leads.leads, 0) > 0
            THEN ROUND(100.0 * COALESCE(leads.agendados, 0)::numeric / leads.leads, 1)
          ELSE 0
        END::numeric AS taxa_agendamento,
        CASE
          WHEN COALESCE(leads.agendados, 0) > 0
            THEN ROUND(100.0 * COALESCE(leads.compareceram, 0)::numeric / leads.agendados, 1)
          ELSE 0
        END::numeric AS taxa_comparecimento,
        CASE
          WHEN COALESCE(leads.leads, 0) > 0
            THEN ROUND(100.0 * COALESCE(leads.fechados, 0)::numeric / leads.leads, 1)
          ELSE 0
        END::numeric AS taxa_conversao,
        CASE
          WHEN COALESCE(spend.investment_cents, 0) > 0
            THEN ROUND(COALESCE(leads.faturamento_cents, 0)::numeric / spend.investment_cents, 2)
          ELSE 0
        END::numeric AS roas
      FROM spend
      FULL OUTER JOIN leads
        ON spend.client_slug = leads.client_slug
       AND spend.campaign = leads.campaign
       AND spend.creative = leads.creative
       AND spend.audience = leads.audience
      ORDER BY COALESCE(leads.faturamento_cents, 0) DESC, COALESCE(spend.investment_cents, 0) DESC
    `,
    values
  );

  return result.rows.map((row) => ({
    ...row,
    impressions: toNumber(row.impressions),
    leads: toNumber(row.leads),
    investment_cents: toNumber(row.investment_cents),
    cpl_cents: toNumber(row.cpl_cents),
    agendados: toNumber(row.agendados),
    compareceram: toNumber(row.compareceram),
    fechados: toNumber(row.fechados),
    faturamento_cents: toNumber(row.faturamento_cents),
    ticket_medio_cents: toNumber(row.ticket_medio_cents),
    taxa_agendamento: toNumber(row.taxa_agendamento),
    taxa_comparecimento: toNumber(row.taxa_comparecimento),
    taxa_conversao: toNumber(row.taxa_conversao),
    roas: toNumber(row.roas)
  }));
}
