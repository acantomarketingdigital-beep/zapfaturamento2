import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type PerformanceOptions = {
  clientSlug?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
};

export type AllCreativeRow = {
  creative_id: number;
  creative_name: string;
  creative_slug: string;
  campaign_name: string;
  campaign_slug: string;
  client_slug: string;
  ad_url: string | null;
  leads: number;
  agendados: number;
  fechados: number;
  faturamento_cents: number;
  taxa_agendamento: number;
  taxa_fechamento: number;
};

export type PlacementRow = {
  placement: string;
  leads: number;
  agendados: number;
  fechados: number;
  faturamento_cents: number;
  taxa_agendamento: number;
  taxa_fechamento: number;
  best_creative_name: string | null;
  best_creative_slug: string | null;
  best_creative_leads: number;
  best_creative_agendados: number;
  best_creative_fechados: number;
};

export async function getAllCreatives(opts: PerformanceOptions): Promise<AllCreativeRow[]> {
  if (!hasDatabaseConfig()) return [];

  const vals: unknown[] = [];
  const cWhere: string[] = [];
  const lWhere: string[] = [];

  if (opts.clientSlug) {
    vals.push(opts.clientSlug);
    const n = vals.length;
    cWhere.push(`cc.client_slug = $${n}`);
    lWhere.push(`wl.client_slug = $${n}`);
  }
  if (opts.dateStart) {
    vals.push(opts.dateStart);
    lWhere.push(`wl.created_at >= $${vals.length}::date`);
  }
  if (opts.dateEnd) {
    vals.push(opts.dateEnd);
    lWhere.push(`wl.created_at < ($${vals.length}::date + INTERVAL '1 day')`);
  }

  const creativeWhere = cWhere.length ? `WHERE ${cWhere.join(" AND ")}` : "";
  const leadsSubWhere = lWhere.length ? `WHERE ${lWhere.join(" AND ")}` : "";

  try {
    const res = await queryDb<{
      creative_id: string;
      creative_name: string;
      creative_slug: string;
      campaign_name: string;
      campaign_slug: string;
      client_slug: string;
      ad_url: string | null;
      leads: string;
      agendados: string;
      fechados: string;
      faturamento_cents: string;
      taxa_agendamento: string;
      taxa_fechamento: string;
    }>(
      `SELECT
         cc.id::text                                               AS creative_id,
         cc.name                                                   AS creative_name,
         cc.slug                                                   AS creative_slug,
         camp.name                                                 AS campaign_name,
         camp.slug                                                 AS campaign_slug,
         cc.client_slug,
         cc.meta_ads_url                                           AS ad_url,
         COALESCE(l.leads, 0)::text                               AS leads,
         COALESCE(l.agendados, 0)::text                           AS agendados,
         COALESCE(l.fechados, 0)::text                            AS fechados,
         COALESCE(l.faturamento_cents, 0)::text                   AS faturamento_cents,
         CASE WHEN COALESCE(l.leads, 0) > 0
           THEN ROUND(100.0 * COALESCE(l.agendados, 0)::numeric / l.leads, 1)
           ELSE 0 END::text                                        AS taxa_agendamento,
         CASE WHEN COALESCE(l.agendados, 0) > 0
           THEN ROUND(100.0 * COALESCE(l.fechados, 0)::numeric / l.agendados, 1)
           ELSE 0 END::text                                        AS taxa_fechamento
       FROM campaign_creatives cc
       JOIN client_campaigns camp ON camp.id = cc.campaign_id
       LEFT JOIN (
         SELECT
           creative_slug,
           client_slug,
           COUNT(*)                                              AS leads,
           COUNT(*) FILTER (WHERE lead_status = 'agendado')     AS agendados,
           COUNT(*) FILTER (WHERE lead_status IN ('pago','finalizado')) AS fechados,
           COALESCE(SUM(paid_amount_cents), 0)                  AS faturamento_cents
         FROM whatsapp_leads wl
         ${leadsSubWhere}
         GROUP BY creative_slug, client_slug
       ) l ON l.creative_slug = cc.slug AND l.client_slug = cc.client_slug
       ${creativeWhere}
       ORDER BY leads DESC, agendados DESC, fechados DESC, cc.name ASC`,
      vals
    );

    return res.rows.map((r) => ({
      creative_id: Number(r.creative_id),
      creative_name: r.creative_name,
      creative_slug: r.creative_slug,
      campaign_name: r.campaign_name,
      campaign_slug: r.campaign_slug,
      client_slug: r.client_slug,
      ad_url: r.ad_url,
      leads: Number(r.leads),
      agendados: Number(r.agendados),
      fechados: Number(r.fechados),
      faturamento_cents: Number(r.faturamento_cents),
      taxa_agendamento: Number(r.taxa_agendamento),
      taxa_fechamento: Number(r.taxa_fechamento),
    }));
  } catch {
    return [];
  }
}

export async function getPlacementsData(opts: PerformanceOptions): Promise<PlacementRow[]> {
  if (!hasDatabaseConfig()) return [];

  const vals: unknown[] = [];
  const wClauses: string[] = [];

  if (opts.clientSlug) {
    vals.push(opts.clientSlug);
    wClauses.push(`client_slug = $${vals.length}`);
  }
  if (opts.dateStart) {
    vals.push(opts.dateStart);
    wClauses.push(`created_at >= $${vals.length}::date`);
  }
  if (opts.dateEnd) {
    vals.push(opts.dateEnd);
    wClauses.push(`created_at < ($${vals.length}::date + INTERVAL '1 day')`);
  }

  const where = wClauses.length ? `WHERE ${wClauses.join(" AND ")}` : "";

  try {
    const res = await queryDb<{
      placement: string;
      leads: string;
      agendados: string;
      fechados: string;
      faturamento_cents: string;
      taxa_agendamento: string;
      taxa_fechamento: string;
      best_creative_slug: string | null;
      best_creative_name: string | null;
      best_creative_leads: string;
      best_creative_agendados: string;
      best_creative_fechados: string;
    }>(
      `WITH pcs AS (
         SELECT
           COALESCE(NULLIF(TRIM(COALESCE(placement, '')), ''), 'Nao identificado') AS placement,
           NULLIF(TRIM(COALESCE(creative_slug, '')), '')                            AS creative_slug,
           client_slug,
           COUNT(*)                                                                 AS leads,
           COUNT(*) FILTER (WHERE lead_status = 'agendado')                        AS agendados,
           COUNT(*) FILTER (WHERE lead_status IN ('pago','finalizado'))             AS fechados,
           COALESCE(SUM(paid_amount_cents), 0)                                      AS faturamento_cents
         FROM whatsapp_leads
         ${where}
         GROUP BY
           COALESCE(NULLIF(TRIM(COALESCE(placement, '')), ''), 'Nao identificado'),
           NULLIF(TRIM(COALESCE(creative_slug, '')), ''),
           client_slug
       ),
       pt AS (
         SELECT
           placement,
           SUM(leads)                                                        AS leads,
           SUM(agendados)                                                    AS agendados,
           SUM(fechados)                                                     AS fechados,
           SUM(faturamento_cents)                                            AS faturamento_cents,
           CASE WHEN SUM(leads) > 0
             THEN ROUND(100.0 * SUM(agendados)::numeric / SUM(leads), 1)
             ELSE 0 END                                                      AS taxa_agendamento,
           CASE WHEN SUM(agendados) > 0
             THEN ROUND(100.0 * SUM(fechados)::numeric / SUM(agendados), 1)
             ELSE 0 END                                                      AS taxa_fechamento
         FROM pcs
         GROUP BY placement
       ),
       bp AS (
         SELECT DISTINCT ON (placement)
           placement,
           creative_slug,
           client_slug,
           leads  AS best_leads,
           agendados AS best_agendados,
           fechados  AS best_fechados
         FROM pcs
         WHERE creative_slug IS NOT NULL
         ORDER BY placement, leads DESC, agendados DESC, fechados DESC
       )
       SELECT
         pt.placement,
         pt.leads::text,
         pt.agendados::text,
         pt.fechados::text,
         pt.faturamento_cents::text,
         pt.taxa_agendamento::text,
         pt.taxa_fechamento::text,
         bp.creative_slug                              AS best_creative_slug,
         COALESCE(cc.name, bp.creative_slug)          AS best_creative_name,
         COALESCE(bp.best_leads, 0)::text             AS best_creative_leads,
         COALESCE(bp.best_agendados, 0)::text         AS best_creative_agendados,
         COALESCE(bp.best_fechados, 0)::text          AS best_creative_fechados
       FROM pt
       LEFT JOIN bp ON bp.placement = pt.placement
       LEFT JOIN campaign_creatives cc
         ON cc.slug = bp.creative_slug AND cc.client_slug = bp.client_slug
       ORDER BY pt.leads DESC, pt.agendados DESC, pt.fechados DESC`,
      vals
    );

    return res.rows.map((r) => ({
      placement: r.placement,
      leads: Number(r.leads),
      agendados: Number(r.agendados),
      fechados: Number(r.fechados),
      faturamento_cents: Number(r.faturamento_cents),
      taxa_agendamento: Number(r.taxa_agendamento),
      taxa_fechamento: Number(r.taxa_fechamento),
      best_creative_slug: r.best_creative_slug,
      best_creative_name: r.best_creative_name,
      best_creative_leads: Number(r.best_creative_leads),
      best_creative_agendados: Number(r.best_creative_agendados),
      best_creative_fechados: Number(r.best_creative_fechados),
    }));
  } catch {
    return [];
  }
}
