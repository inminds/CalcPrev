import { useState } from "react";
import { CalculatorForm } from "@/components/calculator-form";
import { SimulationResultDisplay } from "@/components/simulation-result";
import { PublicLayout } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n";
import type { SimulationResult } from "@shared/schema";
import { Shield, Clock, FileText } from "lucide-react";

export default function Home() {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const { tx } = useI18n();

  const handleSimulationSuccess = (result: SimulationResult) => {
    setSimulationResult(result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewSimulation = () => {
    setSimulationResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PublicLayout>
      {!simulationResult && (
        <section className="relative py-12 md:py-16 bg-muted">
          <div className="mx-auto w-full max-w-6xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {tx("Descubra o Potencial de Credito", "Discover Your Credit Potential")}
              <br />
              <span className="text-primary">
                {tx("da Sua Empresa", "for Your Company")}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {tx(
                "Faca sua pre-analise gratuita e estime oportunidades de recuperacao de credito previdenciario de forma rapida e confiavel.",
                "Get your free pre-analysis and estimate social security credit recovery opportunities quickly and reliably."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border card-elevated">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{tx("Seguro", "Secure")}</h3>
                <p className="text-sm text-muted-foreground">
                  {tx("Seus dados protegidos", "Your data protected")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border card-elevated">
                <Clock className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{tx("Rapido", "Fast")}</h3>
                <p className="text-sm text-muted-foreground">
                  {tx("Resultado em segundos", "Results in seconds")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border card-elevated">
                <FileText className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{tx("PDF Completo", "Complete PDF")}</h3>
                <p className="text-sm text-muted-foreground">
                  {tx("Diagnostico detalhado", "Detailed diagnostic")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        {simulationResult ? (
          <SimulationResultDisplay
            result={simulationResult}
            onNewSimulation={handleNewSimulation}
          />
        ) : (
          <CalculatorForm onSuccess={handleSimulationSuccess} />
        )}
      </div>
    </PublicLayout>
  );
}
