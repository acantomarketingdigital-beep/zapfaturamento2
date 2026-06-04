-- Short tracking code injected into the WhatsApp pre-filled message at click time.
-- Enables Level-1 (exact) lead matching when the user sends the message unmodified.
ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS ref_code VARCHAR(8);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_ref_code
  ON whatsapp_leads (client_slug, ref_code)
  WHERE ref_code IS NOT NULL;
