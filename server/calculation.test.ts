import { describe, it, expect } from 'vitest';
import { calculatePrevidenciario } from './calculation';

const baseParams = {
  id: '1',
  salarioMinimo: '1412.00',
  percentualCredito: '0.20',
  percentualVerde: '0.15',
  percentualAmarelo: '0.35',
  percentualVermelho: '0.50',
  mesesProjecao: 65,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fpas507 = { id: '1', code: '507', descricao: 'Indústria', aliquotaTerceiros: '0.058', createdAt: new Date(), updatedAt: new Date() } as any;

describe('calculatePrevidenciario', () => {
  it('calculates correctly for non-desonerada company', () => {
    const result = calculatePrevidenciario({
      colaboradores: 10,
      isDesonerada: false,
      fpas: fpas507,
      params: baseParams,
    });

    expect(result.baseFolha).toBe((1412 * 10).toFixed(2));
    // aliquota total = 0.058 + 0.03 = 0.088
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0.03).toFixed(4));
    expect(result.impostoMensalEstimado).toBe((14120 * 0.088).toFixed(2));
    expect(result.totalProjetado).toBe((14120 * 0.088 * 65).toFixed(2));
    expect(result.creditoEstimadoTotal).toBe((14120 * 0.088 * 65 * 0.2).toFixed(2));
  });

  it('calculates correctly for desonerada company (aliquotaRat = 0)', () => {
    const result = calculatePrevidenciario({
      colaboradores: 5,
      isDesonerada: true,
      fpas: fpas507,
      params: baseParams,
    });

    const baseFolha = 1412 * 5;
    expect(result.baseFolha).toBe(baseFolha.toFixed(2));
    // aliquota total = 0.058 + 0
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0).toFixed(4));
    expect(result.impostoMensalEstimado).toBe((baseFolha * 0.058).toFixed(2));
    expect(result.totalProjetado).toBe((baseFolha * 0.058 * 65).toFixed(2));
    expect(result.creditoEstimadoTotal).toBe((baseFolha * 0.058 * 65 * 0.2).toFixed(2));
  });
});
