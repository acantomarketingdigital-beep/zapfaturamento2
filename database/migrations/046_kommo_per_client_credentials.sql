ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS kommo_subdomain   TEXT,
  ADD COLUMN IF NOT EXISTS kommo_access_token TEXT;
