ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS has_replied   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS replied_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_note TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_done BOOLEAN    NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_has_replied   ON whatsapp_leads (has_replied)  WHERE has_replied = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_at  ON whatsapp_leads (follow_up_at) WHERE follow_up_at IS NOT NULL AND follow_up_done = FALSE;
