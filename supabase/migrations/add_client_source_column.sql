-- Adicionar a coluna client_source à tabela services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS client_source VARCHAR(30);

-- Criar um tipo enum para a origem do cliente (verificando primeiro se já existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_source_type') THEN
        CREATE TYPE client_source_type AS ENUM ('instagram', 'google', 'indicacao', 'facebook', 'site', 'outros');
    END IF;
END$$;

-- Adicionar comentário à coluna
COMMENT ON COLUMN services.client_source IS 'Origem do cliente: instagram, google, indicacao, facebook, site, outros';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_services_client_source ON services(client_source);

-- Notificar Postgrest para recarregar o esquema
NOTIFY pgrst, 'reload schema'; 