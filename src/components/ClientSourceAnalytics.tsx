import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Download, PieChart, BarChart, Calendar, DollarSign, Target } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, subMonths, subYears, parseISO } from 'date-fns';
import { formatCurrency, formatLocalDate } from '../utils/formatters';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

// Tipos
interface ClientSourceRecord {
  source: string;
  count: number;
  totalValue: number;
  averageValue: number;
}

interface Period {
  label: string;
  startDate: Date;
  endDate: Date;
}

interface ClientSourceAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// Cores para os gráficos
const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

// Traduções para as origens
const SOURCE_LABELS: Record<string, string> = {
  'instagram': 'Instagram',
  'google': 'Google',
  'indicacao': 'Indicação',
  'facebook': 'Facebook',
  'site': 'Site',
  'outros': 'Outros',
  '': 'Não informado'
};

export function ClientSourceAnalytics({ isOpen, onClose, userId }: ClientSourceAnalyticsProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [period, setPeriod] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [sourceData, setSourceData] = useState<ClientSourceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados de acordo com o período selecionado
  useEffect(() => {
    if (isOpen && userId) {
      fetchSourceData();
    }
  }, [isOpen, userId, period, customStartDate, customEndDate]);

  const getDateRange = (): { startDate: string, endDate: string } => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'quarter':
        startDate = startOfQuarter(today);
        endDate = endOfQuarter(today);
        break;
      case 'year':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'custom':
        startDate = parseISO(customStartDate);
        endDate = parseISO(customEndDate);
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };

  const fetchSourceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('services')
        .select('client_source, service_value, status')
        .eq('tenant_id', userId)
        .gte('service_date', startDate)
        .lte('service_date', endDate);

      if (error) throw error;

      // Processar e agrupar os dados por origem
      const processedData = processSourceData(data || []);
      setSourceData(processedData);
    } catch (error) {
      console.error('Erro ao buscar dados de origem dos clientes:', error);
      setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const processSourceData = (services: any[]): ClientSourceRecord[] => {
    // Filtrar apenas serviços pagos para cálculos financeiros
    const paidServices = services.filter(service => service.status === 'pago');
    
    // Agrupar por origem
    const sourceGroups: Record<string, { count: number; totalValue: number }> = {};

    // Inicializar com todas as origens possíveis
    ['instagram', 'google', 'indicacao', 'facebook', 'site', 'outros', ''].forEach(source => {
      sourceGroups[source] = { count: 0, totalValue: 0 };
    });

    // Contabilizar serviços
    services.forEach(service => {
      const source = service.client_source || '';
      if (!sourceGroups[source]) {
        sourceGroups[source] = { count: 0, totalValue: 0 };
      }
      sourceGroups[source].count += 1;
    });

    // Contabilizar valores apenas para serviços pagos
    paidServices.forEach(service => {
      const source = service.client_source || '';
      const value = parseFloat(service.service_value) || 0;
      if (sourceGroups[source]) {
        sourceGroups[source].totalValue += value;
      }
    });

    // Converter para array e calcular médias
    const result = Object.entries(sourceGroups).map(([source, data]) => ({
      source,
      count: data.count,
      totalValue: data.totalValue,
      averageValue: data.count > 0 ? data.totalValue / data.count : 0
    }));

    // Filtrar origens sem registros e ordenar por contagem
    return result
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const handleExportCSV = () => {
    // Criar conteúdo CSV
    const header = 'Origem,Quantidade,Valor Total,Valor Médio\n';
    const rows = sourceData.map(item => 
      `${SOURCE_LABELS[item.source]},${item.count},${item.totalValue.toFixed(2)},${item.averageValue.toFixed(2)}`
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
    
    // Criar link para download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    // Nome do arquivo com a data atual
    const { startDate, endDate } = getDateRange();
    link.setAttribute('download', `origem-clientes_${startDate}_${endDate}.csv`);
    
    // Disparar o download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPieChart = () => {
    if (sourceData.length === 0) {
      return <div className="text-center text-gray-500 py-10">Nenhum dado disponível para o período selecionado</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RechartsPieChart>
          <Pie
            data={sourceData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={150}
            fill="#8884d8"
            dataKey="count"
            nameKey="source"
            label={({ source, percent }) => `${SOURCE_LABELS[source]} (${(percent * 100).toFixed(0)}%)`}
          >
            {sourceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [value, 'Quantidade']}
            labelFormatter={(value) => SOURCE_LABELS[value as string]}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    if (sourceData.length === 0) {
      return <div className="text-center text-gray-500 py-10">Nenhum dado disponível para o período selecionado</div>;
    }

    // Preparar dados para o gráfico de barras
    const barData = sourceData.map(item => ({
      ...item,
      sourceLabel: SOURCE_LABELS[item.source]
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart
          data={barData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="sourceLabel" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'count') return [`${value}`, 'Quantidade'];
              if (name === 'totalValue') return [formatCurrency(value as number), 'Valor Total'];
              if (name === 'averageValue') return [formatCurrency(value as number), 'Valor Médio'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="count" 
            fill="#3b82f6" 
            name="Quantidade" 
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  };

  const renderMetricCards = () => {
    if (sourceData.length === 0) return null;

    // Calcular totais
    const totalClients = sourceData.reduce((sum, item) => sum + item.count, 0);
    const totalValue = sourceData.reduce((sum, item) => sum + item.totalValue, 0);
    const overallAverage = totalValue / totalClients;

    // Encontrar origem mais popular
    const mostPopular = sourceData.reduce((prev, current) => 
      prev.count > current.count ? prev : current, sourceData[0]);

    // Encontrar origem com maior valor médio
    const highestAverage = sourceData.reduce((prev, current) => 
      prev.averageValue > current.averageValue ? prev : current, sourceData[0]);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-90">Total de Clientes</p>
            <span className="p-2 bg-white bg-opacity-20 rounded-full">
              <Target className="h-4 w-4 text-white" />
            </span>
          </div>
          <p className="text-2xl font-bold mt-2">{totalClients}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow p-4 text-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-90">Valor Total</p>
            <span className="p-2 bg-white bg-opacity-20 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </span>
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow p-4 text-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-90">Origem Mais Popular</p>
            <span className="p-2 bg-white bg-opacity-20 rounded-full">
              <Target className="h-4 w-4 text-white" />
            </span>
          </div>
          <p className="text-xl font-bold mt-2">{SOURCE_LABELS[mostPopular.source]}</p>
          <p className="text-sm mt-1 opacity-80">{mostPopular.count} clientes</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow p-4 text-white">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-90">Maior Valor Médio</p>
            <span className="p-2 bg-white bg-opacity-20 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </span>
          </div>
          <p className="text-xl font-bold mt-2">{SOURCE_LABELS[highestAverage.source]}</p>
          <p className="text-sm mt-1 opacity-80">{formatCurrency(highestAverage.averageValue)}</p>
        </div>
      </div>
    );
  };

  const renderDataTable = () => {
    if (sourceData.length === 0) return null;

    return (
      <div className="overflow-x-auto mt-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Origem
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Médio
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sourceData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="text-sm font-medium text-gray-900">{SOURCE_LABELS[item.source]}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(item.totalValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(item.averageValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const formattedStart = format(parseISO(startDate), 'dd/MM/yyyy');
    const formattedEnd = format(parseISO(endDate), 'dd/MM/yyyy');
    return `${formattedStart} - ${formattedEnd}`;
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center
      ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} 
      transition-opacity duration-300`}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Target className="h-6 w-6 mr-2" />
            Análise de Origem dos Clientes
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
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          ) : (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Período: {renderDateRange()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {sourceData.length > 0 
                      ? `${sourceData.reduce((sum, item) => sum + item.count, 0)} clientes no total` 
                      : 'Nenhum cliente no período'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setChartType('pie')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${chartType === 'pie' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <PieChart className="w-4 h-4 mr-1" />
                    Pizza
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${chartType === 'bar' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <BarChart className="w-4 h-4 mr-1" />
                    Barras
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={sourceData.length === 0}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium 
                      ${sourceData.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                  <h2 className="text-lg font-medium">Filtros de Período</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="month">Mês atual</option>
                      <option value="quarter">Trimestre atual</option>
                      <option value="year">Ano atual</option>
                      <option value="custom">Período personalizado</option>
                    </select>
                  </div>

                  {period === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {renderMetricCards()}

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-medium mb-4">Distribuição de Origem dos Clientes</h3>
                {chartType === 'pie' ? renderPieChart() : renderBarChart()}
              </div>

              {renderDataTable()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 