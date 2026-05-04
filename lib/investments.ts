import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { listAllCampaigns } from "@/lib/campaigns";
import type { Currency } from "@/lib/format";

export type InvestmentRow = {
  id: number;
  created_at: string;
  client_slug: string;
  campaign: string;
  campaign_name: string | null;
  internal_campaign_slug: string | null;
  creative: string | null;
  audience: string | null;
  investment_cents: number;
  currency: Currency;
};

function toNumber(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normCurrency(value: unknown): Currency {
  if (value === "USD" || value === "EUR") return value;
  return "BRL";
}

export async function listInvestments(clientSlug?: string | null): Promise<InvestmentRow[]> {
  if (!hasDatabaseConfig()) return [];

  const values: unknown[] = [];
  const whereSql = clientSlug
    ? `WHERE client_slug = $${values.push(clientSlug)}`
    : "";

  const result = await queryDb<InvestmentRow>(
    `SELECT id, created_at, client_slug, campaign, campaign_name, internal_campaign_slug,
            creative, audience, investment_cents, COALESCE(currency, 'BRL') AS currency
     FROM ad_spend
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT 200`,
    values
  );

  return result.rows.map((row) => ({
    ...row,
    investment_cents: toNumber(row.investment_cents),
    currency: normCurrency(row.currency),
  }));
}

export async function saveInvestment(input: {
  clientSlug: string;
  campaign: string;
  campaignName?: string | null;
  internalCampaignId?: number | null;
  internalCampaignSlug?: string | null;
  creative?: string | null;
  audience?: string | null;
  investmentCents: number;
  currency?: Currency;
}) {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  if (!input.campaign.trim()) throw new Error("Informe a campanha.");

  const currency = normCurrency(input.currency ?? "BRL");

  await queryDb(
    `INSERT INTO ad_spend
       (client_slug, campaign, campaign_name, internal_campaign_id,
        internal_campaign_slug, creative, audience, impressions, investment_cents, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)`,
    [
      input.clientSlug.trim(),
      input.campaign.trim(),
      input.campaignName?.trim() || null,
      input.internalCampaignId ?? null,
      input.internalCampaignSlug?.trim() || null,
      input.creative?.trim() || null,
      input.audience?.trim() || null,
      Math.max(0, input.investmentCents),
      currency,
    ]
  );
}

export type AutoImportPreviewItem = {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  dailyBudgetCents: number;
  currency: Currency;
  leadDays: number;
  totalCents: number;
  alreadyImported: boolean;
};

export async function getAutoImportPreview(
  clientSlug: string
): Promise<AutoImportPreviewItem[]> {
  if (!hasDatabaseConfig()) return [];

  const campaigns = await listAllCampaigns(clientSlug);
  const withBudget = campaigns.filter((c) => c.dailyBudgetCents > 0);
  if (withBudget.length === 0) return [];

  const slugs = withBudget.map((c) => c.slug);

  const [daysResult, spendResult] = await Promise.all([
    queryDb<{ utm_campaign: string; days: string }>(
      `SELECT utm_campaign,
              COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/Sao_Paulo'))::int AS days
       FROM whatsapp_leads
       WHERE client_slug = $1
         AND utm_campaign = ANY($2)
         AND lead_phone IS NOT NULL
       GROUP BY utm_campaign`,
      [clientSlug, slugs]
    ),
    queryDb<{ campaign: string; count: string }>(
      `SELECT campaign, COUNT(*)::int AS count
       FROM ad_spend
       WHERE client_slug = $1 AND campaign = ANY($2)
       GROUP BY campaign`,
      [clientSlug, slugs]
    )
  ]);

  const daysMap = new Map(daysResult.rows.map((r) => [r.utm_campaign, Number(r.days)]));
  const spendMap = new Map(spendResult.rows.map((r) => [r.campaign, Number(r.count)]));

  return withBudget.map((c) => {
    const days = daysMap.get(c.slug) ?? 0;
    return {
      campaignId: c.id,
      campaignSlug: c.slug,
      campaignName: c.name,
      dailyBudgetCents: c.dailyBudgetCents,
      currency: c.currency,
      leadDays: days,
      totalCents: days * c.dailyBudgetCents,
      alreadyImported: (spendMap.get(c.slug) ?? 0) > 0
    };
  });
}

export async function executeAutoImport(
  clientSlug: string,
  campaignId: string
): Promise<{ days: number; totalCents: number }> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const campaigns = await listAllCampaigns(clientSlug);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw new Error("Campanha nao encontrada.");
  if (campaign.dailyBudgetCents <= 0) throw new Error("Campanha sem orcamento diario definido.");

  const daysResult = await queryDb<{ days: string }>(
    `SELECT COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/Sao_Paulo'))::int AS days
     FROM whatsapp_leads
     WHERE client_slug = $1 AND utm_campaign = $2 AND lead_phone IS NOT NULL`,
    [clientSlug, campaign.slug]
  );
  const days = Number(daysResult.rows[0]?.days ?? 0);
  if (days === 0) throw new Error("Nenhum dia com leads encontrado para esta campanha.");

  const totalCents = days * campaign.dailyBudgetCents;
  await saveInvestment({
    clientSlug,
    campaign: campaign.slug,
    campaignName: campaign.name,
    internalCampaignId: null,
    internalCampaignSlug: campaign.slug,
    investmentCents: totalCents,
    currency: campaign.currency
  });

  return { days, totalCents };
}
