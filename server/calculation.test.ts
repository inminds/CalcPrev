import { describe, it, expect } from 'vitest';
import { calculatePrevidenciario } from './calculation';
import type { CalculationParams, Fpas } from '@shared/schema';

const baseParams: CalculationParams = {
  id: '1',
  salarioMinimo: '1621.00',
  percentualCredito: '0.28',
  percentualCreditoDesonerada: '0.76',
  percentualVerde: '0.15',
  percentualAmarelo: '0.35',
  percentualVermelho: '0.50',
  mesesProjecao: 65,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fpas515: Fpas = { id: '1', code: '515', descricao: 'Comércio Atacadista', aliquotaTerceiros: '0.058', createdAt: new Date(), updatedAt: new Date() };

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
    const creditoMensal = impostoMensal * 0.28;
    const totalProjetado = creditoMensal * 65;

    expect(result.baseFolha).toBe(baseFolha.toFixed(2));
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0.02).toFixed(4));
    expect(result.aliquotaCpp).toBe((0.20).toFixed(4));
    expect(result.impostoMensalEstimado).toBe(impostoMensal.toFixed(2));
    expect(result.totalProjetado).toBe(creditoMensal.toFixed(2));
    expect(result.creditoEstimadoTotal).toBe(totalProjetado.toFixed(2));
  });

  it('calculates correctly for desonerada company using 76% credit rate', () => {
    const result = calculatePrevidenciario({
      colaboradores: 50,
      isDesonerada: true,
      fpas: fpas515,
      params: baseParams,
    });

    const baseFolha = 1621 * 50;
    const aliquotaTotal = 0.058 + 0.02;
    const impostoMensal = baseFolha * aliquotaTotal;
    const creditoMensal = impostoMensal * 0.76;
    const totalProjetado = creditoMensal * 65;

    expect(result.baseFolha).toBe(baseFolha.toFixed(2));
    expect(result.aliquotaFpas).toBe((0.058).toFixed(4));
    expect(result.aliquotaRat).toBe((0.02).toFixed(4));
    expect(result.aliquotaCpp).toBe((0).toFixed(4));
    expect(result.impostoMensalEstimado).toBe(impostoMensal.toFixed(2));
    expect(result.totalProjetado).toBe(creditoMensal.toFixed(2));
    expect(result.creditoEstimadoTotal).toBe(totalProjetado.toFixed(2));
  });

  it('matches spreadsheet for desonerada=Não (8623 colaboradores, 27.8%)', () => {
    const params8623: CalculationParams = { ...baseParams, salarioMinimo: '1621.00' };
    const result = calculatePrevidenciario({
      colaboradores: 8623,
      isDesonerada: false,
      fpas: fpas515,
      params: params8623,
    });

    expect(result.baseFolha).toBe('13977883.00');
    expect(result.impostoMensalEstimado).toBe('3885851.47');
    expect(result.totalProjetado).toBe('1088038.41');
    expect(result.creditoEstimadoTotal).toBe('70722496.83');
  });

  it('matches spreadsheet for desonerada=Sim (8623 colaboradores, 7.8%)', () => {
    const params8623: CalculationParams = { ...baseParams, salarioMinimo: '1621.00' };
    const result = calculatePrevidenciario({
      colaboradores: 8623,
      isDesonerada: true,
      fpas: fpas515,
      params: params8623,
    });

    expect(result.baseFolha).toBe('13977883.00');
    expect(result.impostoMensalEstimado).toBe('1090274.87');
    expect(result.totalProjetado).toBe('828608.90');
    expect(result.creditoEstimadoTotal).toBe('53859578.78');
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
