import { supabase } from '../lib/supabase';

/**
 * Buscar o perfil do usuário no Supabase
 */
export const fetchUserProfile = async (userId: string) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
};

/**
 * Busca os serviços ativos (não concluídos ou não pagos)
 */
export const fetchActiveServices = async (userId: string) => {
  if (!userId) return { services: [], error: 'Usuário não identificado' };
  
  try {
    // Buscar todos os serviços, excluindo apenas orçamentos
    // Filtragem adicional será feita no lado do cliente para evitar problemas com consultas complexas
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', userId)
      .neq('status', 'orcamento') // Não buscar orçamentos
      .order('service_date', { ascending: false });

    if (servicesError) {
      console.error('Erro detalhado ao buscar serviços:', servicesError);
      return { services: [], error: 'Erro ao carregar os serviços' };
    }
    
    // Filtrar no lado do cliente: não mostrar serviços que são pagos E concluídos simultaneamente
    const filteredData = (servicesData || []).filter(service => {
      // Mostrar o serviço se ele NÃO for (pago E concluído) ao mesmo tempo
      return !(service.status === 'pago' && service.completion_status === 'concluido');
    });
    
    // Array para armazenar os serviços processados
    const processedServices = [];
    
    // Para cada serviço, buscar informações adicionais
    for (const service of filteredData) {
      const enhancedService = await enhanceServiceWithRelations(service, userId);
      processedServices.push(enhancedService);
    }
    
    return { services: processedServices, error: null };
    
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return { services: [], error: 'Erro ao carregar os serviços. Por favor, tente novamente.' };
  }
};

/**
 * Adiciona informações relacionadas ao serviço
 */
export const enhanceServiceWithRelations = async (service: any, userId: string) => {
  let catalogService = null;
  let catalogServices: any[] = [];
  let photos: any[] = [];
  
  // Buscar o serviço do catálogo correspondente, se existir
  if (service.service_id) {
    const { data: catalogData, error: catalogError } = await supabase
      .from('catalog_services')
      .select('id, name, value')
      .eq('id', service.service_id)
      .single();
      
    if (!catalogError && catalogData) {
      catalogService = catalogData;
    }
  }
  
  // Buscar todos os serviços do catálogo selecionados, se houver
  if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
    const { data: catalogData, error: catalogError } = await supabase
      .from('catalog_services')
      .select('id, name, value')
      .in('id', service.selected_services);
      
    if (!catalogError && catalogData) {
      catalogServices = catalogData;
    }
  }
  
  // Buscar fotos do veículo, se houver
  const { data: photosData, error: photosError } = await supabase
    .from('vehicle_photos')
    .select('id, url, description, created_at')
    .eq('service_id', service.id)
    .eq('tenant_id', userId);
    
  if (!photosError && photosData) {
    photos = photosData;
  }
  
  // Padronizar o formato da data para evitar problemas de fuso horário
  let standardizedDate = service.service_date;
  
  // Se a data não tiver o horário fixado em 12:00, ajuste para o formato padronizado
  if (standardizedDate && !standardizedDate.includes('T12:00:00')) {
    standardizedDate = `${standardizedDate.split('T')[0]}T12:00:00`;
  }

  // Garantir que auth_code seja uma string válida
  const authCode = service.auth_code || `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Adicionar o serviço processado ao array
  return {
    ...service,
    service: catalogService,
    catalog_services: catalogServices,
    auth_code: authCode,
    service_date: standardizedDate,
    photos: photos
  };
};

/**
 * Atualiza o status de pagamento do serviço
 */
export const markServiceAsPaid = async (serviceId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('services')
      .update({ 
        status: 'pago',
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .eq('tenant_id', userId);

    if (error) {
      console.error('Erro ao atualizar status do serviço:', error);
      return { success: false, error: 'Erro ao atualizar status do serviço' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao atualizar status do serviço:', error);
    return { success: false, error: 'Erro ao atualizar status do serviço' };
  }
};

/**
 * Exclui um serviço
 */
export const deleteService = async (serviceId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('tenant_id', userId);

    if (error) {
      console.error('Erro detalhado ao excluir serviço:', error);
      return { success: false, error: 'Erro ao excluir o serviço' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    return { success: false, error: 'Erro ao excluir o serviço' };
  }
}; 