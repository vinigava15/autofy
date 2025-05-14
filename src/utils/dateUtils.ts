import { addMonths, format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AvailableMonth } from '../types/finance';

/**
 * Gera um array de meses disponíveis para seleção,
 * começando 12 meses atrás até o mês atual.
 */
export function generateAvailableMonths(): AvailableMonth[] {
  const today = new Date();
  const months: AvailableMonth[] = [];
  
  // Adiciona os últimos 12 meses até o atual
  for (let i = 0; i <= 12; i++) {
    const date = subMonths(today, i);
    const month = {
      value: date,
      label: format(date, 'MMMM yyyy', { locale: pt })
    };
    
    months.push(month);
  }
  
  // Adiciona também os próximos 3 meses para agendamento futuro
  for (let i = 1; i <= 3; i++) {
    const date = addMonths(today, i);
    const month = {
      value: date,
      label: format(date, 'MMMM yyyy', { locale: pt })
    };
    
    months.push(month);
  }
  
  return months;
} 