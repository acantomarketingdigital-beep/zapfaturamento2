-- Magic login tokens (15-min single-use for passwordless login)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS magic_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS magic_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS magic_token_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_magic_token_idx ON users (magic_token)
  WHERE magic_token IS NOT NULL;
