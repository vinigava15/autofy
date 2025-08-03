import { supabase } from './supabase';
import { Service, CatalogService } from '../types';

/**
 * Carrega os detalhes de todos os serviços selecionados para um serviço
 * @param service O serviço para carregar os detalhes dos serviços selecionados
 * @returns O serviço com os detalhes dos serviços selecionados carregados
 */
export async function loadServiceDetails(service: Service): Promise<Service> {
  // Se não tiver serviços selecionados, retorna o serviço inalterado
  if (!service.selected_services || !Array.isArray(service.selected_services) || service.selected_services.length === 0) {
    return service;
  }

  try {
    // Carregando detalhes dos serviços selecionados
    
    // Buscar detalhes de todos os serviços selecionados
    const { data: catalogServicesData, error } = await supabase
      .from('catalog_services')
      .select('id, name, value')
      .in('id', service.selected_services);
    
    if (error) {
      // Erro ao buscar detalhes - tratado silenciosamente
      return service;
    }
    
    // Se encontrou os dados, adiciona ao serviço
    if (catalogServicesData && catalogServicesData.length > 0) {
      // Detalhes dos serviços carregados com sucesso
      
      // Ordenar os serviços na mesma ordem que estão em selected_services
      const orderedCatalogServices = service.selected_services.map(serviceId => 
        catalogServicesData.find(cs => cs.id === serviceId)
      ).filter(Boolean) as CatalogService[];
      
      return {
        ...service,
        catalog_services: orderedCatalogServices
      };
    }
    
    return service;
  } catch (err) {
    // Erro ao carregar detalhes - fallback aplicado
    return service;
  }
} 