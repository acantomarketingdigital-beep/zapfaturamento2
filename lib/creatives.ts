import { getRelatorioData, type RelatorioRow, type RelatorioOptions } from "@/lib/relatorio";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type CreativeBadge = "champion" | "mostLeads" | "mostAgendados";

export type CreativeRow = RelatorioRow & {
  creative_url: string | null;
  badges: CreativeBadge[];
  rank: number;
};

export type CreativesResult = {
  rows: CreativeRow[];
  champion: CreativeRow | null;
  mostLeads: CreativeRow | null;
  mostAgendados: CreativeRow | null;
};

async function fetchUrlMap(clientSlug?: string | null): Promise<Map<string, string>> {
  if (!hasDatabaseConfig()) return new Map();
  try {
    const vals: unknown[] = [];
    const where = clientSlug ? `WHERE cc.client_slug = $${vals.push(clientSlug)}` : "";
    const res = await queryDb<{ client_slug: string; slug: string; creative_url: string | null }>(
      `SELECT DISTINCT ON (cc.client_slug, cc.slug)
         cc.client_slug,
         cc.slug,
         COALESCE(cc.creative_url, cr.meta_ads_url) AS creative_url
       FROM client_campaigns cc
       LEFT JOIN campaign_creatives cr
         ON cr.campaign_id = cc.id
        AND cr.meta_ads_url IS NOT NULL
       ${where}`,
      vals
    );
    const map = new Map<string, string>();
    for (const r of res.rows) {
      if (r.creative_url) map.set(`${r.client_slug}::${r.slug}`, r.creative_url);
    }
    return map;
  } catch {
    return new Map();
  }
}

function resolveUrl(clientSlug: string, campaignKey: string, map: Map<string, string>): string | null {
  const exact = map.get(`${clientSlug}::${campaignKey}`);
  if (exact) return exact;
  // Prefix match for groupByBaseName ("vasinhos" → "vasinhos-a", "vasinhos-b", etc.)
  const prefix = `${clientSlug}::${campaignKey}`;
  for (const [k, url] of map) {
    if (k.startsWith(prefix + "-") || k.startsWith(prefix + "_")) return url;
  }
  return null;
}

export async function getCreativesData(options: RelatorioOptions): Promise<CreativesResult> {
  try {
    const [{ rows }, urlMap] = await Promise.all([
      getRelatorioData(options),
      fetchUrlMap(options.clientSlug)
    ]);

    const activeRows = rows.filter((r) => r.leads > 0);
    if (activeRows.length === 0) {
      return { rows: [], champion: null, mostLeads: null, mostAgendados: null };
    }

    // Sort for ranking: fechados DESC → agendados DESC → leads DESC
    const sorted = [...activeRows].sort((a, b) =>
      b.fechados !== a.fechados
        ? b.fechados - a.fechados
        : b.agendados !== a.agendados
        ? b.agendados - a.agendados
        : b.leads - a.leads
    );

    const ranked: CreativeRow[] = sorted.map((row, i) => ({
      ...row,
      creative_url: resolveUrl(row.client_slug, row.campaign_key, urlMap),
      badges: [],
      rank: i + 1
    }));

    // Find highlight indices in a single pass
    let championIdx = -1, leadsIdx = -1, agendadosIdx = -1;
    let maxFechados = 0, maxLeads = 0, maxAgendados = 0;

    for (let i = 0; i < ranked.length; i++) {
      const r = ranked[i];
      if (r.fechados > maxFechados) { maxFechados = r.fechados; championIdx = i; }
      if (r.leads > maxLeads) { maxLeads = r.leads; leadsIdx = i; }
      if (r.agendados > maxAgendados) { maxAgendados = r.agendados; agendadosIdx = i; }
    }

    if (championIdx >= 0) ranked[championIdx].badges.push("champion");
    if (leadsIdx >= 0) ranked[leadsIdx].badges.push("mostLeads");
    if (agendadosIdx >= 0) ranked[agendadosIdx].badges.push("mostAgendados");

    return {
      rows: ranked,
      champion: championIdx >= 0 ? ranked[championIdx] : null,
      mostLeads: leadsIdx >= 0 ? ranked[leadsIdx] : null,
      mostAgendados: agendadosIdx >= 0 ? ranked[agendadosIdx] : null
    };
  } catch {
    return { rows: [], champion: null, mostLeads: null, mostAgendados: null };
  }
}
