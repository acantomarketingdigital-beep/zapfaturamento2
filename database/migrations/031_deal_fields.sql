-- Deal fields on conversations (avoids a separate deals table)
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS deal_value    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS deal_status   TEXT NOT NULL DEFAULT 'open'
    CHECK (deal_status IN ('open','won','lost')),
  ADD COLUMN IF NOT EXISTS deal_source   TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS deal_closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS conv_deal_status_idx  ON whatsapp_conversations (deal_status);
CREATE INDEX IF NOT EXISTS conv_deal_source_idx  ON whatsapp_conversations (deal_source);
