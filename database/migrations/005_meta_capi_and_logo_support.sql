ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS meta_capi_access_token TEXT,
  ADD COLUMN IF NOT EXISTS meta_test_event_code TEXT;

ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS meta_capi_success BOOLEAN,
  ADD COLUMN IF NOT EXISTS meta_capi_event_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_error TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_meta_capi_event_id
  ON whatsapp_leads (meta_capi_event_id);
