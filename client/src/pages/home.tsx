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
          <section className="relative pt-6 pb-3 md:pt-8 md:pb-4 bg-muted">
          <div className="mx-auto w-full max-w-6xl px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              {tx("Descubra o Potencial de Crédito", "Discover Your Credit Potential")}
              <br />
              <span className="text-primary">
                {tx("da Sua Folha", "for Your Company")}
              </span>
            </h2>

            <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-6">
              {tx(
                "Faca sua pre-analise gratuita e estime oportunidades de recuperacao de credito previdenciario de forma rapida e confiavel.",
                "Get your free pre-analysis and estimate social security credit recovery opportunities quickly and reliably."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="p-4 rounded-xl bg-card border border-border card-elevated">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {tx("Seguro", "Secure")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {tx("Seus dados protegidos", "Your data protected")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border card-elevated">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {tx("Rapido", "Fast")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {tx("Resultado em segundos", "Results in seconds")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border card-elevated">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {tx("PDF Completo", "Complete PDF")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {tx("Estimativa Prévia", "Previous Estimate")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 md:pt-6 md:pb-10">
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
