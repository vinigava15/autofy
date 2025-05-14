import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
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

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setValue(editingExpense.value.toString());
      setExpenseDate(editingExpense.expense_date.split('T')[0]);
    } else {
      resetForm();
    }
  }, [editingExpense]);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
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
    
    setIsSubmitting(true);
    
    try {
      // Formatação da data para manter consistência
      const formattedDate = `${expenseDate}T12:00:00`;
      
      if (editingExpense) {
        // Atualizar despesa existente
        const { error } = await supabase
          .from('expenses')
          .update({
            description: description.trim(),
            value: numericValue,
            expense_date: formattedDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingExpense.id)
          .eq('tenant_id', userId);
          
        if (error) throw error;
        toast.success('Despesa atualizada com sucesso!');
      } else {
        // Criar nova despesa
        const { error } = await supabase
          .from('expenses')
          .insert({
            description: description.trim(),
            value: numericValue,
            expense_date: formattedDate,
            tenant_id: userId
          });
          
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
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white">
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none transition-colors"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, material, conta de luz..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              id="expense_date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex justify-between pt-4">
            {editingExpense && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </button>
            )}
            
            <div className={editingExpense ? '' : 'ml-auto'}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 