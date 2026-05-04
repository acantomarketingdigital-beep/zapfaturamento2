ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS kommo_enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE clients
SET kommo_enabled = TRUE
WHERE kommo_enabled IS NULL;

ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS kommo_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS kommo_status TEXT NOT NULL DEFAULT 'pending';

UPDATE whatsapp_leads
SET
  kommo_enabled = COALESCE(kommo_enabled, TRUE),
  kommo_status = CASE
    WHEN kommo_status IS NOT NULL AND kommo_status <> '' THEN kommo_status
    WHEN kommo_success IS TRUE THEN 'success'
    WHEN kommo_success IS FALSE THEN 'error'
    ELSE 'pending'
  END;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_kommo_status
  ON whatsapp_leads (kommo_status);
