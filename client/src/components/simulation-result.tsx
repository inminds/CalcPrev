import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SemaforoDisplay } from "@/components/semaforo-display";
import { formatCurrency, formatCNPJ } from "@/lib/formatters";
import { Download, ArrowLeft, Building2, Calculator, TrendingUp, Gauge } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SimulationResult, Fpas } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface SimulationResultProps {
  result: SimulationResult;
  onNewSimulation: () => void;
}

export function SimulationResultDisplay({ result, onNewSimulation }: SimulationResultProps) {
  const { simulation, companySnapshot } = result;
  const { data: fpasOptions } = useQuery<Fpas[]>({ queryKey: ["/api/fpas"] });
  const { tx } = useI18n();

  const fpasDescricao = fpasOptions?.find((item) => item.code === companySnapshot.fpasCode)?.descricao;
  const fpasDisplay = fpasDescricao ? `${companySnapshot.fpasCode} - ${fpasDescricao}` : companySnapshot.fpasCode;
  const baseLabel = companySnapshot.baseInputType === "folha" ? tx("Valor médio da folha", "Average payroll") : tx("Colaboradores", "Employees");
  const baseValue = companySnapshot.baseInputType === "folha"
    ? formatCurrency(simulation.folhaMedia || companySnapshot.folhaMedia || simulation.baseFolha)
    : companySnapshot.colaboradores;

  const totalCredito = [simulation.creditoVerde, simulation.creditoAmarelo, simulation.creditoVermelho]
    .map((v) => Number(v) || 0)
    .reduce((acc, v) => acc + v, 0);

  const percentualVerde = totalCredito ? Number(simulation.creditoVerde) / totalCredito : 0;
  const percentualAmarelo = totalCredito ? Number(simulation.creditoAmarelo) / totalCredito : 0;
  const percentualVermelho = totalCredito ? Number(simulation.creditoVermelho) / totalCredito : 0;

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/simulations/${simulation.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diagnostico-previdenciario-${companySnapshot.cnpj}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {tx("Diagnóstico Previdenciário", "Social Security Diagnosis")}
          </CardTitle>
          <CardDescription>
            {tx("Resultado da sua pre-análise de crédito", "Your credit pre-analysis result")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Building2 className="h-4 w-4" />
              <span>{tx("Dados da Empresa", "Company Data")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{tx("CNPJ:", "CNPJ (Tax ID):")}</span>
                <span className="ml-2 font-medium" data-testid="text-cnpj">
                  {formatCNPJ(companySnapshot.cnpj)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{tx("Razão Social:", "Company Name:")}</span>
                <span className="ml-2 font-medium" data-testid="text-razao-social">
                  {companySnapshot.razaoSocial}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{tx("RAT:", "RAT:")} </span>
                <Badge variant="outline" className="ml-1" data-testid="badge-rat">
                  {(parseFloat(simulation.aliquotaRat) * 100).toFixed(0)}%
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{tx("Desonerada:", "Tax-exempt:")}</span>
                <Badge
                  variant={companySnapshot.isDesonerada ? "default" : "secondary"}
                  className="ml-2"
                  data-testid="badge-desonerada"
                >
                  {companySnapshot.isDesonerada ? tx("Sim", "Yes") : tx("Não", "No")}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{tx("Segmento:", "Segment:")}</span>
                <span className="ml-2 font-medium" data-testid="text-segmento">
                  {companySnapshot.segmento}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{baseLabel}:</span>
                <span className="ml-2 font-medium" data-testid="text-base-calculo">
                  {baseValue}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Calculation Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Calculator className="h-4 w-4" />
              <span>{tx("Resumo do Cálculo", "Calculation Summary")}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">{tx("Base Estimada da Folha", "Payroll Base")}</div>
                  <div className="text-xl font-bold" data-testid="value-base-folha">
                    {formatCurrency(simulation.baseFolha)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">{tx("Imposto Mensal Estimado", "Estimated Monthly Tax")}</div>
                  <div className="text-xl font-bold" data-testid="value-imposto-mensal">
                    {formatCurrency(simulation.impostoMensalEstimado)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">{tx("Crédito Estimado Mensal", "Monthly Estimated Credit")}</div>
                  <div className="text-xl font-bold" data-testid="value-total-projetado">
                    {formatCurrency(simulation.totalProjetado)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="text-sm opacity-90">{tx(`Total Crédito Projetado (${simulation.mesesProjetados} meses)`, `Total Projected Credit (${simulation.mesesProjetados} months)`)}</div>
                  <div className="text-2xl font-bold" data-testid="value-credito-total">
                    {formatCurrency(simulation.creditoEstimadoTotal)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Painel de Velocímetros */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Gauge className="h-5 w-5" />
              <span className="text-lg">{tx("Crédito Projetado por Nível de Classificação", "Project Credit by Classification Level")}</span>
            </div>
            <SemaforoDisplay
              creditoVerde={simulation.creditoVerde}
              creditoAmarelo={simulation.creditoAmarelo}
              creditoVermelho={simulation.creditoVermelho}
              percentualVerde={percentualVerde}
              percentualAmarelo={percentualAmarelo}
              percentualVermelho={percentualVermelho}
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground border-l-4 border-l-amber-500">
            <p className="font-medium text-foreground mb-1">{tx("Aviso Legal", "Legal Disclaimer")}</p>
            <p>
              {tx(
                "Os valores apresentados são estimativas baseadas nos parâmetros informados e tem caráter meramente ilustrativo. Os cálculos não constituem garantia de recuperação de crédito e estão sujeitos a análise técnica e jurídica detalhada. Para uma avaliação precisa, entre em contato com nossa equipe.",
                "The values presented are estimates based on the provided parameters and are for illustrative purposes only. The calculations do not constitute a guarantee of credit recovery and are subject to detailed technical and legal analysis. For an accurate assessment, please contact our team."
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onNewSimulation}
              data-testid="button-new-simulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tx("Nova Simulação", "New Simulation")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownloadPdf}
              data-testid="button-download-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              {tx("Baixar PDF do Diagnóstico", "Download Diagnosis PDF")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
