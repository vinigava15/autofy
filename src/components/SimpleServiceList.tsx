import { useState } from 'react';
import { Service } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Car, DollarSign, Clock, Calendar, Filter, X, CheckCircle2, Clock9, AlertCircle, ShieldAlert } from 'lucide-react';

interface SimpleServiceListProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
}

export function SimpleServiceList({ services, onServiceSelect }: SimpleServiceListProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [completionFilter, setCompletionFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Formatador de data
  const formatLocalDate = (dateString: string) => {
    // Garantir que a data seja tratada como meio-dia UTC para evitar problemas de fuso horário
    const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
    return format(date, 'dd/MM/yyyy', { locale: pt });
  };

  // Formatador de valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Função para filtrar serviços
  const filteredServices = services.filter(service => {
    // Filtro por status financeiro
    if (statusFilter && service.status !== statusFilter) {
      return false;
    }
    
    // Filtro por status de conclusão
    if (completionFilter && service.completion_status !== completionFilter) {
      return false;
    }
    
    return true;
  });

  // Função para renderizar o ícone de status
  const renderStatusIcon = (status?: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'nao_pago':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'orcamento':
        return <ShieldAlert className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Função para renderizar o ícone de progresso
  const renderProgressIcon = (status?: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'em_andamento':
        return <Clock9 className="w-5 h-5 text-yellow-500" />;
      case 'nao_iniciado':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  // Função para obter a cor de fundo do card com base no status
  const getCardBgColor = (service: Service) => {
    if (service.status === 'orcamento') {
      return 'bg-blue-50 border-blue-200';
    }
    
    if (service.status === 'nao_pago') {
      return 'bg-red-50 border-red-200';
    }
    
    // Status de conclusão
    if (service.completion_status === 'concluido') {
      return 'bg-green-50 border-green-200';
    }
    
    if (service.completion_status === 'em_andamento') {
      return 'bg-yellow-50 border-yellow-200';
    }
    
    return 'bg-white border-gray-200';
  };

  return (
    <div className="mt-4">
      {/* Barra de filtros */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
          Serviços ({filteredServices.length})
        </h3>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Filter className="w-4 h-4 mr-1" />
          {showFilters ? 'Esconder filtros' : 'Mostrar filtros'}
        </button>
      </div>
      
      {/* Filtros */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filtro de Status Financeiro */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status Financeiro</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    statusFilter === null
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('pago')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    statusFilter === 'pago'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => setStatusFilter('nao_pago')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    statusFilter === 'nao_pago'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  Não Pagos
                </button>
                <button
                  onClick={() => setStatusFilter('orcamento')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    statusFilter === 'orcamento'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  Orçamentos
                </button>
              </div>
            </div>
            
            {/* Filtro de Status de Conclusão */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status do Serviço</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCompletionFilter(null)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    completionFilter === null
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setCompletionFilter('concluido')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    completionFilter === 'concluido'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setCompletionFilter('em_andamento')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    completionFilter === 'em_andamento'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  onClick={() => setCompletionFilter('nao_iniciado')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    completionFilter === 'nao_iniciado'
                      ? 'bg-gray-300 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Não Iniciados
                </button>
              </div>
            </div>
          </div>
          
          {/* Botão para limpar filtros */}
          {(statusFilter !== null || completionFilter !== null) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setStatusFilter(null);
                  setCompletionFilter(null);
                }}
                className="flex items-center text-xs text-red-600 hover:text-red-800"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Lista de serviços */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            Nenhum serviço encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredServices.map(service => (
            <div
              key={service.id}
              className={`rounded-lg border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${getCardBgColor(service)}`}
              onClick={() => onServiceSelect(service)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-gray-900">{service.client_name}</h3>
                <div className="flex space-x-2">
                  {renderStatusIcon(service.status)}
                  {renderProgressIcon(service.completion_status)}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {formatLocalDate(service.service_date)}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Car className="w-4 h-4 mr-2 text-gray-500" />
                  {service.car_model} • {service.car_plate}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                  {formatCurrency(service.service_value)}
                </div>
                
                {/* Exibir nome do serviço */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  {service.service?.name || 
                   (service.catalog_services && service.catalog_services.length > 0 
                    ? <span>{service.catalog_services[0].name}{service.catalog_services.length > 1 ? ` +${service.catalog_services.length - 1}` : ''}</span>
                    : 'Serviço não especificado')}
                </div>
              </div>
              
              {/* Indicador de fotos */}
              {service.photos && service.photos.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  {service.photos.length} {service.photos.length === 1 ? 'foto' : 'fotos'} do veículo
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 