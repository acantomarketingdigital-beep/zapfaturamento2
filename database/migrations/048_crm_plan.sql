-- Plano CRM: modo somente CRM (Kanban, Pipeline, Inbox) sem recursos de campanha
-- subscription_plan = 'crm' identifica esse tipo de usuário

-- Tags nos leads (array de texto, ex: ["quente","VIP","retorno"])
ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Responsável pelo lead (nome livre, sem FK)
ALTER TABLE whatsapp_leads
  ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL;

ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL;

-- Índice para busca por responsável
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON whatsapp_leads (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_tags
  ON whatsapp_leads USING GIN (tags);
