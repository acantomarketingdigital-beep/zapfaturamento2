import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type CreativeHighlight = {
  campaign_slug: string;
  campaign_name: string;
  creative_url: string | null;
  client_slug: string;
  total_leads: number;
  total_agendados: number;
  total_fechados: number;
};

type HighlightRow = {
  internal_campaign_slug: string;
  campaign_name: string | null;
  creative_url: string | null;
  client_slug: string;
  total_leads: string | number;
  total_agendados: string | number;
  total_fechados: string | number;
};

function toNum(v: string | number | null | undefined) {
  return typeof v === "number" ? v : Number(v ?? 0);
}

export async function getCreativeHighlights(clientSlug?: string | null): Promise<{
  champion: CreativeHighlight | null;
  mostLeads: CreativeHighlight | null;
}> {
  if (!hasDatabaseConfig()) return { champion: null, mostLeads: null };

  try {
    const values: unknown[] = [];
    const where = clientSlug
      ? `WHERE wl.internal_campaign_slug IS NOT NULL AND wl.client_slug = $${values.push(clientSlug)}`
      : `WHERE wl.internal_campaign_slug IS NOT NULL`;

    const result = await queryDb<HighlightRow>(
      `SELECT
        wl.internal_campaign_slug,
        COALESCE(cc.name, wl.internal_campaign_slug) AS campaign_name,
        cc.creative_url,
        wl.client_slug,
        COUNT(*)::bigint                                                              AS total_leads,
        COUNT(*) FILTER (WHERE wl.lead_status = 'agendado')::bigint                  AS total_agendados,
        COUNT(*) FILTER (WHERE wl.lead_status IN ('pago', 'finalizado'))::bigint     AS total_fechados
      FROM whatsapp_leads wl
      LEFT JOIN client_campaigns cc
        ON cc.slug = wl.internal_campaign_slug
       AND cc.client_slug = wl.client_slug
      ${where}
      GROUP BY wl.internal_campaign_slug, cc.name, cc.creative_url, wl.client_slug
      HAVING COUNT(*) > 0`,
      values
    );

    const rows: CreativeHighlight[] = result.rows.map((r) => ({
      campaign_slug: r.internal_campaign_slug,
      campaign_name: r.campaign_name ?? r.internal_campaign_slug,
      creative_url: r.creative_url ?? null,
      client_slug: r.client_slug,
      total_leads: toNum(r.total_leads),
      total_agendados: toNum(r.total_agendados),
      total_fechados: toNum(r.total_fechados)
    }));

    const champion =
      rows
        .filter((r) => r.total_fechados > 0)
        .sort((a, b) => b.total_fechados - a.total_fechados)[0] ?? null;

    const mostLeads =
      rows
        .filter((r) => r.total_leads > 0)
        .sort((a, b) => b.total_leads - a.total_leads)[0] ?? null;

    return { champion, mostLeads };
  } catch {
    return { champion: null, mostLeads: null };
  }
}
