-- WhatsApp Connections (managed via Evolution API / QR Code)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                 TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  client_slug                TEXT        NOT NULL    REFERENCES clients(client_slug) ON DELETE CASCADE,
  connection_name            TEXT        NOT NULL,
  provider                   TEXT        NOT NULL    DEFAULT 'evolution',
  status                     TEXT        NOT NULL    DEFAULT 'disconnected',
  phone_number               TEXT,
  session_id                 TEXT        NOT NULL    UNIQUE,
  qr_code                    TEXT,
  qr_expires_at              TIMESTAMPTZ,
  last_connected_at          TIMESTAMPTZ,
  last_disconnected_at       TIMESTAMPTZ,
  disconnect_reason          TEXT,
  notify_on_disconnect       BOOLEAN     NOT NULL    DEFAULT TRUE,
  reconnect_token            TEXT,
  reconnect_token_expires_at TIMESTAMPTZ,
  is_active                  BOOLEAN     NOT NULL    DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_client_slug
  ON whatsapp_connections (client_slug);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_session_id
  ON whatsapp_connections (session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_reconnect_token
  ON whatsapp_connections (reconnect_token);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
  ON whatsapp_connections (status);

-- WhatsApp Conversations (one per contact per connection)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  client_slug      TEXT        NOT NULL,
  connection_id    UUID        NOT NULL    REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  lead_id          INTEGER,
  contact_phone    TEXT        NOT NULL,
  contact_name     TEXT,
  last_message_at  TIMESTAMPTZ,
  last_message_text TEXT,
  unread_count     INTEGER     NOT NULL    DEFAULT 0,
  status           TEXT        NOT NULL    DEFAULT 'open',
  assigned_to      TEXT,
  campaign_slug    TEXT,
  utm_campaign     TEXT,
  utm_content      TEXT,
  utm_term         TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_connection_id
  ON whatsapp_conversations (connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_client_slug
  ON whatsapp_conversations (client_slug);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact_phone
  ON whatsapp_conversations (connection_id, contact_phone);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  client_slug         TEXT        NOT NULL,
  connection_id       UUID        NOT NULL    REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  conversation_id     UUID        NOT NULL    REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  lead_id             INTEGER,
  provider_message_id TEXT,
  direction           TEXT        NOT NULL,
  message_type        TEXT        NOT NULL    DEFAULT 'text',
  text                TEXT,
  media_url           TEXT,
  status              TEXT        NOT NULL    DEFAULT 'delivered',
  raw_payload         JSONB
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id
  ON whatsapp_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client_slug
  ON whatsapp_messages (client_slug);

-- WhatsApp Connection Responsible Users (can reconnect / view inbox)
CREATE TABLE IF NOT EXISTS whatsapp_connection_users (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_slug    TEXT    NOT NULL,
  connection_id  UUID    REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  user_name      TEXT    NOT NULL,
  user_phone     TEXT,
  user_email     TEXT,
  cargo          TEXT,
  can_reconnect  BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_inbox BOOLEAN NOT NULL DEFAULT TRUE,
  can_reply      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connection_users_connection_id
  ON whatsapp_connection_users (connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connection_users_client_slug
  ON whatsapp_connection_users (client_slug);
