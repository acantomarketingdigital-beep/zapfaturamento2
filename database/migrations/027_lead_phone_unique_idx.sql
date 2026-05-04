-- Prevent multiple leads with the same identified phone per client.
-- Partial index: only enforced when lead_phone IS NOT NULL (pre-identification rows are unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_phone_per_client
  ON whatsapp_leads (client_slug, lead_phone)
  WHERE lead_phone IS NOT NULL;
