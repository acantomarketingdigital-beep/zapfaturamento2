-- Dual-plan Stripe support: monthly / yearly, paid_access flag

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_price_id    TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan  TEXT,   -- 'monthly' | 'yearly'
  ADD COLUMN IF NOT EXISTS paid_access        BOOLEAN;

-- Fast lookup for access checks
CREATE INDEX IF NOT EXISTS idx_users_paid_access
  ON users (paid_access)
  WHERE paid_access IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_subscription_plan
  ON users (subscription_plan)
  WHERE subscription_plan IS NOT NULL;
