-- Allow NULL password_hash for invited users (before they set a password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Invite + reset + permissions columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status              TEXT        DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invite_token        TEXT,
  ADD COLUMN IF NOT EXISTS invite_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token         TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS permissions         JSONB;

-- Backfill: existing users are active
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Unique constraints for tokens (safe lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_token ON users (invite_token) WHERE invite_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_reset_token  ON users (reset_token)  WHERE reset_token  IS NOT NULL;
