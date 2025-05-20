import { Pencil, Trash2, Repeat, Calendar, AlertCircle } from 'lucide-react';
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

  // Versão mobile: renderiza cards ao invés de tabela
  const renderMobileView = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {expenses.map((expense) => (
          <div 
            key={expense.id} 
            className={`bg-white border rounded-lg shadow-sm overflow-hidden 
                      ${expense.is_fixed ? 'border-blue-300' : 'border-gray-200'}`}
          >
            <div className={`p-4 ${expense.is_fixed ? 'bg-blue-50/50' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800 text-lg">{expense.description}</h3>
                <span className="text-lg font-semibold text-red-600">{formatCurrency(expense.value)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatLocalDate(expense.expense_date)}</span>
              </div>
              
              {expense.is_fixed && (
                <div className="flex items-center text-blue-600 text-sm mb-2 font-medium">
                  <Repeat className="h-4 w-4 mr-1" />
                  <span>Despesa fixa (dia {expense.fixed_day_of_month})</span>
                </div>
              )}
              
              {expense.original_expense_id && (
                <div className="flex items-center text-blue-600 text-sm mb-2 font-medium">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Gerada automaticamente</span>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onEdit(expense)}
                  className="flex items-center justify-center bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Versão desktop: mantém a tabela
  const renderDesktopView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
              <tr key={expense.id} className={`hover:bg-red-50 transition-colors ${expense.is_fixed ? 'bg-red-50/30' : ''}`}>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {formatLocalDate(expense.expense_date)}
                  {expense.is_fixed && (
                    <div className="text-xs text-blue-600 font-medium flex items-center mt-1">
                      <Repeat className="h-3 w-3 mr-1" />
                      Fixa (dia {expense.fixed_day_of_month})
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                  {expense.description}
                  {expense.original_expense_id && (
                    <div className="text-xs text-blue-600 font-medium">
                      Gerada automaticamente
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-red-600 font-medium">{formatCurrency(expense.value)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="hidden md:block">
        {renderDesktopView()}
      </div>
      <div className="md:hidden p-3">
        {renderMobileView()}
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

  // Versão mobile: renderiza cards ao invés de tabela
  const renderMobileView = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {incomes.map((income) => (
          <div 
            key={income.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800 text-lg">{income.description}</h3>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(income.value)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatLocalDate(income.income_date)}</span>
              </div>
              
              <div className="flex justify-end space-x-2 mt-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onEdit(income)}
                  className="flex items-center justify-center bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onDelete(income.id)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Versão desktop: mantém a tabela
  const renderDesktopView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(income.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="hidden md:block">
        {renderDesktopView()}
      </div>
      <div className="md:hidden p-3">
        {renderMobileView()}
      </div>
    </div>
  );
} 