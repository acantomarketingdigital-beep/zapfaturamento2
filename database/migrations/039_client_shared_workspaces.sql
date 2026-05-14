ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS shared_with_workspaces text[] DEFAULT '{}';
