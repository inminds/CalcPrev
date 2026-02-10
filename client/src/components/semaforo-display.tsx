import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface SemaforoDisplayProps {
  creditoVerde: string | number;
  creditoAmarelo: string | number;
  creditoVermelho: string | number;
  percentualVerde?: number;
  percentualAmarelo?: number;
  percentualVermelho?: number;
  size?: "sm" | "md" | "lg";
}

export function SemaforoDisplay({
  creditoVerde,
  creditoAmarelo,
  creditoVermelho,
  percentualVerde = 0.15,
  percentualAmarelo = 0.35,
  percentualVermelho = 0.50,
  size = "md",
}: SemaforoDisplayProps) {
  const sizeClasses = {
    sm: "p-3 gap-2",
    md: "p-4 gap-3",
    lg: "p-6 gap-4",
  };

  const textSizes = {
    sm: { value: "text-sm font-semibold", percent: "text-xs" },
    md: { value: "text-lg font-bold", percent: "text-sm" },
    lg: { value: "text-2xl font-bold", percent: "text-base" },
  };

  const clampPercent = (value?: number) => Math.max(0, Math.min(1, Number(value) || 0));

  const items = [
    {
      key: "verde",
      label: "Baixo Risco",
      value: creditoVerde,
      percentage: clampPercent(percentualVerde),
      bgColor: "bg-emerald-500 dark:bg-emerald-600",
      textColor: "text-white",
    },
    {
      key: "amarelo",
      label: "Médio Risco",
      value: creditoAmarelo,
      percentage: clampPercent(percentualAmarelo),
      bgColor: "bg-amber-500 dark:bg-amber-600",
      textColor: "text-white",
    },
    {
      key: "vermelho",
      label: "Alto Risco",
      value: creditoVermelho,
      percentage: clampPercent(percentualVermelho),
      bgColor: "bg-red-500 dark:bg-red-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} ${item.textColor} rounded-lg ${sizeClasses[size]} flex flex-col shadow-md transition-transform hover:scale-[1.02] relative overflow-hidden`}
          data-testid={`semaforo-${item.key}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute -inset-x-16 -top-1/2 h-[220%] opacity-25"
              style={{
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 70%)",
                animation: `velocity-sweep 3s ease-in-out infinite`,
                animationDelay: `${index * 0.35}s`,
              }}
            />
          </div>

          <div className="flex flex-col gap-1 relative z-10">
            <span className={textSizes[size].value}>{formatCurrency(item.value)}</span>
            <span className={`${textSizes[size].percent} opacity-90`}>{formatPercentage(item.percentage)}</span>
          </div>

          <div className="relative z-10 mt-3 h-2.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/90 shadow-sm transition-all duration-700 ease-out"
              style={{ width: `${Math.round(item.percentage * 100)}%` }}
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-full border border-white/30"
              style={{
                animation: `needle-pulse 2.6s ease-in-out infinite`,
                animationDelay: `${index * 0.35}s`,
              }}
            />
          </div>

          <div className="relative z-10 mt-4 flex justify-center">
            <div className="relative h-10 w-24 rounded-b-full rounded-t-[999px] border border-white/25 bg-white/10 overflow-hidden">
              <div className="absolute inset-x-3 bottom-2 h-[6px] rounded-full bg-white/20" />
              <div
                className="absolute left-1/2 bottom-[6px] h-8 w-[2px] bg-white shadow-sm origin-bottom transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-50%) rotate(${(-60 + item.percentage * 240).toFixed(1)}deg)` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>

          <span className="sr-only">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
