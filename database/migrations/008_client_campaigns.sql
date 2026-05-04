CREATE TABLE IF NOT EXISTS client_campaigns (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  default_message TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (client_slug, slug)
);

CREATE OR REPLACE FUNCTION set_client_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_campaigns_updated_at ON client_campaigns;

CREATE TRIGGER trg_client_campaigns_updated_at
  BEFORE UPDATE ON client_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_client_campaigns_updated_at();

CREATE INDEX IF NOT EXISTS idx_client_campaigns_client_slug
  ON client_campaigns (client_slug);

CREATE INDEX IF NOT EXISTS idx_client_campaigns_is_active
  ON client_campaigns (is_active);

ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS internal_campaign_id BIGINT,
  ADD COLUMN IF NOT EXISTS internal_campaign_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_internal_campaign_slug
  ON whatsapp_leads (internal_campaign_slug);
