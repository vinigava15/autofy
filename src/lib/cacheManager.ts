/**
 * Cache Manager - Sistema de cache otimizado para multi-tenancy
 * Gerencia cache de dados por tenant para melhor performance
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Gera chave de cache única por tenant
   */
  private generateKey(tenantId: string, key: string): string {
    return `${tenantId}:${key}`;
  }

  /**
   * Verifica se entrada do cache é válida
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Armazena dados no cache
   */
  set<T>(tenantId: string, key: string, data: T, ttl?: number): void {
    const cacheKey = this.generateKey(tenantId, key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  /**
   * Recupera dados do cache
   */
  get<T>(tenantId: string, key: string): T | null {
    const cacheKey = this.generateKey(tenantId, key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    if (!this.isValid(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Remove entrada específica do cache
   */
  delete(tenantId: string, key: string): void {
    const cacheKey = this.generateKey(tenantId, key);
    this.cache.delete(cacheKey);
  }

  /**
   * Remove todos os dados de um tenant
   */
  clearTenant(tenantId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpa cache expirado
   */
  cleanup(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
    };
  }
}

// Instância singleton do cache manager
export const cacheManager = new CacheManager();

// Limpar cache expirado a cada 10 minutos
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);