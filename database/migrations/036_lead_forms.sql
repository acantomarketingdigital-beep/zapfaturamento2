-- Lead Express: formulários próprios de captação

CREATE TABLE IF NOT EXISTS lead_forms (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug      TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  slug             TEXT        NOT NULL,
  title            TEXT        NOT NULL DEFAULT '',
  subtitle         TEXT        NOT NULL DEFAULT '',
  button_text      TEXT        NOT NULL DEFAULT 'Enviar',
  logo_url         TEXT,
  image_url        TEXT,
  primary_color    TEXT        NOT NULL DEFAULT '#16a34a',
  background_color TEXT        NOT NULL DEFAULT '#f0fdf4',
  status           TEXT        NOT NULL DEFAULT 'active',
  success_message  TEXT        NOT NULL DEFAULT 'Cadastro enviado! Nossa equipe entrara em contato em breve.',
  show_email       BOOLEAN     NOT NULL DEFAULT FALSE,
  show_procedure   BOOLEAN     NOT NULL DEFAULT FALSE,
  show_city        BOOLEAN     NOT NULL DEFAULT FALSE,
  show_observation BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_slug, slug)
);

CREATE TABLE IF NOT EXISTS lead_form_submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  client_slug      TEXT        NOT NULL,
  lead_name        TEXT        NOT NULL,
  lead_phone       TEXT        NOT NULL,
  lead_email       TEXT,
  lead_procedure   TEXT,
  lead_city        TEXT,
  lead_observation TEXT,
  whatsapp_lead_id BIGINT,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  utm_content      TEXT,
  utm_term         TEXT,
  fbclid           TEXT,
  gclid            TEXT,
  fbp              TEXT,
  fbc              TEXT,
  ip_address       TEXT,
  user_agent       TEXT,
  page_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_form_views (
  id          BIGSERIAL   PRIMARY KEY,
  form_id     UUID        NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
  client_slug TEXT        NOT NULL,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term    TEXT,
  fbclid      TEXT,
  gclid       TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_forms_client_slug          ON lead_forms (client_slug);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_form_id   ON lead_form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_client    ON lead_form_submissions (client_slug);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_created   ON lead_form_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_form_views_form_id         ON lead_form_views (form_id);
