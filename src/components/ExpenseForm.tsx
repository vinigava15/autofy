import { useState, useEffect } from 'react';
import { X, Save, Trash2, HelpCircle } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { Expense } from '../types/finance';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ExpenseFormProps {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
  editingExpense?: Expense;
  userId: string;
}

export function ExpenseForm({ onClose, onSuccess, isOpen, editingExpense, userId }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedDayOfMonth, setFixedDayOfMonth] = useState('');
  const [showFixedHelp, setShowFixedHelp] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setValue(editingExpense.value.toString());
      setExpenseDate(editingExpense.expense_date.split('T')[0]);
      setIsFixed(editingExpense.is_fixed || false);
      setFixedDayOfMonth(editingExpense.fixed_day_of_month?.toString() || '');
    } else {
      resetForm();
    }
  }, [editingExpense]);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    setIsFixed(false);
    setFixedDayOfMonth('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !value || !expenseDate) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error('Por favor, informe um valor válido.');
      return;
    }
    
    // Validação adicional para despesas fixas
    if (isFixed && (!fixedDayOfMonth || isNaN(parseInt(fixedDayOfMonth)) || parseInt(fixedDayOfMonth) < 1 || parseInt(fixedDayOfMonth) > 31)) {
      toast.error('Para despesas fixas, informe um dia do mês válido (1-31).');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Formatação da data para manter consistência
      const formattedDate = `${expenseDate}T12:00:00`;
      
      // Preparar dados da despesa
      const expenseData: any = {
        description: description.trim(),
        value: numericValue,
        expense_date: formattedDate,
        is_fixed: isFixed,
        updated_at: new Date().toISOString()
      };
      
      // Adicionar campos específicos para despesas fixas
      if (isFixed) {
        const dayOfMonth = parseInt(fixedDayOfMonth);
        expenseData.fixed_day_of_month = dayOfMonth;
        
        // Calcular a próxima data de geração (mês que vem)
        const currentDate = new Date();
        const nextMonth = currentDate.getMonth() + 2; // +2 porque é base 0 e queremos o próximo mês
        const nextYear = currentDate.getFullYear() + (nextMonth > 12 ? 1 : 0);
        const adjustedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;
        
        // Ajustar o dia caso seja maior que o número de dias no próximo mês
        const daysInNextMonth = getDaysInMonth(new Date(nextYear, adjustedMonth - 1, 1));
        const adjustedDay = Math.min(dayOfMonth, daysInNextMonth);
        
        const nextGenerationDate = new Date(nextYear, adjustedMonth - 1, adjustedDay);
        expenseData.next_generation_date = format(nextGenerationDate, 'yyyy-MM-dd');
      } else {
        // Remover campos de despesa fixa se não for fixa
        expenseData.fixed_day_of_month = null;
        expenseData.next_generation_date = null;
      }
      
      if (editingExpense) {
        // Atualizar despesa existente
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)
          .eq('tenant_id', userId);
          
        if (error) throw error;
        toast.success('Despesa atualizada com sucesso!');
      } else {
        // Criar nova despesa
        expenseData.tenant_id = userId;
        
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);
          
        if (error) throw error;
        toast.success('Despesa cadastrada com sucesso!');
      }
      
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast.error('Ocorreu um erro ao salvar a despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingExpense) return;
    
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', editingExpense.id)
        .eq('tenant_id', userId);
        
      if (error) throw error;
      
      toast.success('Despesa excluída com sucesso!');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast.error('Ocorreu um erro ao excluir a despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white">
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none transition-colors p-2"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="description" className="block text-base font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, material, conta de luz..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="value" className="block text-base font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="expense_date" className="block text-base font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              id="expense_date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="pt-2">
            <div className="flex items-center mb-2">
              <div className="flex items-center flex-1">
                <input
                  type="checkbox"
                  id="is_fixed"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_fixed" className="ml-3 block text-base text-gray-700">
                  Despesa fixa (mensal)
                </label>
              </div>
              <button 
                type="button"
                onClick={() => setShowFixedHelp(!showFixedHelp)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            
            {showFixedHelp && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                Marque esta opção para despesas que se repetem todo mês, como aluguel, 
                salários, mensalidades, etc. O sistema irá criar automaticamente esta 
                despesa todo mês na data especificada.
              </div>
            )}
          </div>
          
          {isFixed && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <label htmlFor="fixed_day_of_month" className="block text-base font-medium text-gray-700 mb-2">
                Dia do mês para gerar
              </label>
              <input
                type="number"
                inputMode="numeric"
                id="fixed_day_of_month"
                value={fixedDayOfMonth}
                onChange={(e) => setFixedDayOfMonth(e.target.value)}
                placeholder="Ex: 1, 5, 10, 25..."
                min="1"
                max="31"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                A despesa será gerada automaticamente todo mês neste dia.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {editingExpense && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Excluir
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${editingExpense ? 'sm:ml-auto' : ''}`}
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 