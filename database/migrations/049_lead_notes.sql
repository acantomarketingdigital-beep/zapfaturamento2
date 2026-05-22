-- Notas internas por lead (não enviadas ao cliente)
CREATE TABLE IF NOT EXISTS lead_notes (
  id          BIGSERIAL PRIMARY KEY,
  lead_id     BIGINT      NOT NULL REFERENCES whatsapp_leads(id) ON DELETE CASCADE,
  client_slug TEXT        NOT NULL,
  author      TEXT        NOT NULL DEFAULT 'sistema',
  note        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id
  ON lead_notes (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_notes_client_slug
  ON lead_notes (client_slug);
