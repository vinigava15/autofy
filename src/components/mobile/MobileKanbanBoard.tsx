/**
 * Kanban Board otimizado para dispositivos móveis
 * Utiliza tabs para navegar entre status devido ao espaço limitado
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Car, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Edit
} from 'lucide-react';
import { PhotoViewButton } from '../PhotoViewButton';
import { Service, CompletionStatus } from '../../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface MobileKanbanBoardProps {
  services: Service[];
  onBack: () => void;
  onServiceEdit: (service: Service) => void;
  onServicesUpdate: () => void;
}

// Definir as colunas/tabs do Kanban
const kanbanTabs: { id: CompletionStatus; title: string; color: string; icon: React.ReactNode }[] = [
  { 
    id: 'nao_iniciado', 
    title: 'Não Iniciado', 
    color: 'text-gray-600 bg-gray-100 border-gray-300',
    icon: <Clock className="w-4 h-4" />
  },
  { 
    id: 'em_andamento', 
    title: 'Em Andamento', 
    color: 'text-blue-600 bg-blue-100 border-blue-300',
    icon: <AlertCircle className="w-4 h-4" />
  },
  { 
    id: 'concluido', 
    title: 'Concluído', 
    color: 'text-green-600 bg-green-100 border-green-300',
    icon: <CheckCircle2 className="w-4 h-4" />
  }
];

const formatLocalDate = (dateString: string) => {
  const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
  return format(date, 'dd/MM/yyyy', { locale: pt });
};

export const MobileKanbanBoard: React.FC<MobileKanbanBoardProps> = ({
  services,
  onBack,
  onServiceEdit,
  onServicesUpdate
}) => {
  const [activeTab, setActiveTab] = useState<CompletionStatus>('nao_iniciado');
  const [groupedServices, setGroupedServices] = useState<Record<CompletionStatus, Service[]>>({
    nao_iniciado: [],
    em_andamento: [],
    concluido: []
  });

  // Agrupar serviços por status
  useEffect(() => {
    const grouped: Record<CompletionStatus, Service[]> = {
      nao_iniciado: [],
      em_andamento: [],
      concluido: []
    };

    services.forEach(service => {
      const status = service.completion_status || 'nao_iniciado';
      if (grouped[status]) {
        grouped[status].push(service);
      }
    });

    setGroupedServices(grouped);
  }, [services]);

  // Atualizar status do serviço
  const handleStatusChange = async (serviceId: string, newStatus: CompletionStatus) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ completion_status: newStatus })
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      onServicesUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do serviço');
    }
  };

  const currentServices = groupedServices[activeTab] || [];
  const currentTab = kanbanTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Quadro Kanban</h1>
              <p className="text-blue-200 text-sm">
                Gerencie o progresso dos serviços
              </p>
            </div>
          </div>

          {/* Tabs de status */}
          <div className="flex space-x-1 bg-blue-700 bg-opacity-50 rounded-lg p-1">
            {kanbanTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-blue-600'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.title}</span>
                <span className="sm:hidden">{tab.title.split(' ')[0]}</span>
                <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-blue-200'
                }`}>
                  {groupedServices[tab.id]?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo da tab ativa */}
      <div className="p-4">
        {/* Header da seção atual */}
        <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg border ${currentTab?.color}`}>
          {currentTab?.icon}
          <div>
            <h2 className="font-semibold">{currentTab?.title}</h2>
            <p className="text-sm opacity-75">
              {currentServices.length} serviço{currentServices.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Lista de serviços */}
        {currentServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              {currentTab?.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-gray-500">
              Nenhum serviço com status "{currentTab?.title}" encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                {/* Header do card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {service.client_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {service.car_model} - {service.car_plate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <PhotoViewButton
                      serviceId={service.id}
                      serviceName={service.client_name}
                      variant="mobile"
                      className="p-1.5"
                    />
                    <button
                      onClick={() => onServiceEdit(service)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Informações do serviço */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatLocalDate(service.service_date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>R$ {service.service_value?.toFixed(2) || '0,00'}</span>
                  </div>
                </div>

                {/* Botões de mudança de status */}
                <div className="flex space-x-2">
                  {kanbanTabs
                    .filter(tab => tab.id !== service.completion_status)
                    .map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleStatusChange(service.id, tab.id)}
                        className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          tab.id === 'concluido'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : tab.id === 'em_andamento'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {tab.icon}
                        <span>Mover para {tab.title}</span>
                      </button>
                    ))}
                </div>

                {/* Informações do cliente (se expandido) */}
                {service.client_phone && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{service.client_phone}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};