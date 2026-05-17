-- Migration 041: campos SEO para campanhas e criativos Google Ads

ALTER TABLE client_campaigns
  ADD COLUMN IF NOT EXISTS campaign_source  TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS seo_keywords     TEXT[],
  ADD COLUMN IF NOT EXISTS seo_locations    TEXT[],
  ADD COLUMN IF NOT EXISTS seo_title        TEXT,
  ADD COLUMN IF NOT EXISTS seo_description  TEXT,
  ADD COLUMN IF NOT EXISTS seo_bullets      TEXT[];

ALTER TABLE campaign_creatives
  ADD COLUMN IF NOT EXISTS seo_keywords     TEXT[],
  ADD COLUMN IF NOT EXISTS seo_locations    TEXT[],
  ADD COLUMN IF NOT EXISTS seo_title        TEXT,
  ADD COLUMN IF NOT EXISTS seo_description  TEXT,
  ADD COLUMN IF NOT EXISTS seo_bullets      TEXT[],
  ADD COLUMN IF NOT EXISTS seo_cta_text     TEXT,
  ADD COLUMN IF NOT EXISTS seo_badge_text   TEXT;
