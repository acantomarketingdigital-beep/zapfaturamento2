import { slugifyClinicName } from "@/lib/clinic-shared";
import { clientSlugScope, hasDatabaseConfig, queryDb } from "@/lib/db";
import type { Currency } from "@/lib/format";

export type CampaignRecord = {
  id: string;
  clientId: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string;
  whatsappNumber: string | null;
  isActive: boolean;
  dailyBudgetCents: number;
  currency: Currency;
  creativeUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignInput = {
  id?: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string;
  whatsappNumber?: string | null;
  isActive: boolean;
  dailyBudgetCents?: number;
  currency?: Currency;
  creativeUrl?: string | null;
};

const VALID_CURRENCIES: Currency[] = ["BRL", "USD", "EUR"];

function normalizeCurrency(value: unknown): Currency {
  if (typeof value === "string" && VALID_CURRENCIES.includes(value as Currency)) {
    return value as Currency;
  }
  return "BRL";
}

type CampaignRow = {
  id: string;
  client_id: string;
  client_slug: string;
  name: string;
  slug: string;
  default_message: string;
  whatsapp_number: string | null;
  is_active: boolean;
  daily_budget_cents: string | number;
  currency: string | null;
  creative_url: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS = `id, client_id, client_slug, name, slug, default_message, whatsapp_number, is_active,
  daily_budget_cents, COALESCE(currency, 'BRL') AS currency, creative_url, created_at, updated_at`;

function mapRow(row: CampaignRow): CampaignRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    clientSlug: row.client_slug,
    name: row.name,
    slug: row.slug,
    defaultMessage: row.default_message,
    whatsappNumber: row.whatsapp_number ?? null,
    isActive: row.is_active,
    dailyBudgetCents: Number(row.daily_budget_cents ?? 0),
    currency: normalizeCurrency(row.currency),
    creativeUrl: row.creative_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCampaigns(clientSlug: string): Promise<CampaignRecord[]> {
  if (!hasDatabaseConfig()) return [];

  try {
    const result = await queryDb<CampaignRow>(
      `SELECT ${SELECT_COLS}
       FROM client_campaigns
       WHERE client_slug = $1
       ORDER BY is_active DESC, name ASC`,
      [clientSlug]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function listAllCampaigns(scopeClientSlug?: string | null): Promise<CampaignRecord[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const where = scopeClientSlug ? `WHERE ${clientSlugScope(1)}` : "";
    const params = scopeClientSlug ? [scopeClientSlug] : [];
    const result = await queryDb<CampaignRow>(
      `SELECT ${SELECT_COLS}
       FROM client_campaigns
       ${where}
       ORDER BY client_slug ASC, is_active DESC, name ASC`,
      params
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getCampaignBySlug(
  clientSlug: string,
  campaignSlug: string
): Promise<CampaignRecord | null> {
  if (!hasDatabaseConfig()) return null;

  try {
    const result = await queryDb<CampaignRow>(
      `SELECT ${SELECT_COLS}
       FROM client_campaigns
       WHERE client_slug = $1 AND slug = $2
       LIMIT 1`,
      [clientSlug, campaignSlug]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function saveCampaign(input: CampaignInput): Promise<CampaignRecord> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const slug = slugifyClinicName(input.slug || input.name);
  if (!slug) throw new Error("Informe um slug valido para a campanha.");
  if (!input.name.trim()) throw new Error("Informe o nome da campanha.");
  if (!input.defaultMessage.trim()) throw new Error("Informe a mensagem padrao do WhatsApp.");

  const dailyBudgetCents = Math.max(0, Math.round(input.dailyBudgetCents ?? 0));
  const currency = normalizeCurrency(input.currency);
  const creativeUrl = input.creativeUrl?.trim() || null;

  const whatsappNumber = input.whatsappNumber?.trim().replace(/\D/g, "") || null;

  if (input.id) {
    const result = await queryDb<CampaignRow>(
      `UPDATE client_campaigns
       SET name = $2, slug = $3, default_message = $4, is_active = $5,
           daily_budget_cents = $6, currency = $8, creative_url = $9, whatsapp_number = $10
       WHERE id = $1 AND client_slug = $7
       RETURNING ${SELECT_COLS}`,
      [input.id, input.name.trim(), slug, input.defaultMessage.trim(),
       input.isActive, dailyBudgetCents, input.clientSlug, currency, creativeUrl, whatsappNumber]
    );
    if (!result.rows[0]) throw new Error("Campanha nao encontrada.");
    return mapRow(result.rows[0]);
  }

  const clientResult = await queryDb<{ id: string }>(
    `SELECT id FROM clients WHERE client_slug = $1 LIMIT 1`,
    [input.clientSlug]
  );
  if (!clientResult.rows[0]) throw new Error("Cliente nao encontrado.");

  const result = await queryDb<CampaignRow>(
    `INSERT INTO client_campaigns
       (client_id, client_slug, name, slug, default_message, is_active, daily_budget_cents, currency, creative_url, whatsapp_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${SELECT_COLS}`,
    [
      clientResult.rows[0].id,
      input.clientSlug,
      input.name.trim(),
      slug,
      input.defaultMessage.trim(),
      input.isActive,
      dailyBudgetCents,
      currency,
      creativeUrl,
      whatsappNumber,
    ]
  );
  if (!result.rows[0]) throw new Error("Ja existe uma campanha com este slug para este cliente.");
  return mapRow(result.rows[0]);
}

export async function deleteCampaign(id: string, clientSlug: string): Promise<void> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  await queryDb(
    `DELETE FROM client_campaigns WHERE id = $1 AND client_slug = $2`,
    [id, clientSlug]
  );
}

export async function toggleCampaignActive(
  id: string,
  clientSlug: string,
  isActive: boolean
): Promise<CampaignRecord> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");

  const result = await queryDb<CampaignRow>(
    `UPDATE client_campaigns SET is_active = $3
     WHERE id = $1 AND client_slug = $2
     RETURNING ${SELECT_COLS}`,
    [id, clientSlug, isActive]
  );
  if (!result.rows[0]) throw new Error("Campanha nao encontrada.");
  return mapRow(result.rows[0]);
}
