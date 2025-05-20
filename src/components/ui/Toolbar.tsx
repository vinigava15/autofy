import React from 'react';
import { Filter, Plus, List, Kanban, Clock, CheckCircle2, Bookmark, BarChart3, Target, Search } from 'lucide-react';

interface ToolbarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onAdvancedSearch: () => void;
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
  onNewService: () => void;
  onQuotationsOpen: () => void;
  onCompletedServicesOpen: () => void;
  onCatalogOpen: () => void;
  onFinanceDashboardOpen: () => void;
  onSourceAnalyticsOpen: () => void;
}

/**
 * Componente para a barra de ferramentas da aplicação
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  searchTerm,
  onSearch,
  onAdvancedSearch,
  viewMode,
  onViewModeChange,
  onNewService,
  onQuotationsOpen,
  onCompletedServicesOpen,
  onCatalogOpen,
  onFinanceDashboardOpen,
  onSourceAnalyticsOpen
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg mb-6 p-4 border border-gray-100">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
        <div className="flex w-full lg:w-auto mb-4 lg:mb-0">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente ou placa..."
              className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <button
            onClick={onAdvancedSearch}
            className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md flex items-center touch-action-button"
            title="Busca Avançada"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 lg:space-x-2 w-full lg:w-auto">
          {/* Botões de alternância de visualização */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden col-span-2 sm:col-span-1">
            <button
              className={`flex-1 px-3 py-2 flex items-center justify-center ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => onViewModeChange('table')}
              title="Visualização em tabela"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              className={`flex-1 px-3 py-2 flex items-center justify-center ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => onViewModeChange('kanban')}
              title="Visualização Kanban"
            >
              <Kanban className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={onNewService}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Novo</span>
          </button>
          <button
            onClick={onQuotationsOpen}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <Clock className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Orçamentos</span>
          </button>
          <button
            onClick={onCompletedServicesOpen}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <CheckCircle2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Concluídos</span>
          </button>
          <button
            onClick={onCatalogOpen}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <Bookmark className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Catálogo</span>
          </button>
          <button
            onClick={onFinanceDashboardOpen}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <BarChart3 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Financeiro</span>
          </button>
          <button
            onClick={onSourceAnalyticsOpen}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-action-button"
          >
            <Target className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Captação</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 