-- Add currency support to campaigns and investment records
ALTER TABLE client_campaigns
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL';

ALTER TABLE ad_spend
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL';

CREATE INDEX IF NOT EXISTS idx_client_campaigns_currency
  ON client_campaigns (currency);
