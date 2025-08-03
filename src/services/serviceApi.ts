import { supabase } from '../lib/supabase';
import { fetchCatalogServicesByIds } from './catalogService';

/**
 * Buscar o perfil do usuário no Supabase com tratamento robusto de RLS
 */
export const fetchUserProfile = async (userId: string) => {
  if (!userId) return null;
  
  try {
    // Verificar se há uma sessão ativa antes de fazer a consulta
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Se for erro relacionado a RLS/406, retornar dados básicos do usuário
      if (error.code === 'PGRST301' || error.message.includes('406') || error.message.includes('Not Acceptable')) {
        return {
          id: userId,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Usuário',
          company_name: session.user.user_metadata?.company_name || 'Minha Empresa',
          phone: session.user.user_metadata?.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return null;
    }
    
    return data;
  } catch (error) {
    // Em caso de erro crítico, tentar usar dados da sessão
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.id === userId) {
        return {
          id: userId,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Usuário',
          company_name: session.user.user_metadata?.company_name || 'Minha Empresa',
          phone: session.user.user_metadata?.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    } catch {
      // Se tudo falhar, retornar null
    }
    return null;
  }
};

/**
 * Busca os serviços ativos (não concluídos ou não pagos) com JOINs otimizados
 */
export const fetchActiveServices = async (userId: string) => {
  if (!userId) return { services: [], error: 'Usuário não identificado' };
  
  try {
    // Buscar serviços com relacionamentos usando JOINs (otimizado para multi-tenant)
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        catalog_service:catalog_services!service_id(id, name, value),
        vehicle_photos(id, url, description, created_at)
      `)
      .eq('tenant_id', userId)
      .neq('status', 'orcamento')
      .order('service_date', { ascending: false });

    if (servicesError) {
      return { services: [], error: 'Erro ao carregar os serviços' };
    }
    
    // Filtrar no lado do cliente
    const filteredData = (servicesData || []).filter(service => {
      return !(service.status === 'pago' && service.completion_status === 'concluido');
    });

    // Buscar serviços do catálogo selecionados em lote (com cache)
    const allSelectedServiceIds = new Set<string>();
    filteredData.forEach(service => {
      if (service.selected_services && Array.isArray(service.selected_services)) {
        service.selected_services.forEach((id: string) => allSelectedServiceIds.add(id));
      }
    });

    let catalogServicesMap = new Map();
    if (allSelectedServiceIds.size > 0) {
      const catalogData = await fetchCatalogServicesByIds(userId, Array.from(allSelectedServiceIds));
      catalogData.forEach(service => {
        catalogServicesMap.set(service.id, service);
      });
    }
    
    // Processar serviços com dados já carregados
    const processedServices = filteredData.map(service => {
      const catalogServices = service.selected_services 
        ? service.selected_services.map((id: string) => catalogServicesMap.get(id)).filter(Boolean)
        : [];

      // Padronizar formato da data
      let standardizedDate = service.service_date;
      if (standardizedDate && !standardizedDate.includes('T12:00:00')) {
        standardizedDate = `${standardizedDate.split('T')[0]}T12:00:00`;
      }

      return {
        ...service,
        service: service.catalog_service,
        catalog_services: catalogServices,
        auth_code: service.auth_code || `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        service_date: standardizedDate,
        photos: service.vehicle_photos || []
      };
    });
    
    return { services: processedServices, error: null };
    
  } catch (error) {
    return { services: [], error: 'Erro ao carregar os serviços. Por favor, tente novamente.' };
  }
};

/**
 * FUNÇÃO REMOVIDA: enhanceServiceWithRelations
 * Otimizada para usar JOINs na função fetchActiveServices
 * para melhor performance em ambiente multi-tenant
 */

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
      return { success: false, error: 'Erro ao atualizar status do serviço' };
    }

    return { success: true, error: null };
  } catch (error) {
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
      return { success: false, error: 'Erro ao excluir o serviço' };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir o serviço' };
  }
}; 