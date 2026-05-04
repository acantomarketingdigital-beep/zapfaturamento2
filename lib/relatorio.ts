import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type RelatorioRow = {
  client_slug: string;
  campaign_key: string;
  campaign_name: string | null;
  currency: string;
  investment_cents: number;
  leads: number;
  leads_com_mensagem: number;
  agendados: number;
  compareceram: number;
  fechados: number;
  faturamento_cents: number;
  cpl_cents: number;
  ticket_medio_cents: number;
  taxa_agendamento: number;
  taxa_comparecimento: number;
  taxa_conversao: number;
  roas: number;
};

export type RelatorioSummary = {
  total_investment_cents: number;
  total_leads: number;
  total_leads_com_mensagem: number;
  total_agendados: number;
  total_fechados: number;
  total_faturamento_cents: number;
  cpl_cents: number;
  taxa_agendamento: number;
  taxa_fechamento: number;
  roas: number;
};

export type RelatorioOptions = {
  clientSlug?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  groupByBaseName?: boolean;
};

function toNumber(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function stripCampaignSuffix(name: string): string {
  return name.replace(/[-_][A-Za-z0-9]$/, "").trim();
}

export async function getRelatorioData(options: RelatorioOptions): Promise<{
  rows: RelatorioRow[];
  summary: RelatorioSummary;
}> {
  if (!hasDatabaseConfig()) {
    return { rows: [], summary: emptyRelatorioSummary() };
  }

  const values: unknown[] = [];
  const spendClauses: string[] = [];
  const leadsClauses: string[] = [];

  if (options.clientSlug) {
    values.push(options.clientSlug);
    const n = values.length;
    spendClauses.push(`client_slug = $${n}`);
    leadsClauses.push(`client_slug = $${n}`);
  }

  if (options.dateStart) {
    values.push(options.dateStart);
    const n = values.length;
    spendClauses.push(`created_at >= $${n}::date`);
    leadsClauses.push(`created_at >= $${n}::date`);
  }

  if (options.dateEnd) {
    values.push(options.dateEnd);
    const n = values.length;
    spendClauses.push(`created_at < ($${n}::date + INTERVAL '1 day')`);
    leadsClauses.push(`created_at < ($${n}::date + INTERVAL '1 day')`);
  }

  const spendWhere = spendClauses.length ? `WHERE ${spendClauses.join(" AND ")}` : "";
  const leadsWhere = leadsClauses.length ? `WHERE ${leadsClauses.join(" AND ")}` : "";

  // When both dates are provided, estimate investment from daily_budget_cents × period_days
  // for campaigns with no explicit ad_spend in the period.
  const useBudgetFallback = Boolean(options.dateStart && options.dateEnd);
  let periodDays = 1;
  if (useBudgetFallback && options.dateStart && options.dateEnd) {
    const d1 = new Date(options.dateStart);
    const d2 = new Date(options.dateEnd);
    periodDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
  }

  const budgetWhere = options.clientSlug
    ? `WHERE daily_budget_cents > 0 AND client_slug = $1`
    : `WHERE daily_budget_cents > 0`;

  const budgetCte = useBudgetFallback
    ? `
      budget_spend AS (
        SELECT
          client_slug,
          slug AS campaign_key,
          name AS campaign_name,
          (daily_budget_cents * ${periodDays})::bigint AS investment_cents,
          COALESCE(currency, 'BRL') AS currency
        FROM client_campaigns
        ${budgetWhere}
      ),`
    : "";

  const spendCte = useBudgetFallback
    ? `
      spend AS (
        SELECT
          COALESCE(e.client_slug, b.client_slug) AS client_slug,
          COALESCE(e.campaign_key, b.campaign_key) AS campaign_key,
          COALESCE(e.campaign_name, b.campaign_name) AS campaign_name,
          COALESCE(e.investment_cents, b.investment_cents) AS investment_cents,
          COALESCE(e.currency, b.currency, 'BRL') AS currency
        FROM budget_spend b
        FULL OUTER JOIN (
          SELECT
            client_slug,
            COALESCE(internal_campaign_slug, campaign) AS campaign_key,
            MAX(COALESCE(campaign_name, campaign)) AS campaign_name,
            SUM(investment_cents)::bigint AS investment_cents,
            MAX(COALESCE(currency, 'BRL')) AS currency
          FROM ad_spend
          ${spendWhere}
          GROUP BY client_slug, COALESCE(internal_campaign_slug, campaign)
        ) e ON b.client_slug = e.client_slug AND b.campaign_key = e.campaign_key
      ),`
    : `
      spend AS (
        SELECT
          client_slug,
          COALESCE(internal_campaign_slug, campaign) AS campaign_key,
          MAX(COALESCE(campaign_name, campaign)) AS campaign_name,
          SUM(investment_cents)::bigint AS investment_cents,
          MAX(COALESCE(currency, 'BRL')) AS currency
        FROM ad_spend
        ${spendWhere}
        GROUP BY client_slug, COALESCE(internal_campaign_slug, campaign)
      ),`;

  const result = await queryDb<RelatorioRow>(
    `
      WITH ${budgetCte}
      ${spendCte}
      leads AS (
        SELECT
          client_slug,
          COALESCE(internal_campaign_slug, utm_campaign, '') AS campaign_key,
          COUNT(*)::bigint AS leads,
          COUNT(*) FILTER (WHERE has_replied = TRUE)::bigint AS leads_com_mensagem,
          COUNT(*) FILTER (WHERE lead_status = 'agendado')::bigint AS agendados,
          COUNT(*) FILTER (WHERE lead_status = 'compareceu')::bigint AS compareceram,
          COUNT(*) FILTER (WHERE lead_status IN ('pago', 'finalizado'))::bigint AS fechados,
          COALESCE(SUM(paid_amount_cents), 0)::bigint AS faturamento_cents
        FROM whatsapp_leads
        ${leadsWhere}
        GROUP BY client_slug, COALESCE(internal_campaign_slug, utm_campaign, '')
      )
      SELECT
        COALESCE(spend.client_slug, leads.client_slug) AS client_slug,
        COALESCE(spend.campaign_key, leads.campaign_key) AS campaign_key,
        spend.campaign_name,
        COALESCE(spend.currency, 'BRL') AS currency,
        COALESCE(spend.investment_cents, 0)::bigint AS investment_cents,
        COALESCE(leads.leads, 0)::bigint AS leads,
        COALESCE(leads.leads_com_mensagem, 0)::bigint AS leads_com_mensagem,
        COALESCE(leads.agendados, 0)::bigint AS agendados,
        COALESCE(leads.compareceram, 0)::bigint AS compareceram,
        COALESCE(leads.fechados, 0)::bigint AS fechados,
        COALESCE(leads.faturamento_cents, 0)::bigint AS faturamento_cents,
        CASE
          WHEN COALESCE(leads.leads_com_mensagem, 0) > 0
            THEN ROUND(COALESCE(spend.investment_cents, 0)::numeric / leads.leads_com_mensagem)
          ELSE 0
        END::bigint AS cpl_cents,
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
       AND spend.campaign_key = leads.campaign_key
      ORDER BY COALESCE(leads.faturamento_cents, 0) DESC, COALESCE(spend.investment_cents, 0) DESC
    `,
    values
  );

  let rows = result.rows.map((row) => ({
    ...row,
    currency: (row.currency || "BRL") as string,
    investment_cents: toNumber(row.investment_cents),
    leads: toNumber(row.leads),
    leads_com_mensagem: toNumber(row.leads_com_mensagem),
    agendados: toNumber(row.agendados),
    compareceram: toNumber(row.compareceram),
    fechados: toNumber(row.fechados),
    faturamento_cents: toNumber(row.faturamento_cents),
    cpl_cents: toNumber(row.cpl_cents),
    ticket_medio_cents: toNumber(row.ticket_medio_cents),
    taxa_agendamento: toNumber(row.taxa_agendamento),
    taxa_comparecimento: toNumber(row.taxa_comparecimento),
    taxa_conversao: toNumber(row.taxa_conversao),
    roas: toNumber(row.roas)
  }));

  if (options.groupByBaseName) {
    rows = mergeByBaseName(rows);
  }

  const summary = computeSummary(rows);

  return { rows, summary };
}

function mergeByBaseName(rows: RelatorioRow[]): RelatorioRow[] {
  const map = new Map<string, RelatorioRow>();

  for (const row of rows) {
    const baseKey = `${row.client_slug}__${stripCampaignSuffix(row.campaign_key)}`;

    if (map.has(baseKey)) {
      const existing = map.get(baseKey)!;
      const investment = existing.investment_cents + row.investment_cents;
      const leads = existing.leads + row.leads;
      const leadsComMensagem = existing.leads_com_mensagem + row.leads_com_mensagem;
      const agendados = existing.agendados + row.agendados;
      const compareceram = existing.compareceram + row.compareceram;
      const fechados = existing.fechados + row.fechados;
      const faturamento = existing.faturamento_cents + row.faturamento_cents;

      map.set(baseKey, {
        ...existing,
        investment_cents: investment,
        leads,
        leads_com_mensagem: leadsComMensagem,
        agendados,
        compareceram,
        fechados,
        faturamento_cents: faturamento,
        cpl_cents: leadsComMensagem > 0 ? Math.round(investment / leadsComMensagem) : 0,
        ticket_medio_cents: fechados > 0 ? Math.round(faturamento / fechados) : 0,
        taxa_agendamento: leads > 0 ? Math.round((agendados / leads) * 1000) / 10 : 0,
        taxa_comparecimento: agendados > 0 ? Math.round((compareceram / agendados) * 1000) / 10 : 0,
        taxa_conversao: leads > 0 ? Math.round((fechados / leads) * 1000) / 10 : 0,
        roas: investment > 0 ? Math.round((faturamento / investment) * 100) / 100 : 0
      });
    } else {
      map.set(baseKey, {
        ...row,
        campaign_key: stripCampaignSuffix(row.campaign_key),
        campaign_name: row.campaign_name ? stripCampaignSuffix(row.campaign_name) : null
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.faturamento_cents - a.faturamento_cents || b.investment_cents - a.investment_cents
  );
}

function computeSummary(rows: RelatorioRow[]): RelatorioSummary {
  const investment = rows.reduce((s, r) => s + r.investment_cents, 0);
  const leads = rows.reduce((s, r) => s + r.leads, 0);
  const leadsComMensagem = rows.reduce((s, r) => s + r.leads_com_mensagem, 0);
  const agendados = rows.reduce((s, r) => s + r.agendados, 0);
  const fechados = rows.reduce((s, r) => s + r.fechados, 0);
  const faturamento = rows.reduce((s, r) => s + r.faturamento_cents, 0);

  return {
    total_investment_cents: investment,
    total_leads: leads,
    total_leads_com_mensagem: leadsComMensagem,
    total_agendados: agendados,
    total_fechados: fechados,
    total_faturamento_cents: faturamento,
    cpl_cents: leadsComMensagem > 0 ? Math.round(investment / leadsComMensagem) : 0,
    taxa_agendamento: leads > 0 ? Math.round((agendados / leads) * 1000) / 10 : 0,
    taxa_fechamento: leads > 0 ? Math.round((fechados / leads) * 1000) / 10 : 0,
    roas: investment > 0 ? Math.round((faturamento / investment) * 100) / 100 : 0
  };
}

function emptyRelatorioSummary(): RelatorioSummary {
  return {
    total_investment_cents: 0,
    total_leads: 0,
    total_leads_com_mensagem: 0,
    total_agendados: 0,
    total_fechados: 0,
    total_faturamento_cents: 0,
    cpl_cents: 0,
    taxa_agendamento: 0,
    taxa_fechamento: 0,
    roas: 0
  };
}
