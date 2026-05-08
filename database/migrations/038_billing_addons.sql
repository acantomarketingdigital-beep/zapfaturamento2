-- Add-ons de capacidade por workspace (formulários extras, WhatsApps extras)
CREATE TABLE IF NOT EXISTS billing_addons (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_slug TEXT         NOT NULL,
  addon_type     TEXT         NOT NULL,     -- 'extra_form' | 'extra_whatsapp'
  quantity       INTEGER      NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         TEXT         NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'canceled'
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- TODO (Stripe): linkar addon a um subscription_item_id do Stripe para cobrança automática
-- TODO (Stripe): criar price_id separado para extra_form e extra_whatsapp por plano

CREATE INDEX IF NOT EXISTS billing_addons_workspace
  ON billing_addons (workspace_slug, status);

CREATE OR REPLACE FUNCTION set_billing_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_addons_updated_at ON billing_addons;
CREATE TRIGGER trg_billing_addons_updated_at
BEFORE UPDATE ON billing_addons
FOR EACH ROW EXECUTE FUNCTION set_billing_addons_updated_at();
