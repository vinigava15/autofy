-- Adicionar campos para despesas fixas
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS fixed_day_of_month INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS next_generation_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS original_expense_id UUID REFERENCES expenses(id);

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_expenses_is_fixed ON expenses(is_fixed) WHERE is_fixed = true;
CREATE INDEX IF NOT EXISTS idx_expenses_next_generation ON expenses(next_generation_date) WHERE next_generation_date IS NOT NULL; 