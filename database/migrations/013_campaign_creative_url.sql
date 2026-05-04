ALTER TABLE client_campaigns
  ADD COLUMN IF NOT EXISTS creative_url TEXT;
