-- Add per-campaign WhatsApp number override
ALTER TABLE client_campaigns ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Saved WhatsApp numbers per client (for quick selection in campaign form)
CREATE TABLE IF NOT EXISTS client_whatsapp_numbers (
  id          SERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug TEXT        NOT NULL,
  phone_number TEXT       NOT NULL,
  label        TEXT       NOT NULL DEFAULT '',
  UNIQUE (client_slug, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_client_whatsapp_numbers_slug
  ON client_whatsapp_numbers (client_slug);
