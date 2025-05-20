import React from 'react';
import { Service } from '../types';
import { ServiceCard } from './ui/ServiceCard';
import { Pagination } from './ui';
import { PaginationState } from '../utils/paginationUtils';
import { formatService } from '../utils/serviceFormatters';

interface ServiceListProps {
  services: Service[];
  paginationState: PaginationState;
  onPageChange: (page: number) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onGenerateInvoice: (service: Service) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Componente para listar serviços em formato de cartões para dispositivos móveis
 */
export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  paginationState,
  onPageChange,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onGenerateInvoice,
  isLoading = false,
  error = null
}) => {
  const isEmpty = services.length === 0 && !isLoading && !error;

  return (
    <div className="md:hidden">
      {isEmpty ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
          Nenhum serviço cadastrado. Clique no botão "Novo" para começar.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkAsPaid={onMarkAsPaid}
              onGenerateInvoice={onGenerateInvoice}
              formatService={formatService}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {paginationState.totalItems > paginationState.itemsPerPage && (
        <Pagination 
          paginationState={paginationState} 
          onPageChange={onPageChange} 
        />
      )}
    </div>
  );
}; 