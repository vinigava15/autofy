import { Pencil, Trash2, FileText, DollarSign } from 'lucide-react';
import { Service } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatLocalDate } from '../../utils/formatters';
import { PhotoViewButton } from '../PhotoViewButton';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onGenerateInvoice: (service: Service) => void;
  formatService: (service: Service) => string;
}

/**
 * Componente de cartão para exibição de serviços em dispositivos móveis
 */
export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onGenerateInvoice,
  formatService
}: ServiceCardProps) => {
  return (
    <div className={`responsive-card mb-4 ${
      service.status === 'pago' 
        ? 'border-l-4 border-l-green-500' 
        : service.status === 'nao_pago' 
        ? 'border-l-4 border-l-red-500' 
        : service.status === 'orcamento'
        ? 'border-l-4 border-l-blue-500'
        : ''
    }`}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Cliente</h3>
          <p className="mt-1">{service.client_name}</p>
          <p className="text-xs text-gray-500">Código: {service.auth_code}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Data</h3>
          <p className="mt-1">{formatLocalDate(service.service_date)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Veículo</h3>
          <p className="mt-1">{service.car_model}</p>
          <p className="text-xs font-medium">{service.car_plate}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Valor</h3>
          <p className="mt-1 font-semibold text-gray-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.service_value)}
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Serviço</h3>
        <p className="mt-1 text-gray-700">{formatService(service)}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Status</h3>
          <div className="mt-1">
            <StatusBadge status={service.status} type="status" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Progresso</h3>
          <div className="mt-1">
            <StatusBadge status={service.completion_status} type="completion" />
          </div>
        </div>
      </div>
      
      <div className="mt-5 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ações</h3>
        <div className="flex flex-wrap gap-2">
          {service.status === 'nao_pago' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsPaid(service.id);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center transition-colors"
              title="Marcar como pago"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              <span>Pagar</span>
            </button>
          )}
          <button
            onClick={() => onGenerateInvoice(service)}
            className="bg-blue-100 p-3 rounded-md hover:bg-blue-200 transition-colors flex items-center"
            title="Gerar nota fiscal"
          >
            <FileText className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-blue-600">PDF</span>
          </button>
          <button
            onClick={() => onEdit(service)}
            className="bg-green-100 p-3 rounded-md hover:bg-green-200 transition-colors flex items-center"
            title="Editar"
          >
            <Pencil className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-600">Editar</span>
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="bg-red-100 p-3 rounded-md hover:bg-red-200 transition-colors flex items-center"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-600">Excluir</span>
          </button>
          <PhotoViewButton
            serviceId={service.id}
            serviceName={service.client_name}
            variant="desktop"
            showText={true}
            className="p-3 flex items-center"
          />
        </div>
      </div>
    </div>
  );
}; 