/**
 * Resumo financeiro para um período específico
 */
export interface FinanceSummary {
  period: string;
  total: number;
  count: number;
}

/**
 * Props para o componente FinanceDashboard
 */
export interface FinanceDashboardProps {
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Dados para o mês selecionado
 */
export interface SelectedMonthData {
  services: ServiceData[];
  totalValue: number;
  averageValue: number;
  expenses: Expense[];
  otherIncome: OtherIncome[];
  totalExpenses: number;
  totalOtherIncome: number;
  netBalance: number;
  servicesPagos?: ServiceData[];
  totalServicesCount?: number;
}

/**
 * Mês disponível para seleção
 */
export interface AvailableMonth {
  value: Date;
  label: string;
}

/**
 * Período para consultas
 */
export interface Period {
  name: string;
  start: string;
  end: string;
}

/**
 * Dados de um serviço
 */
export interface ServiceData {
  service_date: string;
  client_name: string;
  car_model: string;
  car_plate: string;
  repaired_parts?: string[];
  service_value: number;
  selected_services?: string[];
  catalog_services?: any[];
  services?: any[];
  [key: string]: any;
}

/**
 * Despesa
 */
export interface Expense {
  id: string;
  description: string;
  value: number;
  expense_date: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Ganho Extra
 */
export interface OtherIncome {
  id: string;
  description: string;
  value: number;
  income_date: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
} 