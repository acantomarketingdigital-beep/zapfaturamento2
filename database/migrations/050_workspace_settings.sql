-- Configurações personalizadas por workspace (client_slug)
-- Armazena labels customizados, tags predefinidas e membros da equipe
-- As chaves internas dos status NUNCA mudam — apenas os rótulos exibidos
CREATE TABLE IF NOT EXISTS workspace_settings (
  client_slug  TEXT        PRIMARY KEY,
  settings     JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
