CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug TEXT NOT NULL,
  client_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  source_platform TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  placement TEXT,
  fbclid TEXT,
  gclid TEXT,
  device TEXT,
  keyword TEXT,
  matchtype TEXT,
  network TEXT,
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  kommo_success BOOLEAN,
  kommo_lead_id BIGINT,
  kommo_error TEXT,
  redirect_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_created_at
  ON whatsapp_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_client_slug
  ON whatsapp_leads (client_slug);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_source_platform
  ON whatsapp_leads (source_platform);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_utm_campaign
  ON whatsapp_leads (utm_campaign);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_utm_content
  ON whatsapp_leads (utm_content);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_utm_term
  ON whatsapp_leads (utm_term);
