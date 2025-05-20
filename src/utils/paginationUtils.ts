/**
 * Interface para configurações de paginação
 */
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Interface para um estado de paginação
 */
export interface PaginationState extends PaginationConfig {
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  visiblePages: number[];
  startIndex: number;
  endIndex: number;
}

/**
 * Calcula o estado completo da paginação com base na configuração
 */
export const getPaginationState = (config: PaginationConfig): PaginationState => {
  const { currentPage, itemsPerPage, totalItems } = config;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  // Índices para slice dos dados
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Gerar o array de páginas visíveis (max 5 páginas)
  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);
  
  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    visiblePages,
    startIndex,
    endIndex
  };
};

/**
 * Gera um array das páginas que devem ser mostradas na navegação
 * Exibe no máximo 5 páginas, centradas na página atual quando possível
 */
export const getVisiblePageNumbers = (currentPage: number, totalPages: number): number[] => {
  // Se temos 5 páginas ou menos, mostramos todas
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // Caso contrário, calculamos quais páginas mostrar
  if (currentPage <= 3) {
    // Nas primeiras páginas, mostramos [1, 2, 3, 4, 5]
    return [1, 2, 3, 4, 5];
  } else if (currentPage >= totalPages - 2) {
    // Nas últimas páginas, mostramos as 5 últimas
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ];
  } else {
    // No meio, centralizamos no atual
    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2
    ];
  }
};

/**
 * Obtém uma página de itens da lista completa
 */
export const getPaginatedItems = <T>(items: T[], config: PaginationConfig): T[] => {
  const { startIndex, endIndex } = getPaginationState(config);
  return items.slice(startIndex, endIndex);
}; 