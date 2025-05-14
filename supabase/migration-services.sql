-- Habilitar a extensão pgcrypto para uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar tabela de catálogo de serviços
CREATE TABLE IF NOT EXISTS public.catalog_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários sobre a tabela e suas colunas
COMMENT ON TABLE public.catalog_services IS 'Tabela para armazenar o catálogo de serviços';
COMMENT ON COLUMN public.catalog_services.id IS 'Identificador único do serviço no catálogo';
COMMENT ON COLUMN public.catalog_services.name IS 'Nome do serviço';
COMMENT ON COLUMN public.catalog_services.value IS 'Valor base do serviço em reais';
COMMENT ON COLUMN public.catalog_services.tenant_id IS 'ID do usuário proprietário do registro';
COMMENT ON COLUMN public.catalog_services.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.catalog_services.updated_at IS 'Data e hora da última atualização do registro';

-- Adicionar campo service_id à tabela services
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.services'::regclass AND attname = 'service_id') THEN
    ALTER TABLE public.services ADD COLUMN service_id UUID;
  END IF;
END;
$$;

-- Habilitar RLS (Row Level Security) para a tabela catalog_services
ALTER TABLE public.catalog_services ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para a tabela catalog_services
CREATE POLICY "Allow tenant SELECT on catalog_services" ON public.catalog_services
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant INSERT on catalog_services" ON public.catalog_services
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Allow tenant UPDATE on catalog_services" ON public.catalog_services
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant DELETE on catalog_services" ON public.catalog_services
    FOR DELETE USING (tenant_id = auth.uid()); 