-- Quick replies for WhatsApp
CREATE TABLE IF NOT EXISTS quick_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug TEXT,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Geral',
  message     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS quick_replies_client_slug_idx ON quick_replies (client_slug);
CREATE INDEX IF NOT EXISTS quick_replies_category_idx ON quick_replies (category);
