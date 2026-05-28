-- CPF/CNPJ for anti-abuse and payment purposes
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Anti-abuse: one trial per CPF/CNPJ
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf_cnpj
  ON users (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '';
