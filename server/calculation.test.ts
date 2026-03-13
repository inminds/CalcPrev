import { describe, it, expect } from 'vitest';
import { calculatePrevidenciario } from './calculation';

const baseParams = {
  id: '1',
  salarioMinimo: '1621.00',
  percentualCredito: '0.20',
  percentualVerde: '0.15',
  percentualAmarelo: '0.35',
  percentualVermelho: '0.50',
  mesesProjecao: 65,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fpas515 = { id: '1', code: '515', descricao: 'Comércio Atacadista', aliquotaTerceiros: '0.058', createdAt: new Date(), updatedAt: new Date() } as any;

describe('calculatePrevidenciario', () => {
  it('calculates correctly for non-desonerada company (CPP 20% + RAT 2% + FPAS)', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: false,
      fpas: fpas515,
      params: baseParams,
    });

    const baseFolha = 1621 * 50;
    const aliquotaTotal = 0.058 + 0.02 + 0.20;
    const impostoMensal = baseFolha * aliquotaTotal;
    const creditoMensal = impostoMensal * 0.20;
    const totalProjetado = creditoMensal * 65;

    expect(result.baseFolha).toBe(baseFolha.toFixed(2));
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0.02).toFixed(4));
    expect(result.aliquotaCpp).toBe((0.20).toFixed(4));
    expect(result.impostoMensalEstimado).toBe(impostoMensal.toFixed(2));
    expect(result.totalProjetado).toBe(creditoMensal.toFixed(2));
    expect(result.creditoEstimadoTotal).toBe(totalProjetado.toFixed(2));
  });

  it('calculates correctly for desonerada company (RAT 2% + FPAS, no CPP)', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: true,
      fpas: fpas515,
      params: baseParams,
    });

    const baseFolha = 1621 * 50;
    const aliquotaTotal = 0.058 + 0.02;
    const impostoMensal = baseFolha * aliquotaTotal;
    const creditoMensal = impostoMensal * 0.20;
    const totalProjetado = creditoMensal * 65;

    expect(result.baseFolha).toBe(baseFolha.toFixed(2));
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0.02).toFixed(4));
    expect(result.aliquotaCpp).toBe((0).toFixed(4));
    expect(result.impostoMensalEstimado).toBe(impostoMensal.toFixed(2));
    expect(result.totalProjetado).toBe(creditoMensal.toFixed(2));
    expect(result.creditoEstimadoTotal).toBe(totalProjetado.toFixed(2));
  });

  it('matches spreadsheet values for desonerada=Sim (7.8% total)', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: true,
      fpas: fpas515,
      params: baseParams,
    });

    expect(result.baseFolha).toBe('81050.00');
    expect(result.impostoMensalEstimado).toBe('6321.90');
    expect(result.totalProjetado).toBe('1264.38');
    expect(result.creditoEstimadoTotal).toBe('82184.70');
  });

  it('matches spreadsheet values for desonerada=Não (27.8% total)', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: false,
      fpas: fpas515,
      params: baseParams,
    });

    expect(result.baseFolha).toBe('81050.00');
    expect(result.impostoMensalEstimado).toBe('22531.90');
    expect(result.totalProjetado).toBe('4506.38');
    expect(result.creditoEstimadoTotal).toBe('292914.70');
  });

  it('distributes semaforo correctly', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: true,
      fpas: fpas515,
      params: baseParams,
    });

    const verde = parseFloat(result.creditoVerde);
    const amarelo = parseFloat(result.creditoAmarelo);
    const vermelho = parseFloat(result.creditoVermelho);
    const total = parseFloat(result.creditoEstimadoTotal);

    expect(verde / total).toBeCloseTo(0.15, 2);
    expect(amarelo / total).toBeCloseTo(0.35, 2);
    expect(vermelho / total).toBeCloseTo(0.50, 2);
  });
});
