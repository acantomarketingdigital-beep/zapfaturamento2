-- Remove test/example clients and their associated leads
DELETE FROM whatsapp_leads WHERE client_slug IN ('cliente-exemplo', 'clinica-exemplo');
DELETE FROM clients WHERE client_slug IN ('cliente-exemplo', 'clinica-exemplo');

-- Add is_test and duplicate flags to whatsapp_leads
ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS is_test   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_is_test   ON whatsapp_leads (is_test);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_duplicate ON whatsapp_leads (duplicate);

-- Back-fill is_test for existing rows that match test criteria
UPDATE whatsapp_leads
SET is_test = TRUE
WHERE
  (utm_campaign IS NULL OR utm_campaign = '')
  OR utm_content = '{{ad.name}}'
  OR utm_term    = '{{adset.name}}';
