import { ArrowDown, ArrowUp, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { SelectedMonthData } from '../../types/finance';

interface MonthMetricsProps {
  data: SelectedMonthData;
}

export function MonthMetrics({ data }: MonthMetricsProps) {
  const totalProfit = data.servicesTotal - data.expensesTotal + data.otherIncomeTotal;
  const isNegative = totalProfit < 0;
  
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita total */}
        <MetricCard 
          title="Receita"
          value={data.servicesTotal + data.otherIncomeTotal}
          color="green"
          icon={<DollarSign className="h-5 w-5" />}
          tooltip="Total de receitas no mês (serviços + ganhos extras)"
        />
        
        {/* Despesas */}
        <MetricCard 
          title="Despesas"
          value={data.expensesTotal}
          color="red"
          icon={<ArrowDown className="h-5 w-5" />}
          tooltip="Total de despesas no mês"
        />
        
        {/* Saldo */}
        <MetricCard 
          title="Lucro/Prejuízo"
          value={totalProfit}
          color={isNegative ? "red" : "green"}
          icon={isNegative ? <AlertTriangle className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
          tooltip="Lucro ou prejuízo no mês (receitas - despesas)"
          highlight={true}
        />
        
        {/* Taxa de conversão (só mostra se houver serviços) */}
        <MetricCard 
          title="Conversão"
          value={(data.servicesTotal / (data.servicesTotal + data.expensesTotal)) * 100}
          suffix="%"
          color={data.servicesTotal > 0 ? "blue" : "gray"}
          icon={<ArrowUp className="h-5 w-5" />}
          tooltip="Porcentagem de receita em relação ao fluxo total"
          isPercentage={true}
          disabled={data.servicesTotal === 0}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  color: "red" | "green" | "blue" | "gray";
  icon: React.ReactNode;
  tooltip: string;
  highlight?: boolean;
  suffix?: string;
  isPercentage?: boolean;
  disabled?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  color, 
  icon, 
  tooltip,
  highlight = false,
  suffix = "",
  isPercentage = false,
  disabled = false
}: MetricCardProps) {
  // Definir cores com base no tipo
  const colorMap = {
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: "bg-red-100 text-red-600",
      border: "border-red-200"
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: "bg-green-100 text-green-600",
      border: "border-green-200"
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "bg-blue-100 text-blue-600",
      border: "border-blue-200"
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      icon: "bg-gray-100 text-gray-500",
      border: "border-gray-200"
    }
  };
  
  const colors = colorMap[color];
  
  const formattedValue = isPercentage 
    ? value.toFixed(1) + suffix
    : formatCurrency(value) + suffix;
    
  return (
    <div 
      className={`${colors.bg} border ${colors.border} rounded-lg p-4 ${highlight ? 'transform scale-105 shadow-md' : 'shadow-sm'} ${disabled ? 'opacity-60' : ''}`}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-xl font-bold ${colors.text}`}>
            {formattedValue}
          </p>
        </div>
        <div className={`${colors.icon} p-2 rounded-full`}>
          {icon}
        </div>
      </div>
      
      {disabled && (
        <p className="text-xs text-gray-500 mt-2">
          Sem dados para calcular
        </p>
      )}
    </div>
  );
} 