-- Billing fields for users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_normalized TEXT,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_id   TEXT,
  -- DEFAULT 'pro' so ALL existing users are grandfathered (not blocked)
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Anti-abuse: one trial per normalized phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_normalized
  ON users (phone_normalized)
  WHERE phone_normalized IS NOT NULL AND phone_normalized <> '';

CREATE INDEX IF NOT EXISTS idx_users_plan_type
  ON users (plan_type);

CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON users (is_active);
