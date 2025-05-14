# Migrações para o Supabase

Este diretório contém scripts SQL para atualizar o esquema do banco de dados no Supabase.

## Migração: Adicionar status aos serviços

### O que é
Adiciona um campo `status` à tabela de serviços (`services`) para permitir a classificação dos serviços como:
- "pago"
- "nao_pago" 
- "orcamento"

### Como aplicar
Para aplicar a migração, você pode:

1. **No painel do Supabase**:
   - Acesse o painel do Supabase
   - Navegue até "SQL Editor"
   - Crie uma nova consulta
   - Cole o conteúdo do arquivo `add_status_column.sql`
   - Execute a consulta

2. **Usando a CLI do Supabase**:
   ```bash
   supabase db push
   ```

### Impacto
- Os serviços existentes serão todos marcados com o status "pago" por padrão
- Será necessário atualizar o código do aplicativo para suportar esta nova funcionalidade 