import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationState } from '../../utils/paginationUtils';

interface PaginationProps {
  paginationState: PaginationState;
  onPageChange: (page: number) => void;
  showItemCount?: boolean;
}

/**
 * Componente de paginação reutilizável
 */
export const Pagination: React.FC<PaginationProps> = ({ 
  paginationState, 
  onPageChange,
  showItemCount = true
}) => {
  const { 
    currentPage, 
    hasPrevPage, 
    hasNextPage, 
    visiblePages,
    startIndex,
    endIndex,
    totalItems
  } = paginationState;

  const handlePrevPage = () => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
      {showItemCount && (
        <div className="text-sm text-gray-500 mb-3 sm:mb-0">
          Mostrando {endIndex - startIndex} de {totalItems} itens
        </div>
      )}
      <div className="flex space-x-2">
        <button
          onClick={handlePrevPage}
          disabled={!hasPrevPage}
          className={`p-2 rounded touch-action-button ${
            !hasPrevPage ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
          }`}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-1 overflow-x-auto">
          {visiblePages.map(pageNum => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] h-9 px-3 py-1 rounded touch-action-button ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label={`Ir para página ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNextPage}
          disabled={!hasNextPage}
          className={`p-2 rounded touch-action-button ${
            !hasNextPage ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
          }`}
          aria-label="Próxima página"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 