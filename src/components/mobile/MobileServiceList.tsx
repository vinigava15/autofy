/**
 * Lista de serviços otimizada para dispositivos móveis
 * Design responsivo com cards compactos e navegação intuitiva
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Car, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  Phone,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { PhotoViewButton } from '../PhotoViewButton';
import { Service } from '../../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MobileServiceListProps {
  services: Service[];
  onBack: () => void;
  onServiceEdit: (service: Service) => void;
  onServiceDelete: (id: string) => void;
  onGenerateInvoice: (service: Service) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const formatLocalDate = (dateString: string) => {
  const date = new Date(`${dateString.split('T')[0]}T12:00:00Z`);
  return format(date, 'dd/MM/yyyy', { locale: pt });
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pago':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'Pago'
      };
    case 'nao_pago':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'Não Pago'
      };
    case 'orcamento':
      return {
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'Orçamento'
      };
    default:
      return {
        icon: AlertCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'N/A'
      };
  }
};

export const MobileServiceList: React.FC<MobileServiceListProps> = ({
  services,
  onBack,
  onServiceEdit,
  onServiceDelete,
  onGenerateInvoice,
  searchTerm,
  onSearchChange
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filteredServices = services.filter(service => 
    service.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.car_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.car_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardToggle = (serviceId: string) => {
    setExpandedCard(expandedCard === serviceId ? null : serviceId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Lista de Serviços</h1>
              <p className="text-blue-200 text-sm">
                {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
            <input
              type="text"
              placeholder="Buscar por cliente, placa ou modelo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-blue-700 bg-opacity-50 text-white placeholder-blue-300 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Lista de serviços */}
      <div className="p-4 space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Cadastre o primeiro serviço para começar'}
            </p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const statusInfo = getStatusInfo(service.status || 'orcamento');
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedCard === service.id;

            return (
              <div
                key={service.id}
                className={`bg-white rounded-lg shadow-sm border ${statusInfo.border} overflow-hidden`}
              >
                {/* Card principal */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleCardToggle(service.id)}
                >
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
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusInfo.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatLocalDate(service.service_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>R$ {service.service_value?.toFixed(2) || '0,00'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {isExpanded ? 'Tocar para recolher' : 'Tocar para expandir'}
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-4 space-y-3">
                      {/* Informações do cliente */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Informações do Cliente
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{service.client_name}</span>
                          </div>
                          {service.client_phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{service.client_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Serviços realizados */}
                      {service.selected_services && service.selected_services.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Serviços Realizados
                          </h4>
                          <div className="space-y-1">
                            {service.selected_services.map((serviceId, index) => (
                              <div key={index} className="text-sm text-gray-600 pl-2 border-l-2 border-blue-200">
                                Serviço #{serviceId}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="space-y-2 pt-2">
                        {/* Primeira linha de ações */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onServiceEdit(service);
                            }}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onGenerateInvoice(service);
                            }}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Nota</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Tem certeza que deseja excluir este serviço?')) {
                                onServiceDelete(service.id);
                              }
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Segunda linha - Botão de fotos (apenas se houver fotos) */}
                        <div className="flex justify-center">
                          <PhotoViewButton
                            serviceId={service.id}
                            serviceName={service.client_name}
                            variant="mobile"
                            showText={true}
                            className="px-4 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};