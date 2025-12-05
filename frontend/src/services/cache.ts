// Cache para dados estruturais (que não mudam frequentemente)
// Produtos, portes, módulos, configurações, etc.

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class StructuralCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // TTL padrão: 5 minutos para dados estruturais
  private defaultTTL = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância singleton
export const structuralCache = new StructuralCache();

// Limpar cache expirado a cada 1 minuto
if (typeof window !== 'undefined') {
  setInterval(() => {
    structuralCache.cleanup();
  }, 60 * 1000);
}

// Chaves de cache padronizadas
export const CacheKeys = {
  MODULOS: 'modulos',
  CONFIGURACOES_APOLICE: 'configuracoes_apolice',
  PRODUTOS: 'produtos',
  PORTES: 'portes',
  DADOS_DINAMICOS: (configuracaoCampoId: string) => `dados_dinamicos_${configuracaoCampoId}`,
} as const;

