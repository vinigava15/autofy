import { supabase } from '../lib/supabase';
import { format, getDaysInMonth, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Verifica e gera despesas fixas para o usuário.
 * Esta função deve ser chamada quando o usuário abre o dashboard financeiro.
 */
export async function checkAndGenerateFixedExpenses(userId: string): Promise<boolean> {
  try {
    // Buscar despesas fixas que precisam ser geradas (com next_generation_date <= hoje)
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data: expensesToGenerate, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', userId)
      .eq('is_fixed', true)
      .lte('next_generation_date', today)
      .order('next_generation_date', { ascending: true });
      
    if (error) {
      return false;
    }
    
    if (!expensesToGenerate || expensesToGenerate.length === 0) {
      // Não há despesas fixas para gerar
      return true;
    }
    
    // Preparar dados para inserção em lote
    const newExpenses: any[] = [];
    const updatesData: any[] = [];
    const generatedExpenses: {description: string, value: number}[] = [];
    
    // Processar todas as despesas para inserção em lote
    for (const expense of expensesToGenerate) {
      try {
        // Calcular a data da nova despesa com base no dia fixo do mês atual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        const currentYear = currentDate.getFullYear();
        
        // Verificar se o dia fixo é válido para o mês atual
        const daysInCurrentMonth = getDaysInMonth(new Date(currentYear, currentMonth, 1));
        const dayToUse = Math.min(expense.fixed_day_of_month, daysInCurrentMonth);
        
        // Definir a data da nova despesa
        const expenseDate = new Date(currentYear, currentMonth, dayToUse);
        const formattedExpenseDate = `${format(expenseDate, 'yyyy-MM-dd')}T12:00:00`;
        
        // Calcular a próxima data de geração (mês seguinte)
        const nextGenerationDate = addMonths(expenseDate, 1);
        
        // Verificar se o dia é válido para o próximo mês
        const daysInNextMonth = getDaysInMonth(nextGenerationDate);
        const nextDayToUse = Math.min(expense.fixed_day_of_month, daysInNextMonth);
        
        // Ajustar o dia da próxima geração se necessário
        nextGenerationDate.setDate(nextDayToUse);
        
        // Adicionar à lista de novas despesas
        newExpenses.push({
          description: expense.description,
          value: expense.value,
          expense_date: formattedExpenseDate,
          tenant_id: userId,
          is_fixed: false,
          original_expense_id: expense.id
        });
        
        // Adicionar à lista de atualizações
        updatesData.push({
          id: expense.id,
          next_generation_date: format(nextGenerationDate, 'yyyy-MM-dd'),
          updated_at: new Date().toISOString()
        });
        
        generatedExpenses.push({ 
          description: expense.description, 
          value: expense.value 
        });
      } catch (err) {
        // Continuar processamento mesmo com erro
        continue;
      }
    }
    
    // Executar inserções em lote
    let generatedCount = 0;
    if (newExpenses.length > 0) {
      try {
        const { error: insertError } = await supabase
          .from('expenses')
          .insert(newExpenses);
          
        if (!insertError) {
          generatedCount = newExpenses.length;
          
          // Atualizar próximas datas de geração em lote
          const updatePromises = updatesData.map(update => 
            supabase
              .from('expenses')
              .update({
                next_generation_date: update.next_generation_date,
                updated_at: update.updated_at
              })
              .eq('id', update.id)
              .eq('tenant_id', userId)
          );
          
          await Promise.allSettled(updatePromises);
        }
      } catch (err) {
        // Em caso de erro, não gerar despesas
        generatedCount = 0;
      }
    }
    
    if (generatedCount > 0) {
      // Mostrar toast com detalhes das despesas geradas
      const pluralSuffix = generatedCount === 1 ? '' : 's';
      const toastContent = (
        <div>
          <p className="font-medium">
            {generatedCount} despesa{pluralSuffix} fixa{pluralSuffix} gerada{pluralSuffix}:
          </p>
          <ul className="mt-1 text-sm">
            {generatedExpenses.map((exp, index) => (
              <li key={index} className="flex justify-between">
                <span>{exp.description}</span>
                <span className="font-medium">R$ {exp.value.toFixed(2).replace('.', ',')}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      
      toast.success(toastContent, {
        duration: 5000, // Aumentar a duração para dar tempo de ler
        style: {
          maxWidth: '350px',
          padding: '16px'
        }
      });
      return true;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Retorna a próxima data de geração de uma despesa fixa,
 * ajustando o dia caso seja maior que o número de dias no próximo mês.
 */
export function calculateNextGenerationDate(dayOfMonth: number): string {
  const currentDate = new Date();
  const nextMonth = currentDate.getMonth() + 1;
  const year = nextMonth === 12 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
  const month = nextMonth === 12 ? 0 : nextMonth;
  
  // Verificar se o dia é válido para o próximo mês
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const adjustedDay = Math.min(dayOfMonth, daysInMonth);
  
  const nextDate = new Date(year, month, adjustedDay);
  return format(nextDate, 'yyyy-MM-dd');
} 