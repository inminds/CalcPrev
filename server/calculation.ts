import type { CalculationParams, Fpas } from "@shared/schema";

export interface CalculationInput {
  colaboradores: number;
  isDesonerada: boolean;
  fpas: Fpas;
  params: CalculationParams;
  baseInputType?: "colaboradores" | "folha";
  folhaMedia?: number;
}

export interface CalculationResult {
  baseFolha: string;
  aliquotaFpas: string;
  aliquotaRat: string;
  mesesProjetados: number;
  impostoMensalEstimado: string;
  totalProjetado: string;
  creditoEstimadoTotal: string;
  creditoVerde: string;
  creditoAmarelo: string;
  creditoVermelho: string;
}

export function calculatePrevidenciario(input: CalculationInput): CalculationResult {
  const { colaboradores, isDesonerada, fpas, params, baseInputType = "colaboradores", folhaMedia } = input;

  const salarioMinimo = parseFloat(params.salarioMinimo);
  const percentualCredito = parseFloat(params.percentualCredito);
  const percentualVerde = parseFloat(params.percentualVerde);
  const percentualAmarelo = parseFloat(params.percentualAmarelo);
  const percentualVermelho = parseFloat(params.percentualVermelho);
  const mesesProjecao = params.mesesProjecao;

  const aliquotaTerceiros = parseFloat(fpas.aliquotaTerceiros);
  const aliquotaRat = isDesonerada ? 0 : 0.03;

  const baseFolha = baseInputType === "folha" && typeof folhaMedia === "number"
    ? folhaMedia
    : salarioMinimo * colaboradores;

  const aliquotaTotal = aliquotaTerceiros + aliquotaRat;
  const impostoMensalEstimado = baseFolha * aliquotaTotal;

  const creditoEstimadoMensal = impostoMensalEstimado * percentualCredito;

  const totalCreditoProjetado = creditoEstimadoMensal * mesesProjecao;

  const creditoVerde = totalCreditoProjetado * percentualVerde;
  const creditoAmarelo = totalCreditoProjetado * percentualAmarelo;
  const creditoVermelho = totalCreditoProjetado * percentualVermelho;

  return {
    baseFolha: baseFolha.toFixed(2),
    aliquotaFpas: aliquotaTerceiros.toFixed(4),
    aliquotaRat: aliquotaRat.toFixed(4),
    mesesProjetados: mesesProjecao,
    impostoMensalEstimado: impostoMensalEstimado.toFixed(2),
    totalProjetado: creditoEstimadoMensal.toFixed(2),
    creditoEstimadoTotal: totalCreditoProjetado.toFixed(2),
    creditoVerde: creditoVerde.toFixed(2),
    creditoAmarelo: creditoAmarelo.toFixed(2),
    creditoVermelho: creditoVermelho.toFixed(2),
  };
}
