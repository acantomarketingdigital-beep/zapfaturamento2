-- Add campaign linking fields to ad_spend
ALTER TABLE ad_spend
  ADD COLUMN IF NOT EXISTS internal_campaign_id BIGINT,
  ADD COLUMN IF NOT EXISTS internal_campaign_slug TEXT,
  ADD COLUMN IF NOT EXISTS campaign_name TEXT;

CREATE INDEX IF NOT EXISTS idx_ad_spend_internal_campaign_slug
  ON ad_spend(internal_campaign_slug) WHERE internal_campaign_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ad_spend_client_slug_campaign
  ON ad_spend(client_slug, internal_campaign_slug);
