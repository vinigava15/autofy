import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { X, DollarSign, Calendar, FileText, Inbox, PiggyBank, Plus } from 'lucide-react';
import { 
  formatCurrency, 
  formatDateForQuery, 
  formatLocalDate 
} from '../utils/formatters';
import { 
  generateAvailableMonths 
} from '../utils/dateUtils';
import { 
  SummaryCard, 
  LoadingSpinner, 
  ErrorMessage, 
  MonthSelector,
  MetricCard,
  EmptyStateMessage 
} from './ui';
import { ExpensesTable, OtherIncomeTable } from './ui/FinanceTable';
import { ExpenseForm } from './ExpenseForm';
import { OtherIncomeForm } from './OtherIncomeForm';
import { 
  FinanceSummary, 
  FinanceDashboardProps, 
  SelectedMonthData,
  AvailableMonth,
  ServiceData,
  Expense,
  OtherIncome
} from '../types/finance';

// Tipo para o resumo por período modificado
interface PeriodSummary {
  name: string;
  servicesTotal: number;
  expensesTotal: number;
  otherIncomeTotal: number;
  netBalance: number;
  totalServicesCount: number;
}

/**
 * Dashboard financeiro que exibe resumo financeiro.
 */
export function FinanceDashboard({ onClose, isOpen }: FinanceDashboardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [periodSummaries, setPeriodSummaries] = useState<PeriodSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const [selectedMonthData, setSelectedMonthData] = useState<SelectedMonthData>({ 
    services: [], 
    totalValue: 0, 
    averageValue: 0,
    expenses: [],
    otherIncome: [],
    totalExpenses: 0,
    totalOtherIncome: 0,
    netBalance: 0,
    servicesPagos: [],
    totalServicesCount: 0
  });
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para formulários de despesas e ganhos extras
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isOtherIncomeFormOpen, setIsOtherIncomeFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [editingOtherIncome, setEditingOtherIncome] = useState<OtherIncome | undefined>();
  
  useEffect(() => {
    if (isOpen && user) {
      fetchFinancialData();
      setAvailableMonths(generateAvailableMonths());
    }
  }, [isOpen, user]);
  
  // Efeito para detectar solicitações para abrir formulários
  useEffect(() => {
    if (isOpen && user) {
      // Verificar se deve abrir formulário de despesas
      if (localStorage.getItem('openExpenseForm') === 'true') {
        setIsExpenseFormOpen(true);
        localStorage.removeItem('openExpenseForm');
      }
      
      // Verificar se deve abrir formulário de ganhos extras
      if (localStorage.getItem('openIncomeForm') === 'true') {
        setIsOtherIncomeFormOpen(true);
        localStorage.removeItem('openIncomeForm');
      }
    }
  }, [isOpen, user]);
  
  useEffect(() => {
    if (selectedMonth && user) {
      fetchSelectedMonthData(selectedMonth);
    }
  }, [selectedMonth, user]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Apenas buscar resumos para "Hoje" e "Este Ano"
      const today = new Date();
      const summaries = await fetchPeriodSummaries([
        {
          name: 'Hoje',
          start: formatDateForQuery(startOfDay(today)),
          end: formatDateForQuery(endOfDay(today))
        },
        {
          name: 'Este Ano',
          start: formatDateForQuery(startOfYear(today)),
          end: formatDateForQuery(endOfYear(today))
        }
      ]);
      
      setPeriodSummaries(summaries);
      fetchSelectedMonthData(selectedMonth);
    } catch (err) {
      console.error('Erro ao buscar dados financeiros:', err);
      setError('Não foi possível carregar os dados financeiros. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeriodSummaries = async (periods: { name: string, start: string, end: string }[]): Promise<PeriodSummary[]> => {
    if (!user) return [];
    
    return Promise.all(
      periods.map(async (period) => {
        // Buscar serviços (apenas pagos para cálculos financeiros)
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('service_value, status')
          .eq('tenant_id', user.id)
          .gte('service_date', period.start)
          .lte('service_date', period.end);
          
        if (servicesError) throw new Error(`Erro ao buscar dados de serviços para ${period.name}: ${servicesError.message}`);
        
        // Buscar ganhos extras
        const { data: incomeData, error: incomeError } = await supabase
          .from('other_income')
          .select('value')
          .eq('tenant_id', user.id)
          .gte('income_date', period.start)
          .lte('income_date', period.end);
          
        if (incomeError) throw new Error(`Erro ao buscar dados de ganhos extras para ${period.name}: ${incomeError.message}`);
        
        // Buscar despesas
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('value')
          .eq('tenant_id', user.id)
          .gte('expense_date', period.start)
          .lte('expense_date', period.end);
          
        if (expensesError) throw new Error(`Erro ao buscar dados de despesas para ${period.name}: ${expensesError.message}`);
        
        // Contar o total de serviços (todos, para fins de contagem)
        const totalServicesCount = servicesData?.length || 0;
        
        // Calcular o total de serviços PAGOS (para cálculos financeiros)
        const servicesTotal = servicesData?.reduce((sum, service) => {
          // Considerar apenas serviços com status 'pago' para valor financeiro
          if (service.status === 'pago') {
            return sum + (parseFloat(service.service_value) || 0);
          }
          return sum;
        }, 0) || 0;
        
        // Calcular o total de ganhos extras
        const otherIncomeTotal = incomeData?.reduce((sum, income) => sum + (parseFloat(income.value.toString()) || 0), 0) || 0;
        
        // Calcular o total de despesas
        const expensesTotal = expensesData?.reduce((sum, expense) => sum + (parseFloat(expense.value.toString()) || 0), 0) || 0;
        
        // Calcular o saldo final (receitas - despesas)
        const netBalance = (servicesTotal + otherIncomeTotal) - expensesTotal;
        
        return {
          name: period.name,
          servicesTotal,
          expensesTotal,
          otherIncomeTotal,
          netBalance,
          totalServicesCount
        };
      })
    );
  };
  
  const fetchSelectedMonthData = async (date: Date) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      const start = formatDateForQuery(startDate);
      const end = formatDateForQuery(endDate);
      
      // Buscar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', user.id)
        .gte('service_date', start)
        .lte('service_date', end)
        .order('service_date', { ascending: false });
        
      if (servicesError) throw servicesError;
      
      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', user.id)
        .gte('expense_date', start)
        .lte('expense_date', end)
        .order('expense_date', { ascending: false });
        
      if (expensesError) throw expensesError;
      
      // Buscar ganhos extras
      const { data: otherIncomeData, error: otherIncomeError } = await supabase
        .from('other_income')
        .select('*')
        .eq('tenant_id', user.id)
        .gte('income_date', start)
        .lte('income_date', end)
        .order('income_date', { ascending: false });
        
      if (otherIncomeError) throw otherIncomeError;
      
      // Filtrar serviços por status e calcular totais
      const servicesPagos = servicesData?.filter(service => service.status === 'pago') || [];
      const servicesTotalPagos = servicesPagos.reduce((sum, service) => sum + (parseFloat(service.service_value) || 0), 0);
      
      // Calcular totais para todos os serviços (para contagem)
      const totalServicesCount = servicesData?.length || 0;
      
      // Calcular totais para despesas e ganhos extras
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (parseFloat(expense.value) || 0), 0) || 0;
      const totalOtherIncome = otherIncomeData?.reduce((sum, income) => sum + (parseFloat(income.value) || 0), 0) || 0;
      
      // Calcular valor total (apenas serviços PAGOS + ganhos extras)
      const totalValue = servicesTotalPagos + totalOtherIncome;
      
      // Calcular saldo líquido
      const netBalance = totalValue - totalExpenses;
      
      // Calcular média de valor por serviço PAGO
      const averageValue = servicesPagos.length ? servicesTotalPagos / servicesPagos.length : 0;
      
      setSelectedMonthData({
        services: servicesData || [],
        totalValue,
        averageValue,
        expenses: expensesData || [],
        otherIncome: otherIncomeData || [],
        totalExpenses,
        totalOtherIncome,
        netBalance,
        servicesPagos,
        totalServicesCount
      });
    } catch (err) {
      console.error('Erro ao buscar dados do mês selecionado:', err);
      setError('Não foi possível carregar os dados do mês selecionado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (index: number) => {
    if (index >= 0 && index < availableMonths.length) {
      setSelectedMonth(availableMonths[index].value);
    }
  };
  
  // Funções para gerenciar despesas
  const handleOpenExpenseForm = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(true);
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseFormOpen(true);
  };
  
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', user?.id);
        
      if (error) throw error;
      
      // Atualizar os dados após exclusão
      fetchSelectedMonthData(selectedMonth);
      // Atualizar também o resumo dos períodos
      fetchFinancialData();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
  };
  
  // Funções para gerenciar ganhos extras
  const handleOpenOtherIncomeForm = () => {
    setEditingOtherIncome(undefined);
    setIsOtherIncomeFormOpen(true);
  };
  
  const handleEditOtherIncome = (income: OtherIncome) => {
    setEditingOtherIncome(income);
    setIsOtherIncomeFormOpen(true);
  };
  
  const handleDeleteOtherIncome = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ganho extra?')) return;
    
    try {
      const { error } = await supabase
        .from('other_income')
        .delete()
        .eq('id', id)
        .eq('tenant_id', user?.id);
        
      if (error) throw error;
      
      // Atualizar os dados após exclusão
      fetchSelectedMonthData(selectedMonth);
      // Atualizar também o resumo dos períodos
      fetchFinancialData();
    } catch (error) {
      console.error('Erro ao excluir ganho extra:', error);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <DollarSign className="h-6 w-6 mr-2" />
            Dashboard Financeiro
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none transition-colors"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="p-6 bg-gray-50">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <div>
              <PeriodSummarySection periodSummaries={periodSummaries} />
              <MonthlyDetailSection 
                selectedMonth={selectedMonth}
                selectedMonthData={selectedMonthData}
                availableMonths={availableMonths}
                onMonthChange={handleMonthChange}
                onOpenExpenseForm={handleOpenExpenseForm}
                onOpenOtherIncomeForm={handleOpenOtherIncomeForm}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                onEditOtherIncome={handleEditOtherIncome}
                onDeleteOtherIncome={handleDeleteOtherIncome}
              />
            </div>
          )}
        </div>
      </div>
      
      {isExpenseFormOpen && user && (
        <ExpenseForm
          isOpen={isExpenseFormOpen}
          onClose={() => setIsExpenseFormOpen(false)}
          onSuccess={() => {
            setIsExpenseFormOpen(false);
            fetchSelectedMonthData(selectedMonth);
            fetchFinancialData(); // Atualizar também o resumo dos períodos
          }}
          editingExpense={editingExpense}
          userId={user.id}
        />
      )}
      
      {isOtherIncomeFormOpen && user && (
        <OtherIncomeForm
          isOpen={isOtherIncomeFormOpen}
          onClose={() => setIsOtherIncomeFormOpen(false)}
          onSuccess={() => {
            setIsOtherIncomeFormOpen(false);
            fetchSelectedMonthData(selectedMonth);
            fetchFinancialData(); // Atualizar também o resumo dos períodos
          }}
          editingIncome={editingOtherIncome}
          userId={user.id}
        />
      )}
    </div>
  );
}

function PeriodSummarySection({ periodSummaries }: { periodSummaries: PeriodSummary[] }) {
  const CARD_COLORS = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-teal-600'
  ];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
        Resumo por período
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periodSummaries.map((summary, index) => (
          <div 
            key={index}
            className={`bg-gradient-to-r ${CARD_COLORS[index % CARD_COLORS.length]} rounded-lg shadow-md p-5 text-white`}
          >
            <h4 className="text-lg font-bold mb-3">{summary.name}</h4>
            
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center">
                <FileText className="h-4 w-4 mr-1 opacity-80" />
                Serviços ({summary.totalServicesCount}):
              </span>
              <span className="font-medium">{formatCurrency(summary.servicesTotal)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span>Ganhos extras:</span>
              <span className="font-medium">{formatCurrency(summary.otherIncomeTotal)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span>Despesas:</span>
              <span className="font-medium">-{formatCurrency(summary.expensesTotal)}</span>
            </div>
            
            <div className="border-t border-white border-opacity-20 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold">Saldo:</span>
              <span className={`text-lg font-bold ${summary.netBalance >= 0 ? 'text-green-100' : 'text-red-200'}`}>
                {formatCurrency(summary.netBalance)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyDetailSection({ 
  selectedMonth,
  selectedMonthData,
  availableMonths,
  onMonthChange,
  onOpenExpenseForm,
  onOpenOtherIncomeForm,
  onEditExpense,
  onDeleteExpense,
  onEditOtherIncome,
  onDeleteOtherIncome
}: { 
  selectedMonth: Date,
  selectedMonthData: SelectedMonthData,
  availableMonths: AvailableMonth[],
  onMonthChange: (index: number) => void,
  onOpenExpenseForm: () => void,
  onOpenOtherIncomeForm: () => void,
  onEditExpense: (expense: Expense) => void,
  onDeleteExpense: (id: string) => void,
  onEditOtherIncome: (income: OtherIncome) => void,
  onDeleteOtherIncome: (id: string) => void
}) {
  const selectedMonthIndex = availableMonths.findIndex(month => 
    month.value.getMonth() === selectedMonth.getMonth() && 
    month.value.getFullYear() === selectedMonth.getFullYear()
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
          Detalhes por mês
        </h3>
        <MonthSelector 
          months={availableMonths}
          selectedIndex={selectedMonthIndex}
          onChange={onMonthChange}
        />
      </div>
      
      <MonthMetrics data={selectedMonthData} />
      
      {/* Seção de Serviços */}
      <div className="mt-8 mb-8">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Serviços do mês
        </h4>
        
        {selectedMonthData.services.length > 0 ? (
          <ServicesTable services={selectedMonthData.services} />
        ) : (
          <EmptyStateMessage message="Nenhum serviço registrado para o mês selecionado." />
        )}
      </div>
      
      {/* Seção de Despesas */}
      <div className="mt-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center">
            <Inbox className="h-5 w-5 mr-2 text-red-600" />
            Despesas do mês
          </h4>
          <button
            onClick={onOpenExpenseForm}
            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Despesa
          </button>
        </div>
        
        <ExpensesTable 
          expenses={selectedMonthData.expenses} 
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      </div>
      
      {/* Seção de Ganhos Extras */}
      <div className="mt-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center">
            <PiggyBank className="h-5 w-5 mr-2 text-green-600" />
            Ganhos Extras do mês
          </h4>
          <button
            onClick={onOpenOtherIncomeForm}
            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Ganho
          </button>
        </div>
        
        <OtherIncomeTable 
          incomes={selectedMonthData.otherIncome}
          onEdit={onEditOtherIncome}
          onDelete={onDeleteOtherIncome}
        />
      </div>
    </div>
  );
}

function MonthMetrics({ data }: { data: SelectedMonthData }) {
  const servicosPagos = data.servicesPagos?.length || 0;
  const servicosTotal = data.totalServicesCount || data.services.length || 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <MetricCard 
        title="Receita Total"
        value={formatCurrency(data.totalValue)}
        icon={<DollarSign className="h-4 w-4 text-white" />}
        colorClass="from-blue-500 to-blue-600"
      />
      <MetricCard 
        title="Despesas"
        value={formatCurrency(data.totalExpenses)}
        icon={<Inbox className="h-4 w-4 text-white" />}
        colorClass="from-red-500 to-red-600"
      />
      <MetricCard 
        title="Ganhos Extras"
        value={formatCurrency(data.totalOtherIncome)}
        icon={<PiggyBank className="h-4 w-4 text-white" />}
        colorClass="from-green-500 to-green-600"
      />
      <MetricCard 
        title="Saldo Final"
        value={formatCurrency(data.netBalance)}
        icon={<DollarSign className="h-4 w-4 text-white" />}
        colorClass={data.netBalance >= 0 ? "from-emerald-500 to-teal-600" : "from-rose-500 to-red-600"}
      />
      <MetricCard 
        title="Serviços"
        value={`${servicosPagos}/${servicosTotal}`}
        subtitle={`${servicosPagos} pagos de ${servicosTotal} total`}
        icon={<FileText className="h-4 w-4 text-white" />}
        colorClass="from-purple-500 to-violet-600"
      />
    </div>
  );
}

function ServicesTable({ services }: { services: ServiceData[] }) {
  // Função para formatar os serviços de um registro
  const formatServices = (service: ServiceData): string => {
    // Verificar se temos uma lista de serviços selecionados
    if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
      // Se tivermos catalog_services (resultado de JOIN)
      if (service.catalog_services && Array.isArray(service.catalog_services)) {
        return service.catalog_services.map((s: any) => s.name).join(', ');
      }
      
      // Caso tenhamos serviços em um campo services
      if (service.services && Array.isArray(service.services)) {
        return service.services.map((s: any) => s.name).join(', ');
      }
      
      // Se tivermos apenas os IDs
      return `${service.selected_services.length} serviço(s) selecionado(s)`;
    }
    
    // Caso para o formato antigo (repaired_parts)
    if (Array.isArray(service.repaired_parts) && service.repaired_parts.length > 0) {
      return service.repaired_parts.join(', ');
    }
    
    // Caso não tenha serviços definidos
    return '-';
  };

  // Função para renderizar o indicador de status
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    let badgeClass = '';
    let statusText = '';
    
    switch (status) {
      case 'pago':
        badgeClass = 'bg-green-100 text-green-800 border-green-200';
        statusText = 'Pago';
        break;
      case 'nao_pago':
        badgeClass = 'bg-red-100 text-red-800 border-red-200';
        statusText = 'Não Pago';
        break;
      case 'orcamento':
        badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
        statusText = 'Orçamento';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
        statusText = status;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Veículo</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Serviços</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-blue-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-700">{formatLocalDate(service.service_date)}</td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">{service.client_name}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{service.car_model} ({service.car_plate})</td>
                <td className="py-3 px-4 text-sm text-gray-700">{formatServices(service)}</td>
                <td className="py-3 px-4 text-sm text-blue-600 font-medium">{formatCurrency(service.service_value)}</td>
                <td className="py-3 px-4 text-sm">{renderStatusBadge(service.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 