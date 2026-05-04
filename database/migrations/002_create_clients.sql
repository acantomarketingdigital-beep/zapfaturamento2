CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  whatsapp_message TEXT NOT NULL,
  redirect_delay INTEGER NOT NULL DEFAULT 4000,
  meta_pixel_id TEXT,
  gtm_id TEXT,
  ga4_id TEXT,
  google_ads_id TEXT,
  google_ads_conversion_label TEXT,
  kommo_pipeline_id BIGINT,
  kommo_status_id BIGINT,
  kommo_custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_clients_slug
  ON clients (client_slug);

CREATE INDEX IF NOT EXISTS idx_clients_active
  ON clients (is_active);

CREATE OR REPLACE FUNCTION set_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION set_clients_updated_at();
