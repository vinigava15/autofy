-- Modificar o campo selected_services para usar TEXT[] em vez de UUID[]
-- que é mais flexível para evitar erros de tipo
DO $$
BEGIN
  -- Verificar se a coluna já existe
  IF EXISTS (SELECT FROM pg_attribute 
             WHERE attrelid = 'public.services'::regclass 
             AND attname = 'selected_services') THEN
    
    -- Alterar o tipo da coluna para TEXT[]
    ALTER TABLE public.services 
    ALTER COLUMN selected_services TYPE TEXT[] USING selected_services::TEXT[];
    
    COMMENT ON COLUMN public.services.selected_services 
    IS 'Array de IDs dos serviços selecionados (como texto para maior flexibilidade)';
    
  ELSE
    -- Se a coluna não existir, criar com o tipo TEXT[]
    ALTER TABLE public.services ADD COLUMN selected_services TEXT[] DEFAULT '{}';
    
    COMMENT ON COLUMN public.services.selected_services 
    IS 'Array de IDs dos serviços selecionados (como texto para maior flexibilidade)';
  END IF;
END;
$$; 