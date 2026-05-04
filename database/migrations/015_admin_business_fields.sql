-- Subscription tracking fields for business intelligence panel
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status      TEXT,
  ADD COLUMN IF NOT EXISTS subscription_started_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monthly_price            INTEGER,
  ADD COLUMN IF NOT EXISTS last_payment_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_at          TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_subscription_status
  ON users (subscription_status)
  WHERE subscription_status IS NOT NULL;
