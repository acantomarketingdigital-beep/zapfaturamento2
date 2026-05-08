CREATE TABLE IF NOT EXISTS billing_usage_events (
  id            BIGSERIAL    PRIMARY KEY,
  client_slug   TEXT         NOT NULL,
  lead_id       BIGINT       NOT NULL,
  event_type    TEXT         NOT NULL DEFAULT 'billable_lead',
  source        TEXT         NOT NULL,
  billing_month DATE         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Prevent double-counting: one billing event per (client, lead, type)
CREATE UNIQUE INDEX IF NOT EXISTS billing_usage_events_dedup
  ON billing_usage_events (client_slug, lead_id, event_type);

-- Fast lookups for monthly usage aggregation
CREATE INDEX IF NOT EXISTS billing_usage_events_by_month
  ON billing_usage_events (client_slug, billing_month);
