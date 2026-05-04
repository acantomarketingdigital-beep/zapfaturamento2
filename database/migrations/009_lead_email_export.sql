ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS lead_name TEXT,
  ADD COLUMN IF NOT EXISTS lead_email TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS lead_status_history (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id BIGINT NOT NULL,
  client_slug TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by TEXT,
  internal_campaign_id BIGINT,
  internal_campaign_slug TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_new_status ON lead_status_history(new_status);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_client_slug ON lead_status_history(client_slug);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_lead_status ON whatsapp_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_lead_email ON whatsapp_leads(lead_email) WHERE lead_email IS NOT NULL;
