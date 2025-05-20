-- Adicionar campo completion_status à tabela services
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.services'::regclass AND attname = 'completion_status') THEN
    ALTER TABLE public.services ADD COLUMN completion_status TEXT DEFAULT 'nao_iniciado';
    COMMENT ON COLUMN public.services.completion_status IS 'Status de conclusão do serviço: concluido, em_andamento, nao_iniciado';
  END IF;
END;
$$;

-- Criar tabela para armazenar as fotos dos veículos
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para vehicle_photos
CREATE POLICY "Users can view their own photos" ON public.vehicle_photos
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own photos" ON public.vehicle_photos
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own photos" ON public.vehicle_photos
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own photos" ON public.vehicle_photos
    FOR DELETE USING (tenant_id = auth.uid());

-- Comentários sobre a tabela
COMMENT ON TABLE public.vehicle_photos IS 'Tabela para armazenar fotos dos veículos';
COMMENT ON COLUMN public.vehicle_photos.id IS 'Identificador único da foto';
COMMENT ON COLUMN public.vehicle_photos.service_id IS 'ID do serviço ao qual a foto pertence';
COMMENT ON COLUMN public.vehicle_photos.tenant_id IS 'ID do usuário proprietário da foto';
COMMENT ON COLUMN public.vehicle_photos.url IS 'URL da foto no storage';
COMMENT ON COLUMN public.vehicle_photos.description IS 'Descrição opcional da foto';
COMMENT ON COLUMN public.vehicle_photos.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.vehicle_photos.updated_at IS 'Data e hora da última atualização do registro'; 