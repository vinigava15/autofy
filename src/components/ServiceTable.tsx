import React from 'react';
import { Pencil, Trash2, FileText, DollarSign } from 'lucide-react';
import { Service } from '../types';
import { formatLocalDate } from '../utils/formatters';
import { formatService, getRowClassName } from '../utils/serviceFormatters';
import { PaginationState } from '../utils/paginationUtils';
import { StatusBadge, Pagination } from './ui';

interface ServiceTableProps {
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
 * Componente para a tabela de serviços em telas maiores
 */
export const ServiceTable: React.FC<ServiceTableProps> = ({
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
    <div className="mt-4">
      <div className="responsive-table hidden md:block">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%] sm:w-[13%]">
                Cliente
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] sm:w-[8%]">
                Data
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%] sm:w-[13%]">
                Veículo
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full sm:w-[18%]">
                Serviço
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                Valor
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                Status
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%]">
                Progresso
              </th>
              <th scope="col" className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%] sm:w-[18%]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isEmpty ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Nenhum serviço cadastrado. Clique no botão "Novo" para começar.
                </td>
              </tr>
            ) : (
              services.map((service) => {
                // Obter a classe da linha com base no status
                const rowClass = getRowClassName(service);
                
                return (
                  <tr key={service.id} className={rowClass}>
                    <td className="px-2 py-4 text-sm font-medium text-gray-900 break-words">
                      {service.client_name}
                      <div className="text-xs text-gray-500">Código: {service.auth_code}</div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500 break-words">
                      {formatLocalDate(service.service_date)}
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500 break-words">
                      {service.car_model}
                      <div className="text-xs font-medium">{service.car_plate}</div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500 break-words">
                      {formatService(service)}
                    </td>
                    <td className="px-2 py-4 text-sm font-medium text-gray-900 break-words">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.service_value)}
                    </td>
                    <td className="px-2 py-4 text-sm">
                      <StatusBadge status={service.status} type="status" />
                    </td>
                    <td className="px-2 py-4 text-sm">
                      <StatusBadge status={service.completion_status} type="completion" />
                    </td>
                    <td className="px-2 py-4 text-sm font-medium">
                      <div className="flex justify-end items-center space-x-3 md:space-x-3">
                        {service.status === 'nao_pago' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsPaid(service.id);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center transition-colors touch-action-button my-1"
                            title="Marcar como pago"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>Pagar</span>
                          </button>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onGenerateInvoice(service)}
                            className="bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition-colors touch-action-button my-1"
                            title="Gerar nota fiscal"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => onEdit(service)}
                            className="bg-green-100 p-2 rounded-md hover:bg-green-200 transition-colors touch-action-button my-1"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => onDelete(service.id)}
                            className="bg-red-100 p-2 rounded-md hover:bg-red-200 transition-colors touch-action-button my-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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