-- Adiciona campos de rastreamento Stripe à tabela billing_addons
-- para vincular cada add-on ao subscription_item correspondente

ALTER TABLE billing_addons
  ADD COLUMN IF NOT EXISTS stripe_subscription_item_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id             TEXT;

-- Garante no máximo 1 registro ativo por workspace + addon_type
-- (permite múltiplos cancelados no histórico)
CREATE UNIQUE INDEX IF NOT EXISTS billing_addons_ws_type_active
  ON billing_addons (workspace_slug, addon_type)
  WHERE status = 'active';
