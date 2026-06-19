-- Migration 054: campanhas de disparo SMS com página de promoção dedicada

CREATE TABLE IF NOT EXISTS sms_blast_campaigns (
  id               BIGSERIAL PRIMARY KEY,
  client_slug      TEXT NOT NULL,
  name             TEXT NOT NULL,
  short_code       TEXT NOT NULL UNIQUE,

  -- Conteúdo da landing page de promoção
  promo_image_url  TEXT,
  promo_image_aspect TEXT NOT NULL DEFAULT '1:1',  -- '1:1' | '3:4' | '9:16'
  promo_title      TEXT,
  promo_description TEXT,

  -- Texto do SMS (use {link} como placeholder da URL)
  sms_template     TEXT,

  -- Botão CTA na landing page
  cta_text         TEXT NOT NULL DEFAULT 'Saiba mais',

  -- Destino WhatsApp
  whatsapp_number  TEXT NOT NULL,
  whatsapp_message TEXT NOT NULL DEFAULT 'Vim da promoção',

  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_blast_campaigns_client_slug ON sms_blast_campaigns(client_slug);
CREATE INDEX IF NOT EXISTS idx_sms_blast_campaigns_short_code  ON sms_blast_campaigns(short_code);
