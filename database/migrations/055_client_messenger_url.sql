-- Adiciona URL do Messenger para redirecionamento de clientes desktop em campanhas SMS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS messenger_url TEXT;
