-- Multi-channel lead capture: Instagram Direct + Facebook Messenger

-- 1. New fields on whatsapp_leads
ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS channel          TEXT         NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS lead_external_id TEXT,
  ADD COLUMN IF NOT EXISTS lead_username    TEXT,
  ADD COLUMN IF NOT EXISTS page_id          TEXT,
  ADD COLUMN IF NOT EXISTS message_text     TEXT,
  ADD COLUMN IF NOT EXISTS last_message_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_payload   JSONB;

-- 2. Unique index for upsert (Instagram IGSID / Messenger PSID per channel)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_channel_external
  ON whatsapp_leads (channel, lead_external_id)
  WHERE lead_external_id IS NOT NULL;

-- 3. Index for channel filter in Kanban
CREATE INDEX IF NOT EXISTS idx_leads_channel
  ON whatsapp_leads (channel);

-- 4. Map Meta pages/Instagram accounts to clients for webhook routing
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS meta_page_id      TEXT,
  ADD COLUMN IF NOT EXISTS meta_instagram_id TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_meta_page_id
  ON clients (meta_page_id)
  WHERE meta_page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_meta_instagram_id
  ON clients (meta_instagram_id)
  WHERE meta_instagram_id IS NOT NULL;
