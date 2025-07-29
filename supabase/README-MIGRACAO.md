# 🔧 Migração Completa do AutoFy

Este documento explica como executar a migração completa do banco de dados do AutoFy.

## 📋 O que a migração faz

A migração completa (`complete-migration.sql`) cria todas as tabelas necessárias para o funcionamento do sistema:

### ✅ Tabelas Criadas:
1. **`profiles`** - Perfis de usuário com dados pessoais e da empresa
2. **`catalog_services`** - Catálogo de serviços disponíveis 
3. **`services`** - Tabela principal de serviços automotivos
4. **`vehicle_photos`** - Fotos dos veículos relacionadas aos serviços
5. **`expenses`** - Despesas da empresa (fixas e variáveis)
6. **`other_income`** - Outras receitas da empresa

### ✅ Recursos Implementados:
- **RLS (Row Level Security)** configurado para todas as tabelas
- **Políticas de segurança** que garantem que usuários só vejam seus próprios dados
- **Índices** para otimizar performance das consultas
- **Triggers** para atualizar automaticamente `updated_at`
- **Trigger** para criar perfil automaticamente quando usuário se registra
- **Tipos ENUM** para validação de dados
- **Comentários** explicativos em todas as tabelas e colunas importantes

## 🚀 Como Executar a Migração

### Opção 1: Dashboard do Supabase (Recomendada)

1. **Acesse o Dashboard do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Entre no seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a migração completa:**
   - Copie todo o conteúdo de `supabase/complete-migration.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar
   - Aguarde a execução completar (pode levar alguns segundos)

### Opção 2: CLI do Supabase

Se você tem o CLI do Supabase instalado:

```bash
# Aplicar a migração
supabase db reset

# Ou aplicar manualmente
npx supabase db push
```

## ✅ Verificação Pós-Migração

Após executar a migração, verifique se tudo foi criado corretamente:

### 1. Verificar Tabelas
Execute no SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'catalog_services', 'services', 'vehicle_photos', 'expenses', 'other_income');
```

Deve retornar 6 tabelas.

### 2. Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Deve mostrar várias políticas de segurança para cada tabela.

### 3. Verificar Índices
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

Deve mostrar vários índices para otimização.

## 🔄 Testando o Sistema

Após executar a migração:

1. **Teste o registro de usuário** - deve criar perfil automaticamente
2. **Teste o catálogo de serviços** - deve carregar sem erros
3. **Teste o dashboard financeiro** - deve carregar sem erros 404
4. **Teste a captação de clientes** - coluna `client_source` deve existir
5. **Teste upload de fotos** - tabela `vehicle_photos` deve funcionar

## 🛠️ Resolução de Problemas

### Se houver erro de permissão:
- Certifique-se de estar usando uma conta com privilégios de administrador no Supabase

### Se alguma tabela já existir:
- A migração usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar múltiplas vezes

### Se houver erro em políticas:
- A migração remove políticas existentes antes de criar novas

## 📝 Estrutura das Tabelas

### Services (Tabela Principal)
```sql
- id: UUID (chave primária)
- client_name: TEXT (nome do cliente)
- service_date: DATE (data do serviço)
- car_plate: TEXT (placa do veículo)
- car_model: TEXT (modelo do veículo)
- service_value: DECIMAL (valor do serviço)
- status: VARCHAR (pago/nao_pago/orcamento)
- completion_status: VARCHAR (concluido/em_andamento/nao_iniciado)
- client_source: VARCHAR (origem do cliente)
- selected_services: UUID[] (serviços do catálogo)
- tenant_id: UUID (ID do usuário/empresa)
```

### Catalog Services
```sql
- id: UUID (chave primária)
- name: TEXT (nome do serviço)
- value: DECIMAL (valor padrão)
- tenant_id: UUID (ID do usuário/empresa)
```

### Expenses
```sql
- id: UUID (chave primária)
- description: TEXT (descrição da despesa)
- value: DECIMAL (valor)
- expense_date: DATE (data da despesa)
- is_fixed: BOOLEAN (se é despesa fixa)
- tenant_id: UUID (ID do usuário/empresa)
```

### Other Income
```sql
- id: UUID (chave primária)
- description: TEXT (descrição da receita)
- value: DECIMAL (valor)
- income_date: DATE (data da receita)
- tenant_id: UUID (ID do usuário/empresa)
```

### Vehicle Photos
```sql
- id: UUID (chave primária)
- service_id: UUID (referência ao serviço)
- url: TEXT (URL da foto)
- description: TEXT (descrição da foto)
- tenant_id: UUID (ID do usuário/empresa)
```

### Profiles
```sql
- id: UUID (chave primária, referência ao auth.users)
- email: TEXT (email do usuário)
- full_name: TEXT (nome completo)
- company_name: TEXT (nome da empresa)
- phone: TEXT (telefone)
```

## 🎉 Próximos Passos

Após executar a migração com sucesso:

1. ✅ Todas as funcionalidades do sistema devem funcionar normalmente
2. ✅ Não haverá mais erros 404 ou de tabelas inexistentes
3. ✅ O sistema estará preparado para produção
4. ✅ Todos os dados serão isolados por usuário (multi-tenant)

**A migração está completa e o sistema deve funcionar perfeitamente!** 🚀