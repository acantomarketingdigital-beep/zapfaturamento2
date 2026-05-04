-- Daily budget per campaign (used for investment estimates when no ad_spend recorded)
ALTER TABLE client_campaigns
  ADD COLUMN IF NOT EXISTS daily_budget_cents BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_client_campaigns_has_budget
  ON client_campaigns (client_slug)
  WHERE daily_budget_cents > 0;
