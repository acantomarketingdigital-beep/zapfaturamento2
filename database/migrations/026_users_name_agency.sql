-- Self-registration fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name        TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT;
