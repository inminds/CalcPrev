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
    sm: { label: "text-xs", value: "text-sm font-semibold", percent: "text-xs" },
    md: { label: "text-sm", value: "text-lg font-bold", percent: "text-sm" },
    lg: { label: "text-base", value: "text-2xl font-bold", percent: "text-base" },
  };

  const items = [
    {
      label: "Baixo Risco",
      value: creditoVerde,
      percentage: percentualVerde,
      bgColor: "bg-emerald-500 dark:bg-emerald-600",
      textColor: "text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Médio Risco",
      value: creditoAmarelo,
      percentage: percentualAmarelo,
      bgColor: "bg-amber-500 dark:bg-amber-600",
      textColor: "text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: "Alto Risco",
      value: creditoVermelho,
      percentage: percentualVermelho,
      bgColor: "bg-red-500 dark:bg-red-600",
      textColor: "text-white",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} ${item.textColor} rounded-lg ${sizeClasses[size]} flex flex-col shadow-md transition-transform hover:scale-[1.02]`}
          data-testid={`semaforo-${item.label.toLowerCase().replace(" ", "-")}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {item.icon}
            <span className={textSizes[size].label}>{item.label}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={textSizes[size].value}>
              {formatCurrency(item.value)}
            </span>
            <span className={`${textSizes[size].percent} opacity-90`}>
              {formatPercentage(item.percentage)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
