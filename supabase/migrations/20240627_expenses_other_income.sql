-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para a tabela de despesas
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para despesas
CREATE POLICY "Allow tenant SELECT on expenses" ON expenses
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant INSERT on expenses" ON expenses
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Allow tenant UPDATE on expenses" ON expenses
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant DELETE on expenses" ON expenses
  FOR DELETE USING (tenant_id = auth.uid());

-- Criar tabela de ganhos extras
CREATE TABLE IF NOT EXISTS other_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  income_date DATE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para a tabela de ganhos extras
ALTER TABLE other_income ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para ganhos extras
CREATE POLICY "Allow tenant SELECT on other_income" ON other_income
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant INSERT on other_income" ON other_income
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Allow tenant UPDATE on other_income" ON other_income
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Allow tenant DELETE on other_income" ON other_income
  FOR DELETE USING (tenant_id = auth.uid()); 