ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS lead_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_lead_phone
  ON whatsapp_leads (lead_phone)
  WHERE lead_phone IS NOT NULL;
