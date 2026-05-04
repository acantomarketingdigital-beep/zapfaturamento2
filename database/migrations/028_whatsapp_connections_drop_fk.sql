-- Remove FK constraint on whatsapp_connections.client_slug
-- Allows connections to be created for any client slug without requiring
-- the client to pre-exist in the clients table.
ALTER TABLE whatsapp_connections
  DROP CONSTRAINT IF EXISTS whatsapp_connections_client_slug_fkey;
