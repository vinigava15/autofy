import { Service } from '../types';

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
  tenant_id?: string;
}

/**
 * Dados para o mês selecionado
 */
export interface SelectedMonthData {
  services: Service[];
  expenses: Expense[];
  otherIncome: OtherIncome[];
  servicesTotal: number;
  expensesTotal: number;
  otherIncomeTotal: number;
  totalValue?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  netBalance?: number;
  servicesPagos?: Service[];
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
  is_fixed?: boolean;
  fixed_day_of_month?: number;
  next_generation_date?: string;
  original_expense_id?: string;
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