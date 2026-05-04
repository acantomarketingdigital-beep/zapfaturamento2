CREATE TABLE IF NOT EXISTS system_logs (
  id             BIGSERIAL    PRIMARY KEY,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  user_id        TEXT,
  user_email     TEXT,
  action         TEXT         NOT NULL,
  mode           TEXT,
  client_slug    TEXT,
  campaign_id    BIGINT,
  affected_count INTEGER,
  details        JSONB
);

CREATE INDEX IF NOT EXISTS idx_system_logs_action     ON system_logs (action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_client     ON system_logs (client_slug) WHERE client_slug IS NOT NULL;
