-- Script de exemplo para inserir dados de testes

-- Verificar se existem dados de teste para não duplicar
DO $$
DECLARE
  test_tenant_id UUID := '00000000-0000-0000-0000-000000000000'; -- ID de exemplo para testes
  service_count INTEGER;
BEGIN
  -- Verificar quantidade de serviços do tenant de teste
  SELECT COUNT(*) INTO service_count FROM public.services WHERE tenant_id = test_tenant_id;
  
  -- Se já existirem serviços, não insira dados de exemplo
  IF service_count > 0 THEN
    RAISE NOTICE 'Dados de exemplo já existem para o tenant de teste. Pulando inserção.';
    RETURN;
  END IF;
  
  -- Inserir serviços de exemplo com diferentes status de pagamento e conclusão
  INSERT INTO public.services 
    (id, client_name, service_date, car_plate, car_model, service_value, 
     tenant_id, auth_code, observacoes, client_phone, status, completion_status)
  VALUES
    -- Serviço concluído e pago
    ('10000000-0000-0000-0000-000000000001', 'João Silva', '2023-10-01T12:00:00', 'ABC1234', 'Fiat Uno', 250.00,
     test_tenant_id, 'AC123456', 'Cliente satisfeito com o serviço', '(48) 99999-1111', 'pago', 'concluido'),
    
    -- Serviço em andamento e pago
    ('10000000-0000-0000-0000-000000000002', 'Maria Oliveira', '2023-10-05T12:00:00', 'DEF5678', 'Honda Civic', 800.00,
     test_tenant_id, 'AC789012', 'Previsão de conclusão em 2 dias', '(48) 99999-2222', 'pago', 'em_andamento'),
    
    -- Serviço não iniciado e orçamento
    ('10000000-0000-0000-0000-000000000003', 'Pedro Santos', '2023-10-10T12:00:00', 'GHI9012', 'Toyota Corolla', 1200.00,
     test_tenant_id, 'AC345678', 'Cliente aguardando aprovação do seguro', '(48) 99999-3333', 'orcamento', 'nao_iniciado'),
    
    -- Serviço concluído e não pago
    ('10000000-0000-0000-0000-000000000004', 'Ana Costa', '2023-10-08T12:00:00', 'JKL3456', 'VW Gol', 350.00,
     test_tenant_id, 'AC901234', 'Cliente vai pagar semana que vem', '(48) 99999-4444', 'nao_pago', 'concluido'),
    
    -- Serviço em andamento e não pago
    ('10000000-0000-0000-0000-000000000005', 'Carlos Ferreira', '2023-10-12T12:00:00', 'MNO7890', 'Renault Sandero', 600.00,
     test_tenant_id, 'AC567890', 'Cliente vai pagar 50% agora e 50% na entrega', '(48) 99999-5555', 'nao_pago', 'em_andamento');
  
  -- Inserir fotos de exemplo para um dos serviços
  INSERT INTO public.vehicle_photos
    (service_id, tenant_id, url, description)
  VALUES
    ('10000000-0000-0000-0000-000000000001', test_tenant_id, 'https://placehold.co/600x400?text=Foto+Frontal', 'Foto frontal do veículo'),
    ('10000000-0000-0000-0000-000000000001', test_tenant_id, 'https://placehold.co/600x400?text=Arranhão+Lateral', 'Arranhão na lateral do veículo'),
    ('10000000-0000-0000-0000-000000000003', test_tenant_id, 'https://placehold.co/600x400?text=Foto+Traseira', 'Foto traseira com amassado'),
    ('10000000-0000-0000-0000-000000000003', test_tenant_id, 'https://placehold.co/600x400?text=Detalhe+Amassado', 'Detalhe do amassado');
  
  RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
END;
$$;

-- Instruções para o usuário
COMMENT ON TABLE public.services IS 'Tabela de serviços com novos campos de status de conclusão e fotos';
COMMENT ON COLUMN public.services.completion_status IS 'Status de conclusão do serviço: concluido, em_andamento, nao_iniciado'; 