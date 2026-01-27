import { useState } from "react";
import { CalculatorForm } from "@/components/calculator-form";
import { SimulationResultDisplay } from "@/components/simulation-result";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SimulationResult } from "@shared/schema";
import { Calculator, Shield, Clock, FileText } from "lucide-react";

export default function Home() {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleSimulationSuccess = (result: SimulationResult) => {
    setSimulationResult(result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewSimulation = () => {
    setSimulationResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Machado Schutz</h1>
              <p className="text-xs text-muted-foreground">Calculadora Previdenciária</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      {!simulationResult && (
        <section className="relative py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Descubra o Potencial de Crédito
              <br />
              <span className="text-primary">da Sua Empresa</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Faça sua pré-análise gratuita e estime oportunidades de recuperação
              de crédito previdenciário de forma rápida e confiável.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Seguro</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados protegidos
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                <Clock className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  Resultado em segundos
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
                <FileText className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">PDF Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Diagnóstico detalhado
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {simulationResult ? (
          <SimulationResultDisplay
            result={simulationResult}
            onNewSimulation={handleNewSimulation}
          />
        ) : (
          <CalculatorForm onSuccess={handleSimulationSuccess} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Machado Schutz Advogados - Calculadora Previdenciária V1
          </p>
          <p>
            Os cálculos apresentados têm caráter estimativo e não vinculante.
          </p>
        </div>
      </footer>
    </div>
  );
}
