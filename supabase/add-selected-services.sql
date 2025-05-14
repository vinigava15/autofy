-- Adicionar campo selected_services à tabela services
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.services'::regclass AND attname = 'selected_services') THEN
    ALTER TABLE public.services ADD COLUMN selected_services UUID[] DEFAULT '{}';
    COMMENT ON COLUMN public.services.selected_services IS 'Array de IDs dos serviços selecionados';
  END IF;
END;
$$; 