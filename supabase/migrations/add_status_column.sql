-- Adicionar a coluna status à tabela services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- Atualizar serviços existentes para o status 'pago' como padrão
UPDATE services
SET status = 'pago'
WHERE status IS NULL;

-- Criar um tipo enum para o status (verificando primeiro se já existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        CREATE TYPE service_status AS ENUM ('pago', 'nao_pago', 'orcamento');
    END IF;
END$$;

-- Adicionar comentário à coluna
COMMENT ON COLUMN services.status IS 'Status do serviço: pago, nao_pago ou orcamento'; 