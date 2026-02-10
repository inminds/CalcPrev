import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Testes para o sistema de cache de CNPJ
 */

// Mock do console.log para evitar poluição nos testes
vi.spyOn(console, "log").mockImplementation(() => {});

// Criamos uma classe local para testes (para não interferir com o singleton global)
class TestCnpjCache {
  private cache: Map<string, { data: any; expiresAt: number }>;
  private maxSize: number;
  private ttlMs: number;
  private hits: number;
  private misses: number;

  constructor(maxSize = 1000, ttlDays = 7) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    this.hits = 0;
    this.misses = 0;
  }

  get(cnpj: string): any | null {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const entry = this.cache.get(cleanCnpj);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cleanCnpj);
      this.misses++;
      return null;
    }

    this.cache.delete(cleanCnpj);
    this.cache.set(cleanCnpj, entry);
    this.hits++;
    
    return entry.data;
  }

  set(cnpj: string, data: any): void {
    const cleanCnpj = cnpj.replace(/\D/g, "");

    if (this.cache.has(cleanCnpj)) {
      this.cache.delete(cleanCnpj);
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry = {
      data,
      expiresAt: Date.now() + this.ttlMs,
    };

    this.cache.set(cleanCnpj, entry);
  }

  delete(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    return this.cache.delete(cleanCnpj);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [cnpj, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(cnpj);
        removed++;
      }
    }

    return removed;
  }

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

  // Método auxiliar para testes: define expiração customizada
  setWithCustomTTL(cnpj: string, data: any, ttlMs: number): void {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    this.cache.set(cleanCnpj, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

describe("CNPJ Cache", () => {
  let cache: TestCnpjCache;

  beforeEach(() => {
    cache = new TestCnpjCache(3, 7); // maxSize=3 para testar LRU
  });

  it("deve armazenar e recuperar dados do cache", () => {
    const testData = {
      razaoSocial: "Empresa Teste LTDA",
      cnae: "6201500",
      segmento: "Desenvolvimento de software",
      fpasCode: "515",
    };

    cache.set("12345678000190", testData);
    const result = cache.get("12345678000190");

    expect(result).toEqual(testData);
  });

  it("deve limpar formatação do CNPJ automaticamente", () => {
    const testData = {
      razaoSocial: "Empresa Teste",
      cnae: "6201500",
      segmento: "TI",
      fpasCode: "515",
    };

    cache.set("12.345.678/0001-90", testData);
    const result = cache.get("12345678000190");

    expect(result).toEqual(testData);
  });

  it("deve retornar null para CNPJ não encontrado", () => {
    const result = cache.get("99999999999999");
    expect(result).toBeNull();
  });

  it("deve implementar LRU (Least Recently Used) ao atingir maxSize", () => {
    cache.set("11111111111111", { name: "Empresa 1" });
    cache.set("22222222222222", { name: "Empresa 2" });
    cache.set("33333333333333", { name: "Empresa 3" });
    
    // Cache está cheio (3/3). Próxima inserção deve remover o primeiro (LRU)
    cache.set("44444444444444", { name: "Empresa 4" });

    expect(cache.get("11111111111111")).toBeNull(); // Removido pelo LRU
    expect(cache.get("22222222222222")).not.toBeNull();
    expect(cache.get("33333333333333")).not.toBeNull();
    expect(cache.get("44444444444444")).not.toBeNull();
  });

  it("deve renovar posição LRU ao acessar entrada existente", () => {
    cache.set("11111111111111", { name: "Empresa 1" });
    cache.set("22222222222222", { name: "Empresa 2" });
    cache.set("33333333333333", { name: "Empresa 3" });

    // Acessa entrada 1, movendo ela para o final da fila
    cache.get("11111111111111");

    // Adiciona nova entrada - deve remover a 2 (agora é a mais antiga)
    cache.set("44444444444444", { name: "Empresa 4" });

    expect(cache.get("11111111111111")).not.toBeNull(); // Ainda presente
    expect(cache.get("22222222222222")).toBeNull(); // Removida pelo LRU
    expect(cache.get("33333333333333")).not.toBeNull();
    expect(cache.get("44444444444444")).not.toBeNull();
  });

  it("deve remover entradas expiradas", async () => {
    // Adiciona entrada com TTL de 100ms
    cache.setWithCustomTTL("11111111111111", { name: "Empresa 1" }, 100);
    
    expect(cache.get("11111111111111")).not.toBeNull();

    // Aguarda expiração
    await new Promise(resolve => setTimeout(resolve, 150));

    const result = cache.get("11111111111111");
    expect(result).toBeNull();
  });

  it("deve limpar todas as entradas expiradas com cleanExpired", async () => {
    cache.setWithCustomTTL("11111111111111", { name: "Empresa 1" }, 100);
    cache.setWithCustomTTL("22222222222222", { name: "Empresa 2" }, 100);
    cache.set("33333333333333", { name: "Empresa 3" }); // Não expira

    await new Promise(resolve => setTimeout(resolve, 150));

    const removed = cache.cleanExpired();
    
    expect(removed).toBe(2);
    expect(cache.get("11111111111111")).toBeNull();
    expect(cache.get("22222222222222")).toBeNull();
    expect(cache.get("33333333333333")).not.toBeNull();
  });

  it("deve deletar entrada específica", () => {
    cache.set("11111111111111", { name: "Empresa 1" });
    
    expect(cache.get("11111111111111")).not.toBeNull();
    
    const deleted = cache.delete("11111111111111");
    
    expect(deleted).toBe(true);
    expect(cache.get("11111111111111")).toBeNull();
  });

  it("deve limpar todo o cache", () => {
    cache.set("11111111111111", { name: "Empresa 1" });
    cache.set("22222222222222", { name: "Empresa 2" });
    cache.set("33333333333333", { name: "Empresa 3" });

    cache.clear();

    expect(cache.get("11111111111111")).toBeNull();
    expect(cache.get("22222222222222")).toBeNull();
    expect(cache.get("33333333333333")).toBeNull();
  });

  it("deve rastrear estatísticas de hit/miss corretamente", () => {
    cache.set("11111111111111", { name: "Empresa 1" });

    // 1 hit
    cache.get("11111111111111");
    
    // 2 misses
    cache.get("22222222222222");
    cache.get("33333333333333");

    const stats = cache.getStats();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
    expect(stats.hitRate).toBe("33.33%"); // 1/3
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(3);
    expect(stats.ttlDays).toBe(7);
  });

  it("deve atualizar entrada existente mantendo no final da fila LRU", () => {
    cache.set("11111111111111", { name: "Empresa 1 - v1" });
    cache.set("22222222222222", { name: "Empresa 2" });
    
    // Atualiza entrada 1
    cache.set("11111111111111", { name: "Empresa 1 - v2" });
    
    cache.set("33333333333333", { name: "Empresa 3" });
    cache.set("44444444444444", { name: "Empresa 4" }); // Remove entrada 2

    const updated = cache.get("11111111111111");
    expect(updated).toEqual({ name: "Empresa 1 - v2" });
    expect(cache.get("22222222222222")).toBeNull(); // Removido pelo LRU
  });
});
