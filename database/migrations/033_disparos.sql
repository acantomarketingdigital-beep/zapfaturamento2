-- Disparo em massa via Meta Cloud API

-- Instancias: credenciais da Meta Cloud API por cliente
CREATE TABLE IF NOT EXISTS disparo_instancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  waba_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS disparo_instancias_client_slug_idx ON disparo_instancias (client_slug);

-- Campanhas de disparo em massa
CREATE TABLE IF NOT EXISTS campanhas_disparos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  instancia_id UUID REFERENCES disparo_instancias(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft', -- draft | running | paused | done | failed
  total_contatos INT NOT NULL DEFAULT 0,
  sent INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS campanhas_disparos_client_slug_idx ON campanhas_disparos (client_slug);
CREATE INDEX IF NOT EXISTS campanhas_disparos_instancia_idx ON campanhas_disparos (instancia_id);

-- Log por contato (status individual de cada envio)
CREATE TABLE IF NOT EXISTS disparo_logs (
  id BIGSERIAL PRIMARY KEY,
  campanha_id UUID NOT NULL REFERENCES campanhas_disparos(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped
  sent_at TIMESTAMPTZ,
  error_msg TEXT,
  message_id TEXT
);

CREATE INDEX IF NOT EXISTS disparo_logs_campanha_idx ON disparo_logs (campanha_id);
CREATE INDEX IF NOT EXISTS disparo_logs_status_idx ON disparo_logs (campanha_id, status);
