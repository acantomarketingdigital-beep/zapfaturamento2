import { slugifyClinicName } from "@/lib/clinic-shared";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type CreativeRecord = {
  id: string;
  campaignId: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string | null;
  metaAdsUrl: string | null;
  isActive: boolean;
  isSitelink: boolean;
  sitelinkDesc1: string | null;
  sitelinkDesc2: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreativeInput = {
  id?: string;
  campaignId: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage?: string | null;
  metaAdsUrl?: string | null;
  isActive?: boolean;
  isSitelink?: boolean;
  sitelinkDesc1?: string | null;
  sitelinkDesc2?: string | null;
};

type CreativeRow = {
  id: string;
  campaign_id: string;
  client_slug: string;
  name: string;
  slug: string;
  default_message: string | null;
  meta_ads_url: string | null;
  is_active: boolean;
  is_sitelink: boolean;
  sitelink_desc1: string | null;
  sitelink_desc2: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS = `id, campaign_id, client_slug, name, slug, default_message, meta_ads_url, is_active, is_sitelink, sitelink_desc1, sitelink_desc2, created_at, updated_at`;

function mapRow(row: CreativeRow): CreativeRecord {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    clientSlug: row.client_slug,
    name: row.name,
    slug: row.slug,
    defaultMessage: row.default_message ?? null,
    metaAdsUrl: row.meta_ads_url ?? null,
    isActive: row.is_active,
    isSitelink: row.is_sitelink ?? false,
    sitelinkDesc1: row.sitelink_desc1 ?? null,
    sitelinkDesc2: row.sitelink_desc2 ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCreatives(campaignId: string): Promise<CreativeRecord[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const result = await queryDb<CreativeRow>(
      `SELECT ${SELECT_COLS} FROM campaign_creatives
       WHERE campaign_id = $1
       ORDER BY is_active DESC, created_at ASC`,
      [campaignId]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getCreativeBySlug(
  campaignId: string,
  creativeSlug: string
): Promise<CreativeRecord | null> {
  if (!hasDatabaseConfig()) return null;
  try {
    const result = await queryDb<CreativeRow>(
      `SELECT ${SELECT_COLS} FROM campaign_creatives
       WHERE campaign_id = $1 AND slug = $2
       LIMIT 1`,
      [campaignId, creativeSlug]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function saveCreative(input: CreativeInput): Promise<CreativeRecord> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const slug = slugifyClinicName(input.slug || input.name);
  if (!slug) throw new Error("Informe um slug valido para o criativo.");
  if (!input.name.trim()) throw new Error("Informe o nome do criativo.");

  const isSitelink = input.isSitelink === true;

  if (isSitelink && input.name.trim().length > 25) {
    throw new Error("Titulo do sitelink deve ter no maximo 25 caracteres.");
  }
  if (isSitelink && input.sitelinkDesc1 && input.sitelinkDesc1.trim().length > 35) {
    throw new Error("Descricao 1 do sitelink deve ter no maximo 35 caracteres.");
  }
  if (isSitelink && input.sitelinkDesc2 && input.sitelinkDesc2.trim().length > 35) {
    throw new Error("Descricao 2 do sitelink deve ter no maximo 35 caracteres.");
  }

  const defaultMessage = input.defaultMessage?.trim() || null;
  const metaAdsUrl = input.metaAdsUrl?.trim() || null;
  const isActive = input.isActive !== false;
  const sitelinkDesc1 = input.sitelinkDesc1?.trim() || null;
  const sitelinkDesc2 = input.sitelinkDesc2?.trim() || null;

  if (input.id) {
    const result = await queryDb<CreativeRow>(
      `UPDATE campaign_creatives
       SET name = $2, slug = $3, default_message = $4, meta_ads_url = $5, is_active = $6, sitelink_desc1 = $7, sitelink_desc2 = $8
       WHERE id = $1 AND campaign_id = $9
       RETURNING ${SELECT_COLS}`,
      [input.id, input.name.trim(), slug, defaultMessage, metaAdsUrl, isActive, sitelinkDesc1, sitelinkDesc2, input.campaignId]
    );
    if (!result.rows[0]) throw new Error("Criativo nao encontrado.");
    return mapRow(result.rows[0]);
  }

  const result = await queryDb<CreativeRow>(
    `INSERT INTO campaign_creatives (campaign_id, client_slug, name, slug, default_message, meta_ads_url, is_active, is_sitelink, sitelink_desc1, sitelink_desc2)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${SELECT_COLS}`,
    [input.campaignId, input.clientSlug, input.name.trim(), slug, defaultMessage, metaAdsUrl, isActive, isSitelink, sitelinkDesc1, sitelinkDesc2]
  );
  if (!result.rows[0]) throw new Error("Ja existe um criativo com este slug nesta campanha.");
  return mapRow(result.rows[0]);
}

export async function deleteCreative(id: string, campaignId: string): Promise<void> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  await queryDb(
    `DELETE FROM campaign_creatives WHERE id = $1 AND campaign_id = $2`,
    [id, campaignId]
  );
}

export async function toggleCreativeActive(
  id: string,
  campaignId: string,
  isActive: boolean
): Promise<CreativeRecord> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  const result = await queryDb<CreativeRow>(
    `UPDATE campaign_creatives SET is_active = $3
     WHERE id = $1 AND campaign_id = $2
     RETURNING ${SELECT_COLS}`,
    [id, campaignId, isActive]
  );
  if (!result.rows[0]) throw new Error("Criativo nao encontrado.");
  return mapRow(result.rows[0]);
}

export type CreativeLeadRow = {
  client_slug: string;
  campaign_slug: string;
  creative_slug: string;
  leads: number;
  agendados: number;
  fechados: number;
  taxa_agendamento: number;
  taxa_conversao: number;
};

export async function getCreativeLeadsBreakdown(options: {
  clientSlug?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
}): Promise<CreativeLeadRow[]> {
  if (!hasDatabaseConfig()) return [];

  const values: unknown[] = [];
  const clauses: string[] = ["creative_slug IS NOT NULL", "creative_slug <> ''"];

  if (options.clientSlug) {
    values.push(options.clientSlug);
    clauses.push(`client_slug = $${values.length}`);
  }
  if (options.dateStart) {
    values.push(options.dateStart);
    clauses.push(`created_at >= $${values.length}::date`);
  }
  if (options.dateEnd) {
    values.push(options.dateEnd);
    clauses.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`);
  }

  const where = `WHERE ${clauses.join(" AND ")}`;

  try {
    const result = await queryDb<{
      client_slug: string;
      campaign_slug: string;
      creative_slug: string;
      leads: string;
      agendados: string;
      fechados: string;
    }>(
      `SELECT
         client_slug,
         COALESCE(internal_campaign_slug, utm_campaign, '') AS campaign_slug,
         creative_slug,
         COUNT(*)::int AS leads,
         COUNT(*) FILTER (WHERE lead_status = 'agendado')::int AS agendados,
         COUNT(*) FILTER (WHERE lead_status IN ('pago', 'finalizado'))::int AS fechados
       FROM whatsapp_leads
       ${where}
       GROUP BY client_slug, COALESCE(internal_campaign_slug, utm_campaign, ''), creative_slug
       ORDER BY client_slug, campaign_slug, leads DESC`,
      values
    );

    return result.rows.map((r) => {
      const leads = Number(r.leads);
      const agendados = Number(r.agendados);
      const fechados = Number(r.fechados);
      return {
        client_slug: r.client_slug,
        campaign_slug: r.campaign_slug,
        creative_slug: r.creative_slug,
        leads,
        agendados,
        fechados,
        taxa_agendamento: leads > 0 ? Math.round((agendados / leads) * 1000) / 10 : 0,
        taxa_conversao: leads > 0 ? Math.round((fechados / leads) * 1000) / 10 : 0,
      };
    });
  } catch {
    return [];
  }
}
