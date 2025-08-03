/**
 * Catalog Service - Serviço otimizado para gerenciar catálogo de serviços
 * Implementa cache para melhor performance em multi-tenancy
 */

import { supabase } from '../lib/supabase';
import { cacheManager } from '../lib/cacheManager';

export interface CatalogService {
  id: string;
  name: string;
  value: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

const CATALOG_CACHE_KEY = 'catalog_services';
const CATALOG_TTL = 10 * 60 * 1000; // 10 minutos

/**
 * Busca todos os serviços do catálogo do tenant com cache
 */
export const fetchCatalogServices = async (tenantId: string): Promise<CatalogService[]> => {
  if (!tenantId) return [];

  // Verificar cache primeiro
  const cachedData = cacheManager.get<CatalogService[]>(tenantId, CATALOG_CACHE_KEY);
  if (cachedData) {
    return cachedData;
  }

  try {
    const { data, error } = await supabase
      .from('catalog_services')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;

    const catalogServices = data || [];
    
    // Armazenar no cache
    cacheManager.set(tenantId, CATALOG_CACHE_KEY, catalogServices, CATALOG_TTL);
    
    return catalogServices;
  } catch (error) {
    return [];
  }
};

/**
 * Tipo simplificado para consultas de catálogo por IDs
 */
export interface CatalogServiceBasic {
  id: string;
  name: string;
  value: number;
}

/**
 * Busca serviços específicos do catálogo por IDs
 */
export const fetchCatalogServicesByIds = async (
  tenantId: string, 
  serviceIds: string[]
): Promise<CatalogServiceBasic[]> => {
  if (!tenantId || !serviceIds.length) return [];

  // Verificar cache primeiro
  const cacheKey = `catalog_services_${serviceIds.sort().join(',')}`;
  const cachedData = cacheManager.get<CatalogServiceBasic[]>(tenantId, cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const { data, error } = await supabase
      .from('catalog_services')
      .select('id, name, value')
      .eq('tenant_id', tenantId)
      .in('id', serviceIds);

    if (error) throw error;

    const services = data || [];
    
    // Cache por menos tempo para consultas específicas
    cacheManager.set(tenantId, cacheKey, services, 5 * 60 * 1000);
    
    return services;
  } catch (error) {
    return [];
  }
};

/**
 * Cria um novo serviço no catálogo
 */
export const createCatalogService = async (
  tenantId: string,
  serviceData: Omit<CatalogService, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: CatalogService; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('catalog_services')
      .insert({
        ...serviceData,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidar cache do catálogo
    cacheManager.delete(tenantId, CATALOG_CACHE_KEY);
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro ao criar serviço no catálogo'
    };
  }
};

/**
 * Atualiza serviço do catálogo
 */
export const updateCatalogService = async (
  tenantId: string,
  serviceId: string,
  updates: Partial<Pick<CatalogService, 'name' | 'value'>>
): Promise<{ success: boolean; data?: CatalogService; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('catalog_services')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // Invalidar cache
    cacheManager.delete(tenantId, CATALOG_CACHE_KEY);
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro ao atualizar serviço do catálogo'
    };
  }
};

/**
 * Exclui serviço do catálogo
 */
export const deleteCatalogService = async (
  tenantId: string,
  serviceId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('catalog_services')
      .delete()
      .eq('id', serviceId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // Invalidar cache
    cacheManager.delete(tenantId, CATALOG_CACHE_KEY);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: 'Erro ao excluir serviço do catálogo'
    };
  }
};

/**
 * Verifica se um serviço está sendo usado
 */
export const checkServiceUsage = async (
  tenantId: string,
  serviceId: string
): Promise<{ isUsed: boolean; count: number }> => {
  try {
    const { count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .or(`service_id.eq.${serviceId},selected_services.cs.{${serviceId}}`);

    if (error) throw error;

    return { 
      isUsed: (count || 0) > 0, 
      count: count || 0 
    };
  } catch (error) {
    return { isUsed: false, count: 0 };
  }
};