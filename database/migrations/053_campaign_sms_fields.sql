-- Migration 053: suporte a campanhas SMS

ALTER TABLE client_campaigns
  ADD COLUMN IF NOT EXISTS channel   TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS sms_phone TEXT;

-- campanhas antigas sem channel explícito continuam funcionando como whatsapp
