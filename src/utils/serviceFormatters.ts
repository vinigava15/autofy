import { Service } from '../types';

/**
 * Formata um serviço para exibição na interface
 */
export const formatService = (service: Service): string => {
  // Verificar se temos uma lista de serviços selecionados
  if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
    // Se tivermos catalog_services (resultado de JOIN)
    if (service.catalog_services && Array.isArray(service.catalog_services)) {
      return service.catalog_services.map((s: any) => s.name).join(', ');
    }
    
    // Caso tenhamos serviços em um campo services
    if (service.services && Array.isArray(service.services)) {
      return service.services.map((s: any) => s.name).join(', ');
    }
    
    // Se tivermos apenas os IDs dos serviços e o service com o nome
    if (service.service?.name) {
      return `${service.service.name}${service.selected_services.length > 1 ? ' e mais...' : ''}`;
    }
  }

  // Se o serviço do catálogo estiver disponível, mostrar o nome (formato antigo)
  if (service.service?.name) {
    return service.service.name;
  }
  
  // Mantendo o código para compatibilidade com dados antigos (peças reparadas)
  if (!(service as any).repaired_parts) return '-';
  
  // Se não for um array, tenta converter para array se possível
  let partsArray: string[] = [];
  
  if (Array.isArray((service as any).repaired_parts)) {
    partsArray = (service as any).repaired_parts;
  } else if (typeof (service as any).repaired_parts === 'string') {
    partsArray = [(service as any).repaired_parts];
  } else if (typeof (service as any).repaired_parts === 'object') {
    try {
      // Tenta extrair valores se for um objeto
      const values = Object.values((service as any).repaired_parts).filter(Boolean);
      partsArray = values.map(val => String(val));
    } catch (e) {
      return '-';
    }
  } else {
    return '-';
  }
  
  const formattedParts = partsArray
    .filter(part => part !== null && part !== undefined)
    .map(part => {
      const partStr = String(part).trim();
      if (!partStr) return '';
      return partStr.charAt(0).toUpperCase() + partStr.slice(1).toLowerCase();
    })
    .filter(part => part !== '');
  
  return formattedParts.length > 0 ? formattedParts.join(', ') : '-';
};

/**
 * Interface para o Objeto Badge de Status
 */
export interface StatusBadge {
  className: string;
  text: string;
}

/**
 * Gera dados para badge de status de pagamento
 */
export const getStatusBadge = (status?: string): StatusBadge => {
  if (!status) {
    return {
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      text: 'Indefinido'
    };
  }
  
  switch (status) {
    case 'pago':
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        text: 'Pago'
      };
    case 'nao_pago':
      return {
        className: 'bg-red-100 text-red-800 border-red-200',
        text: 'Não Pago'
      };
    case 'orcamento':
      return {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Orçamento'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        text: status
      };
  }
};

/**
 * Gera dados para badge de status de conclusão
 */
export const getCompletionBadge = (status?: string): StatusBadge => {
  if (!status) {
    return {
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      text: 'Indefinido'
    };
  }
  
  switch (status) {
    case 'concluido':
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        text: 'Concluído'
      };
    case 'em_andamento':
      return {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Em Andamento'
      };
    case 'nao_iniciado':
      return {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'Não Iniciado'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        text: status
      };
  }
};

/**
 * Gera a classe CSS para a linha da tabela com base no status do serviço
 */
export const getRowClassName = (service: Service): string => {
  let rowClass = "hover:bg-gray-50 transition-colors";
  
  if (service.status === 'orcamento') {
    rowClass = "bg-blue-50 hover:bg-blue-100 transition-colors";
  } else if (service.status === 'nao_pago') {
    rowClass = "bg-red-50 hover:bg-red-100 transition-colors";
  }
  
  return rowClass;
}; 