import { hasDatabaseConfig, queryDb } from "@/lib/db";

export type PromoAspect = "1:1" | "3:4" | "9:16";

export type SmsBlastRecord = {
  id: string;
  clientSlug: string;
  name: string;
  shortCode: string;
  promoImageUrl: string | null;
  promoImageAspect: PromoAspect;
  promoTitle: string | null;
  promoDescription: string | null;
  smsTemplate: string | null;
  ctaText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type SmsBlastRow = {
  id: string;
  client_slug: string;
  name: string;
  short_code: string;
  promo_image_url: string | null;
  promo_image_aspect: string;
  promo_title: string | null;
  promo_description: string | null;
  sms_template: string | null;
  cta_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const VALID_ASPECTS: PromoAspect[] = ["1:1", "3:4", "9:16"];

function normalizeAspect(v: unknown): PromoAspect {
  if (typeof v === "string" && VALID_ASPECTS.includes(v as PromoAspect)) return v as PromoAspect;
  return "1:1";
}

function mapRow(r: SmsBlastRow): SmsBlastRecord {
  return {
    id: r.id,
    clientSlug: r.client_slug,
    name: r.name,
    shortCode: r.short_code,
    promoImageUrl: r.promo_image_url ?? null,
    promoImageAspect: normalizeAspect(r.promo_image_aspect),
    promoTitle: r.promo_title ?? null,
    promoDescription: r.promo_description ?? null,
    smsTemplate: r.sms_template ?? null,
    ctaText: r.cta_text,
    whatsappNumber: r.whatsapp_number,
    whatsappMessage: r.whatsapp_message,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function generateShortCode(clientSlug: string): string {
  const prefix = clientSlug.split("-").slice(0, 2).join("-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}`;
}

const SELECT_COLS = `id, client_slug, name, short_code,
  promo_image_url, COALESCE(promo_image_aspect,'1:1') AS promo_image_aspect,
  promo_title, promo_description, sms_template,
  COALESCE(cta_text,'Saiba mais') AS cta_text,
  whatsapp_number, COALESCE(whatsapp_message,'Vim da promoção') AS whatsapp_message,
  is_active, created_at, updated_at`;

export async function listSmsBlasts(clientSlug: string): Promise<SmsBlastRecord[]> {
  if (!hasDatabaseConfig()) return [];
  try {
    const r = await queryDb<SmsBlastRow>(
      `SELECT ${SELECT_COLS} FROM sms_blast_campaigns
       WHERE client_slug = $1 ORDER BY created_at DESC`,
      [clientSlug]
    );
    return r.rows.map(mapRow);
  } catch { return []; }
}

export async function getSmsBlastByShortCode(shortCode: string): Promise<SmsBlastRecord | null> {
  if (!hasDatabaseConfig()) return null;
  try {
    const r = await queryDb<SmsBlastRow>(
      `SELECT ${SELECT_COLS} FROM sms_blast_campaigns WHERE short_code = $1 LIMIT 1`,
      [shortCode]
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch { return null; }
}

export type SmsBlastInput = {
  id?: string;
  clientSlug: string;
  name: string;
  promoImageAspect?: PromoAspect;
  promoTitle?: string | null;
  promoDescription?: string | null;
  smsTemplate?: string | null;
  ctaText?: string;
  whatsappNumber: string;
  whatsappMessage: string;
};

export async function saveSmsBlast(input: SmsBlastInput): Promise<SmsBlastRecord> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  if (!input.name.trim()) throw new Error("Informe o nome da promo.");
  if (!input.whatsappNumber.trim()) throw new Error("Informe o numero de WhatsApp.");
  if (!input.whatsappMessage.trim()) throw new Error("Informe a mensagem do WhatsApp.");

  const aspect = normalizeAspect(input.promoImageAspect);
  const ctaText = input.ctaText?.trim() || "Saiba mais";
  const whatsappNumber = input.whatsappNumber.replace(/\D/g, "");

  if (input.id) {
    const r = await queryDb<SmsBlastRow>(
      `UPDATE sms_blast_campaigns
       SET name=$2, promo_image_aspect=$3, promo_title=$4, promo_description=$5,
           sms_template=$6, cta_text=$7, whatsapp_number=$8, whatsapp_message=$9,
           updated_at=NOW()
       WHERE id=$1 AND client_slug=$10
       RETURNING ${SELECT_COLS}`,
      [
        input.id, input.name.trim(), aspect,
        input.promoTitle?.trim() || null, input.promoDescription?.trim() || null,
        input.smsTemplate?.trim() || null, ctaText, whatsappNumber,
        input.whatsappMessage.trim(), input.clientSlug,
      ]
    );
    if (!r.rows[0]) throw new Error("Promo nao encontrada.");
    return mapRow(r.rows[0]);
  }

  const shortCode = generateShortCode(input.clientSlug);
  const r = await queryDb<SmsBlastRow>(
    `INSERT INTO sms_blast_campaigns
       (client_slug, name, short_code, promo_image_aspect,
        promo_title, promo_description, sms_template, cta_text,
        whatsapp_number, whatsapp_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING ${SELECT_COLS}`,
    [
      input.clientSlug, input.name.trim(), shortCode, aspect,
      input.promoTitle?.trim() || null, input.promoDescription?.trim() || null,
      input.smsTemplate?.trim() || null, ctaText, whatsappNumber,
      input.whatsappMessage.trim(),
    ]
  );
  if (!r.rows[0]) throw new Error("Erro ao criar promo.");
  return mapRow(r.rows[0]);
}

export async function deleteSmsBlast(id: string, clientSlug: string): Promise<void> {
  if (!hasDatabaseConfig()) throw new Error("DATABASE_URL nao configurada.");
  await queryDb(
    `DELETE FROM sms_blast_campaigns WHERE id=$1 AND client_slug=$2`,
    [id, clientSlug]
  );
}

export async function toggleSmsBlast(id: string, clientSlug: string, isActive: boolean): Promise<SmsBlastRecord> {
  const r = await queryDb<SmsBlastRow>(
    `UPDATE sms_blast_campaigns SET is_active=$3, updated_at=NOW()
     WHERE id=$1 AND client_slug=$2 RETURNING ${SELECT_COLS}`,
    [id, clientSlug, isActive]
  );
  if (!r.rows[0]) throw new Error("Promo nao encontrada.");
  return mapRow(r.rows[0]);
}
