import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type GroupCampaign = {
  id: string;
  client_slug: string;
  name: string;
  tracking_slug: string;
  group_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GroupCampaignWithStats = GroupCampaign & {
  page_views: number;
  join_clicks: number;
  ctr: number;
  capi_leads: number;
};

export function isValidWhatsAppGroupUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "chat.whatsapp.com" ||
        parsed.hostname === "www.chat.whatsapp.com")
    );
  } catch {
    return false;
  }
}

export async function listGroupCampaigns(
  clientSlug?: string | null
): Promise<GroupCampaignWithStats[]> {
  if (!hasDatabaseConfig()) return [];

  const values: unknown[] = [];
  const where = clientSlug
    ? `WHERE g.client_slug = $${values.push(clientSlug)}`
    : "";

  const result = await queryDb<
    GroupCampaign & {
      page_views: string;
      join_clicks: string;
      capi_leads: string;
    }
  >(
    `SELECT
       g.*,
       COALESCE(SUM(CASE WHEN e.event_name = 'group_page_view' THEN 1 ELSE 0 END), 0)::int AS page_views,
       COALESCE(SUM(CASE WHEN e.event_name = 'group_join_click' THEN 1 ELSE 0 END), 0)::int AS join_clicks,
       COALESCE(SUM(CASE WHEN e.event_name = 'group_join_click' AND e.capi_sent = TRUE THEN 1 ELSE 0 END), 0)::int AS capi_leads
     FROM group_campaigns g
     LEFT JOIN group_tracking_events e ON e.campaign_id = g.id
     ${where}
     GROUP BY g.id
     ORDER BY g.created_at DESC`,
    values
  );

  return result.rows.map((row) => {
    const views = Number(row.page_views);
    const clicks = Number(row.join_clicks);
    return {
      ...row,
      page_views: views,
      join_clicks: clicks,
      ctr: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
      capi_leads: Number(row.capi_leads)
    };
  });
}

export async function getGroupCampaign(
  clientSlug: string,
  trackingSlug: string
): Promise<GroupCampaign | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<GroupCampaign>(
    `SELECT * FROM group_campaigns WHERE client_slug = $1 AND tracking_slug = $2 AND is_active = TRUE LIMIT 1`,
    [clientSlug, trackingSlug]
  );
  return result.rows[0] ?? null;
}

export async function createGroupCampaign(input: {
  clientSlug: string;
  name: string;
  trackingSlug: string;
  groupUrl: string;
}): Promise<GroupCampaign> {
  const result = await queryDb<GroupCampaign>(
    `INSERT INTO group_campaigns (client_slug, name, tracking_slug, group_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.clientSlug, input.name, input.trackingSlug, input.groupUrl]
  );
  return result.rows[0];
}

export async function toggleGroupCampaign(
  id: string,
  isActive: boolean,
  clientSlug?: string | null
): Promise<void> {
  const scopeSql = clientSlug ? `AND client_slug = $3` : "";
  const values: unknown[] = [isActive, id];
  if (clientSlug) values.push(clientSlug);
  await queryDb(
    `UPDATE group_campaigns SET is_active = $1, updated_at = NOW() WHERE id = $2 ${scopeSql}`,
    values
  );
}

export async function deleteGroupCampaign(
  id: string,
  clientSlug?: string | null
): Promise<void> {
  const scopeSql = clientSlug ? `AND client_slug = $2` : "";
  const values: unknown[] = [id];
  if (clientSlug) values.push(clientSlug);
  await queryDb(
    `DELETE FROM group_campaigns WHERE id = $1 ${scopeSql}`,
    values
  );
}

export async function insertGroupTrackingEvent(input: {
  clientSlug: string;
  campaignId: string;
  eventName: string;
  eventId: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  metaCampaignId?: string | null;
  metaAdsetId?: string | null;
  metaAdId?: string | null;
  placement?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  capiSent?: boolean;
  capiSuccess?: boolean | null;
}): Promise<void> {
  await queryDb(
    `INSERT INTO group_tracking_events
       (client_slug, campaign_id, event_name, event_id,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        meta_campaign_id, meta_adset_id, meta_ad_id, placement,
        fbp, fbc, ip_hash, user_agent_hash, capi_sent, capi_success)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [
      input.clientSlug,
      input.campaignId,
      input.eventName,
      input.eventId,
      input.utmSource ?? null,
      input.utmMedium ?? null,
      input.utmCampaign ?? null,
      input.utmContent ?? null,
      input.utmTerm ?? null,
      input.metaCampaignId ?? null,
      input.metaAdsetId ?? null,
      input.metaAdId ?? null,
      input.placement ?? null,
      input.fbp ?? null,
      input.fbc ?? null,
      input.ipHash ?? null,
      input.userAgentHash ?? null,
      input.capiSent ?? false,
      input.capiSuccess ?? null
    ]
  );
}
