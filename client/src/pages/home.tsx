import { useEffect, useState } from "react";
import { CalculatorForm } from "@/components/calculator-form";
import { SimulationResultDisplay } from "@/components/simulation-result";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SimulationResult } from "@shared/schema";
import { Shield, Clock, FileText } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Home() {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setResolvedTheme(isDark ? "dark" : "light");
  }, [theme]);

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
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              <img
                src="/logo-light.png"
                alt="Machado Schütz"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-primary-foreground">Machado Schütz</h1>
              <p className="text-xs text-primary-foreground/80">Calculadora Previdenciária</p>
            </div>
          </div>
          <ThemeToggle className="text-primary-foreground hover:bg-white/10" />
        </div>
      </header>

      {/* Hero Section */}
      {!simulationResult && (
        <section className="relative py-12 md:py-16 bg-muted">
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
      <footer className="bg-primary py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-primary-foreground">
          <p className="font-medium mb-2">
            Machado Schütz Advogados - Calculadora Previdenciária V1
          </p>
          <p className="opacity-80">
            Os cálculos apresentados têm caráter estimativo e não vinculante.
          </p>
        </div>
      </footer>
    </div>
  );
}
