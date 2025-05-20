import { AvailableMonth } from '../../types/finance';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  months: AvailableMonth[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function MonthSelector({ months, selectedIndex, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={() => onChange(selectedIndex - 1)}
        disabled={selectedIndex <= 0}
        className="p-2 md:p-3 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:hover:text-gray-300 focus:outline-none transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <div className="px-3 py-2 md:py-3 text-center font-medium text-gray-800 border-l border-r border-gray-200 flex-1 min-w-[120px]">
        {months[selectedIndex]?.label || "Selecione"}
      </div>
      
      <button
        onClick={() => onChange(selectedIndex + 1)}
        disabled={selectedIndex >= months.length - 1}
        className="p-2 md:p-3 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:hover:text-gray-300 focus:outline-none transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
} 