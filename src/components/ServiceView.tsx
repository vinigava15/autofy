import React from 'react';
import { Service } from '../types';
import { ServiceTable } from './ServiceTable';
import { ServiceList } from './ServiceList';
import { PaginationState } from '../utils/paginationUtils';

interface ServiceViewProps {
  services: Service[];
  paginationState: PaginationState;
  onPageChange: (page: number) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onGenerateInvoice: (service: Service) => void;
  isLoading?: boolean;
  error?: string | null;
  viewMode: 'table' | 'kanban';
}

/**
 * Componente principal para visualização de serviços, adaptando-se ao dispositivo e modo de visualização
 */
export const ServiceView: React.FC<ServiceViewProps> = ({
  services,
  paginationState,
  onPageChange,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onGenerateInvoice,
  isLoading = false,
  error = null,
  viewMode
}) => {
  // Se estiver no modo Kanban, não renderizar esse componente
  if (viewMode === 'kanban') {
    return null;
  }

  return (
    <>
      {/* Tabela para telas médias e grandes */}
      <ServiceTable
        services={services}
        paginationState={paginationState}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkAsPaid={onMarkAsPaid}
        onGenerateInvoice={onGenerateInvoice}
        isLoading={isLoading}
        error={error}
      />

      {/* Lista para dispositivos móveis */}
      <ServiceList
        services={services}
        paginationState={paginationState}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkAsPaid={onMarkAsPaid}
        onGenerateInvoice={onGenerateInvoice}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}; 