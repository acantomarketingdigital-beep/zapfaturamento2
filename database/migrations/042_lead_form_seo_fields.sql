-- Migration 042: SEO fields for lead forms (Google Ads Quality Score optimization)
ALTER TABLE lead_forms
  ADD COLUMN IF NOT EXISTS campaign_source TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS seo_keywords    TEXT[],
  ADD COLUMN IF NOT EXISTS seo_locations   TEXT[],
  ADD COLUMN IF NOT EXISTS seo_title       TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_bullets     TEXT[];
