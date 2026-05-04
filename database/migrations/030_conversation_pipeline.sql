-- Temperature and pipeline stage for WhatsApp conversations
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS temperature TEXT NOT NULL DEFAULT 'cold'
    CHECK (temperature IN ('cold','warm','hot')),
  ADD COLUMN IF NOT EXISTS hot_reason TEXT,
  ADD COLUMN IF NOT EXISTS hot_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'novo_lead'
    CHECK (pipeline_stage IN (
      'novo_lead','primeiro_contato','em_atendimento',
      'orcamento_enviado','agendamento','compareceu',
      'fechado','perdido'
    ));

CREATE INDEX IF NOT EXISTS conv_temperature_idx ON whatsapp_conversations (temperature);
CREATE INDEX IF NOT EXISTS conv_pipeline_stage_idx ON whatsapp_conversations (pipeline_stage);
