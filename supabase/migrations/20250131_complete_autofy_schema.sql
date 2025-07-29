-- =============================================
-- AutoFy - Sistema de Gestão de Serviços Automotivos
-- Migração Completa Multi-Tenant - v2.0
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TIPOS ENUM
-- =============================================

-- Status de pagamento dos serviços
DO $$ BEGIN
    CREATE TYPE service_status_enum AS ENUM ('pago', 'nao_pago', 'orcamento');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status de conclusão dos serviços
DO $$ BEGIN
    CREATE TYPE completion_status_enum AS ENUM ('concluido', 'em_andamento', 'nao_iniciado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Origem dos clientes
DO $$ BEGIN
    CREATE TYPE client_source_enum AS ENUM ('instagram', 'google', 'indicacao', 'facebook', 'site', 'outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABELA: profiles
-- Armazena informações do usuário/empresa
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Comentários
COMMENT ON TABLE profiles IS 'Perfis dos usuários com dados pessoais e da empresa';
COMMENT ON COLUMN profiles.id IS 'ID do usuário (referência ao auth.users)';
COMMENT ON COLUMN profiles.company_name IS 'Nome da empresa/oficina';
COMMENT ON COLUMN profiles.phone IS 'Telefone de contato';

-- =============================================
-- TABELA: catalog_services
-- Catálogo de serviços disponíveis
-- =============================================

CREATE TABLE IF NOT EXISTS catalog_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT catalog_services_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT catalog_services_value_check CHECK (value >= 0),
    CONSTRAINT catalog_services_unique_name_per_tenant UNIQUE (tenant_id, name)
);

-- Comentários
COMMENT ON TABLE catalog_services IS 'Catálogo de serviços oferecidos pela empresa';
COMMENT ON COLUMN catalog_services.tenant_id IS 'ID do usuário/empresa proprietário';
COMMENT ON COLUMN catalog_services.name IS 'Nome do serviço';
COMMENT ON COLUMN catalog_services.value IS 'Valor padrão do serviço';

-- =============================================
-- TABELA: services
-- Tabela principal dos serviços executados
-- =============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    car_plate TEXT NOT NULL,
    car_model TEXT NOT NULL,
    service_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    status service_status_enum NOT NULL DEFAULT 'nao_pago',
    completion_status completion_status_enum NOT NULL DEFAULT 'nao_iniciado',
    client_source client_source_enum,
    auth_code TEXT,
    observacoes TEXT,
    
    -- Relacionamentos com catálogo
    service_id UUID REFERENCES catalog_services(id) ON DELETE SET NULL,
    selected_services UUID[], -- Array de IDs dos serviços selecionados
    
    -- Peças reparadas (pode ser array ou JSON)
    repaired_parts JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT services_client_name_check CHECK (LENGTH(client_name) >= 2),
    CONSTRAINT services_car_plate_check CHECK (LENGTH(car_plate) >= 5),
    CONSTRAINT services_car_model_check CHECK (LENGTH(car_model) >= 2),
    CONSTRAINT services_service_value_check CHECK (service_value >= 0)
);

-- Comentários
COMMENT ON TABLE services IS 'Serviços automotivos executados pela empresa';
COMMENT ON COLUMN services.tenant_id IS 'ID do usuário/empresa proprietário';
COMMENT ON COLUMN services.client_name IS 'Nome do cliente';
COMMENT ON COLUMN services.client_phone IS 'Telefone do cliente';
COMMENT ON COLUMN services.service_date IS 'Data do serviço';
COMMENT ON COLUMN services.car_plate IS 'Placa do veículo';
COMMENT ON COLUMN services.car_model IS 'Modelo do veículo';
COMMENT ON COLUMN services.service_value IS 'Valor total do serviço';
COMMENT ON COLUMN services.status IS 'Status de pagamento';
COMMENT ON COLUMN services.completion_status IS 'Status de conclusão do serviço';
COMMENT ON COLUMN services.client_source IS 'Origem/canal de captação do cliente';
COMMENT ON COLUMN services.auth_code IS 'Código de autenticação do serviço';
COMMENT ON COLUMN services.selected_services IS 'Array de IDs dos serviços do catálogo selecionados';
COMMENT ON COLUMN services.repaired_parts IS 'Peças/partes reparadas no veículo';

-- =============================================
-- TABELA: vehicle_photos
-- Fotos dos veículos
-- =============================================

CREATE TABLE IF NOT EXISTS vehicle_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vehicle_photos_url_check CHECK (url ~* '^https?://'),
    CONSTRAINT vehicle_photos_description_check CHECK (LENGTH(description) <= 500)
);

-- Comentários
COMMENT ON TABLE vehicle_photos IS 'Fotos dos veículos associadas aos serviços';
COMMENT ON COLUMN vehicle_photos.tenant_id IS 'ID do usuário/empresa proprietário';
COMMENT ON COLUMN vehicle_photos.service_id IS 'ID do serviço associado';
COMMENT ON COLUMN vehicle_photos.url IS 'URL da foto no storage';
COMMENT ON COLUMN vehicle_photos.description IS 'Descrição da foto (opcional)';

-- =============================================
-- TABELA: expenses
-- Despesas da empresa
-- =============================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Campos para despesas fixas
    is_fixed BOOLEAN DEFAULT FALSE,
    fixed_day_of_month INTEGER,
    next_generation_date DATE,
    original_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT expenses_description_check CHECK (LENGTH(description) >= 2),
    CONSTRAINT expenses_value_check CHECK (value > 0),
    CONSTRAINT expenses_fixed_day_check CHECK (
        fixed_day_of_month IS NULL OR 
        (fixed_day_of_month >= 1 AND fixed_day_of_month <= 28)
    )
);

-- Comentários
COMMENT ON TABLE expenses IS 'Despesas da empresa (fixas e variáveis)';
COMMENT ON COLUMN expenses.tenant_id IS 'ID do usuário/empresa proprietário';
COMMENT ON COLUMN expenses.description IS 'Descrição da despesa';
COMMENT ON COLUMN expenses.value IS 'Valor da despesa';
COMMENT ON COLUMN expenses.expense_date IS 'Data da despesa';
COMMENT ON COLUMN expenses.is_fixed IS 'Indica se é uma despesa fixa (recorrente)';
COMMENT ON COLUMN expenses.fixed_day_of_month IS 'Dia do mês para gerar despesa fixa (1-28)';
COMMENT ON COLUMN expenses.next_generation_date IS 'Próxima data de geração da despesa fixa';
COMMENT ON COLUMN expenses.original_expense_id IS 'ID da despesa original (para despesas geradas automaticamente)';

-- =============================================
-- TABELA: other_income
-- Outras receitas da empresa
-- =============================================

CREATE TABLE IF NOT EXISTS other_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT other_income_description_check CHECK (LENGTH(description) >= 2),
    CONSTRAINT other_income_value_check CHECK (value > 0)
);

-- Comentários
COMMENT ON TABLE other_income IS 'Outras receitas da empresa (além dos serviços)';
COMMENT ON COLUMN other_income.tenant_id IS 'ID do usuário/empresa proprietário';
COMMENT ON COLUMN other_income.description IS 'Descrição da receita';
COMMENT ON COLUMN other_income.value IS 'Valor da receita';
COMMENT ON COLUMN other_income.income_date IS 'Data da receita';

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices para catalog_services
CREATE INDEX IF NOT EXISTS idx_catalog_services_tenant_id ON catalog_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_services_name ON catalog_services(tenant_id, name);

-- Índices para services
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_service_date ON services(tenant_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_services_completion_status ON services(tenant_id, completion_status);
CREATE INDEX IF NOT EXISTS idx_services_client_source ON services(tenant_id, client_source);
CREATE INDEX IF NOT EXISTS idx_services_client_name ON services(tenant_id, client_name);
CREATE INDEX IF NOT EXISTS idx_services_car_plate ON services(tenant_id, car_plate);
CREATE INDEX IF NOT EXISTS idx_services_auth_code ON services(auth_code) WHERE auth_code IS NOT NULL;

-- Índices para vehicle_photos
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_tenant_id ON vehicle_photos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_service_id ON vehicle_photos(service_id);

-- Índices para expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(tenant_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_is_fixed ON expenses(tenant_id, is_fixed);
CREATE INDEX IF NOT EXISTS idx_expenses_next_generation ON expenses(next_generation_date) WHERE is_fixed = TRUE;

-- Índices para other_income
CREATE INDEX IF NOT EXISTS idx_other_income_tenant_id ON other_income(tenant_id);
CREATE INDEX IF NOT EXISTS idx_other_income_income_date ON other_income(tenant_id, income_date DESC);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_catalog_services_updated_at ON catalog_services;
CREATE TRIGGER update_catalog_services_updated_at
    BEFORE UPDATE ON catalog_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_other_income_updated_at ON other_income;
CREATE TRIGGER update_other_income_updated_at
    BEFORE UPDATE ON other_income
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_income ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - PROFILES
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Criar políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- POLÍTICAS RLS - CATALOG_SERVICES
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own catalog services" ON catalog_services;

-- Criar política abrangente para catalog_services
CREATE POLICY "Users can manage own catalog services" ON catalog_services
    FOR ALL USING (auth.uid() = tenant_id);

-- =============================================
-- POLÍTICAS RLS - SERVICES
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own services" ON services;

-- Criar política abrangente para services
CREATE POLICY "Users can manage own services" ON services
    FOR ALL USING (auth.uid() = tenant_id);

-- =============================================
-- POLÍTICAS RLS - VEHICLE_PHOTOS
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own vehicle photos" ON vehicle_photos;

-- Criar política abrangente para vehicle_photos
CREATE POLICY "Users can manage own vehicle photos" ON vehicle_photos
    FOR ALL USING (auth.uid() = tenant_id);

-- =============================================
-- POLÍTICAS RLS - EXPENSES
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;

-- Criar política abrangente para expenses
CREATE POLICY "Users can manage own expenses" ON expenses
    FOR ALL USING (auth.uid() = tenant_id);

-- =============================================
-- POLÍTICAS RLS - OTHER_INCOME
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own other income" ON other_income;

-- Criar política abrangente para other_income
CREATE POLICY "Users can manage own other income" ON other_income
    FOR ALL USING (auth.uid() = tenant_id);

-- =============================================
-- STORAGE BUCKET PARA FOTOS
-- =============================================

-- Criar bucket para fotos dos veículos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de fotos (apenas usuários autenticados)
DROP POLICY IF EXISTS "Authenticated users can upload vehicle photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload vehicle photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'vehicle-photos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Política para visualizar fotos (apenas suas próprias)
DROP POLICY IF EXISTS "Users can view own vehicle photos" ON storage.objects;
CREATE POLICY "Users can view own vehicle photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'vehicle-photos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Política para deletar fotos (apenas suas próprias)
DROP POLICY IF EXISTS "Users can delete own vehicle photos" ON storage.objects;
CREATE POLICY "Users can delete own vehicle photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'vehicle-photos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para gerar código de autenticação único
CREATE OR REPLACE FUNCTION generate_auth_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'AC' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Função para calcular total de serviços selecionados
CREATE OR REPLACE FUNCTION calculate_selected_services_total(
    p_tenant_id UUID,
    p_selected_services UUID[]
)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(value), 0)
    INTO total
    FROM catalog_services
    WHERE tenant_id = p_tenant_id
    AND id = ANY(p_selected_services);
    
    RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER PARA AUTH_CODE AUTOMÁTICO
-- =============================================

-- Função para gerar auth_code automaticamente
CREATE OR REPLACE FUNCTION generate_service_auth_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Se auth_code não foi fornecido, gerar um
    IF NEW.auth_code IS NULL OR NEW.auth_code = '' THEN
        NEW.auth_code := generate_auth_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar auth_code automaticamente
DROP TRIGGER IF EXISTS generate_auth_code_trigger ON services;
CREATE TRIGGER generate_auth_code_trigger
    BEFORE INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION generate_service_auth_code();

-- =============================================
-- DADOS INICIAIS (OPCIONAIS)
-- =============================================

-- Inserir alguns dados de exemplo para catálogo (apenas se não existirem)
-- NOTA: Isso será executado apenas se não houver nenhum dado no catálogo

DO $$
BEGIN
    -- Verificar se já existem dados no sistema
    IF NOT EXISTS (SELECT 1 FROM catalog_services LIMIT 1) THEN
        -- Inserir dados apenas se não houver nenhum usuário ainda
        -- (Em produção, isso não será executado pois haverá usuários)
        
        -- Estes dados são apenas para referência/documentação
        -- Em produção real, cada usuário criará seu próprio catálogo
        
        NULL; -- Placeholder - não inserir dados reais aqui
    END IF;
END $$;

-- =============================================
-- VERIFICAÇÕES FINAIS
-- =============================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    missing_tables TEXT := '';
    expected_tables TEXT[] := ARRAY[
        'profiles', 
        'catalog_services', 
        'services', 
        'vehicle_photos', 
        'expenses', 
        'other_income'
    ];
    current_table TEXT;
BEGIN
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) THEN
            missing_tables := missing_tables || current_table || ', ';
        END IF;
    END LOOP;
    
    IF missing_tables != '' THEN
        RAISE EXCEPTION 'Tabelas não criadas: %', missing_tables;
    ELSE
        RAISE NOTICE 'SUCESSO: Todas as % tabelas foram criadas com sucesso!', array_length(expected_tables, 1);
    END IF;
END $$;

-- =============================================
-- MENSAGEM DE SUCESSO
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'AutoFy - Migração Completa Multi-Tenant';
    RAISE NOTICE 'Status: CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tabelas criadas: 6';
    RAISE NOTICE 'Políticas RLS: Ativadas';
    RAISE NOTICE 'Índices: Criados';
    RAISE NOTICE 'Triggers: Ativos';
    RAISE NOTICE 'Storage: Configurado';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'O sistema está pronto para uso!';
END $$;