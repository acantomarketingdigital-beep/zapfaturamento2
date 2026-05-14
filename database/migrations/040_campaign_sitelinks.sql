-- Sitelinks for Google Ads — stored as a special type of creative
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS is_sitelink    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS sitelink_desc1 TEXT;
ALTER TABLE campaign_creatives ADD COLUMN IF NOT EXISTS sitelink_desc2 TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_creatives_sitelink ON campaign_creatives(campaign_id, is_sitelink) WHERE is_sitelink = TRUE;
