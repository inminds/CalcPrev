/**
 * Sistema de cache em memória para consultas de CNPJ
 * Implementa estratégia LRU (Least Recently Used) com TTL (Time To Live)
 */

export interface CnpjData {
  razaoSocial: string;
  cnae: string;
  segmento: string;
  fpasCode: string;
}

interface CacheEntry {
  data: CnpjData;
  expiresAt: number;
}

class CnpjCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttlMs: number;
  private hits: number;
  private misses: number;

  constructor(maxSize = 1000, ttlDays = 7) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlDays * 24 * 60 * 60 * 1000; // dias -> milissegundos
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Busca dados do cache
   * @returns Dados se válidos, null se não encontrado ou expirado
   */
  get(cnpj: string): CnpjData | null {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const entry = this.cache.get(cleanCnpj);

    if (!entry) {
      this.misses++;
      console.log(`[CNPJ Cache] MISS - ${cleanCnpj} (hits: ${this.hits}, misses: ${this.misses})`);
      return null;
    }

    // Verifica se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cleanCnpj);
      this.misses++;
      console.log(`[CNPJ Cache] EXPIRED - ${cleanCnpj} (hits: ${this.hits}, misses: ${this.misses})`);
      return null;
    }

    // Cache hit - move para o final (LRU)
    this.cache.delete(cleanCnpj);
    this.cache.set(cleanCnpj, entry);
    this.hits++;
    console.log(`[CNPJ Cache] HIT - ${cleanCnpj} (hits: ${this.hits}, misses: ${this.misses})`);
    
    return entry.data;
  }

  /**
   * Armazena dados no cache
   */
  set(cnpj: string, data: CnpjData): void {
    const cleanCnpj = cnpj.replace(/\D/g, "");

    // Remove entrada antiga se existir
    if (this.cache.has(cleanCnpj)) {
      this.cache.delete(cleanCnpj);
    }

    // Implementa LRU - remove a entrada mais antiga se atingir limite
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        console.log(`[CNPJ Cache] LRU eviction - ${firstKey} (size: ${this.cache.size})`);
      }
    }

    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + this.ttlMs,
    };

    this.cache.set(cleanCnpj, entry);
    console.log(`[CNPJ Cache] SET - ${cleanCnpj} (size: ${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Remove uma entrada específica do cache
   */
  delete(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const deleted = this.cache.delete(cleanCnpj);
    if (deleted) {
      console.log(`[CNPJ Cache] DELETE - ${cleanCnpj}`);
    }
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log(`[CNPJ Cache] CLEAR - removed ${size} entries`);
  }

  /**
   * Remove todas as entradas expiradas
   */
  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [cnpj, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(cnpj);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[CNPJ Cache] CLEANUP - removed ${removed} expired entries`);
    }

    return removed;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + "%",
      ttlDays: this.ttlMs / (24 * 60 * 60 * 1000),
    };
  }
}

// Instância singleton do cache
// maxSize: 1000 CNPJs, TTL: 7 dias
export const cnpjCache = new CnpjCache(1000, 7);

// Limpeza periódica de entradas expiradas (1x por hora)
setInterval(() => {
  cnpjCache.cleanExpired();
}, 60 * 60 * 1000);
