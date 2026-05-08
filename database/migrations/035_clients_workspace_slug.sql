ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_workspace_slug ON clients (workspace_slug);
