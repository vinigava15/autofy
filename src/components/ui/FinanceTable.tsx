import { Pencil, Trash2 } from 'lucide-react';
import { formatLocalDate, formatCurrency } from '../../utils/formatters';
import { Expense, OtherIncome } from '../../types/finance';

// Componente para exibir tabela de despesas
export function ExpensesTable({ 
  expenses,
  onEdit,
  onDelete
}: { 
  expenses: Expense[],
  onEdit: (expense: Expense) => void,
  onDelete: (id: string) => void
}) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">Nenhuma despesa registrada para o período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descrição</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-red-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-700">{formatLocalDate(expense.expense_date)}</td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">{expense.description}</td>
                <td className="py-3 px-4 text-sm text-red-600 font-medium">{formatCurrency(expense.value)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente para exibir tabela de ganhos extras
export function OtherIncomeTable({ 
  incomes,
  onEdit,
  onDelete
}: { 
  incomes: OtherIncome[],
  onEdit: (income: OtherIncome) => void,
  onDelete: (id: string) => void
}) {
  if (!incomes || incomes.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">Nenhum ganho extra registrado para o período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descrição</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {incomes.map((income) => (
              <tr key={income.id} className="hover:bg-green-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-700">{formatLocalDate(income.income_date)}</td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">{income.description}</td>
                <td className="py-3 px-4 text-sm text-green-600 font-medium">{formatCurrency(income.value)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(income)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(income.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 