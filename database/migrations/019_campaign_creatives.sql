-- Creative variants per campaign (each gets its own redirect link and tracking)
CREATE TABLE IF NOT EXISTS campaign_creatives (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  campaign_id   BIGINT NOT NULL REFERENCES client_campaigns(id) ON DELETE CASCADE,
  client_slug   TEXT NOT NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  default_message TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_campaign_creative_slug UNIQUE (campaign_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_campaign_creatives_campaign_id ON campaign_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creatives_client_slug  ON campaign_creatives(client_slug);

CREATE OR REPLACE FUNCTION update_campaign_creatives_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_creatives_updated_at ON campaign_creatives;
CREATE TRIGGER trg_campaign_creatives_updated_at
  BEFORE UPDATE ON campaign_creatives
  FOR EACH ROW EXECUTE FUNCTION update_campaign_creatives_updated_at();

-- Per-creative tracking on leads
ALTER TABLE whatsapp_leads ADD COLUMN IF NOT EXISTS creative_id   BIGINT;
ALTER TABLE whatsapp_leads ADD COLUMN IF NOT EXISTS creative_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_creative_id ON whatsapp_leads(creative_id);
