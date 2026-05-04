ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'novo_lead',
  ADD COLUMN IF NOT EXISTS paid_amount_cents BIGINT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_lead_status
  ON whatsapp_leads (lead_status);

CREATE OR REPLACE FUNCTION set_whatsapp_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_whatsapp_leads_updated_at ON whatsapp_leads;

CREATE TRIGGER trg_whatsapp_leads_updated_at
BEFORE UPDATE ON whatsapp_leads
FOR EACH ROW
EXECUTE FUNCTION set_whatsapp_leads_updated_at();

CREATE TABLE IF NOT EXISTS ad_spend (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug TEXT NOT NULL,
  campaign TEXT NOT NULL,
  creative TEXT,
  audience TEXT,
  impressions BIGINT NOT NULL DEFAULT 0,
  investment_cents BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ad_spend_client_slug
  ON ad_spend (client_slug);

CREATE INDEX IF NOT EXISTS idx_ad_spend_campaign
  ON ad_spend (campaign);

CREATE OR REPLACE FUNCTION set_ad_spend_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ad_spend_updated_at ON ad_spend;

CREATE TRIGGER trg_ad_spend_updated_at
BEFORE UPDATE ON ad_spend
FOR EACH ROW
EXECUTE FUNCTION set_ad_spend_updated_at();

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'client_user')),
  client_slug TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_client_slug
  ON users (client_slug);

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();
