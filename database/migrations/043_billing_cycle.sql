-- Separar ciclo de cobrança (mensal/anual) do plano (starter/agency/scale/enterprise)
-- subscription_plan já existe (migração 025) e passa a guardar a chave do plano
-- billing_cycle é novo e guarda o ciclo de cobrança Stripe

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT; -- 'monthly' | 'yearly'

CREATE INDEX IF NOT EXISTS idx_users_billing_cycle
  ON users (billing_cycle)
  WHERE billing_cycle IS NOT NULL;

-- Backfill: usuários com stripe_price_id já cadastrado que não têm billing_cycle
-- (baseado em heurística: subscription_plan = 'yearly' era o ciclo antes desta migração)
UPDATE users
SET billing_cycle = 'yearly'
WHERE billing_cycle IS NULL
  AND subscription_plan = 'yearly';

UPDATE users
SET billing_cycle = 'monthly'
WHERE billing_cycle IS NULL
  AND subscription_plan IS NOT NULL
  AND subscription_plan != 'yearly';
