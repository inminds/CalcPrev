import { formatCurrency } from "@/lib/formatters";
import { useCallback, useEffect, useRef, useState } from "react";

interface SemaforoDisplayProps {
  creditoVerde: string | number;
  creditoAmarelo: string | number;
  creditoVermelho: string | number;
  percentualVerde?: number;
  percentualAmarelo?: number;
  percentualVermelho?: number;
}

function useAnimatedValue(target: number, duration: number, active: boolean) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setCurrent(0);
      return;
    }

    startValueRef.current = 0;
    startTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValueRef.current + (target - startValueRef.current) * eased;
      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return current;
}

function SpeedometerGauge({
  value,
  percentage,
  label,
  color,
  glowColor,
  delay,
  isVisible,
}: {
  value: string | number;
  percentage: number;
  label: string;
  color: string;
  glowColor: string;
  delay: number;
  isVisible: boolean;
}) {
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setAnimationStarted(false);
      return;
    }
    const timer = setTimeout(() => setAnimationStarted(true), delay);
    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  const animatedPercentage = useAnimatedValue(
    animationStarted ? percentage : 0,
    3000,
    animationStarted
  );

  const cx = 100;
  const cy = 100;
  const radius = 72;
  const startAngle = -135;
  const endAngle = 135;
  const totalSweep = endAngle - startAngle;

  const tickMarks = [];
  const numMajorTicks = 11;
  const numMinorTicks = 50;

  for (let i = 0; i <= numMinorTicks; i++) {
    const angle = startAngle + (i / numMinorTicks) * totalSweep;
    const rad = (angle * Math.PI) / 180;
    const isMajor = i % (numMinorTicks / (numMajorTicks - 1)) === 0;
    const innerR = isMajor ? radius - 12 : radius - 7;
    const outerR = radius - 2;
    tickMarks.push(
      <line
        key={`tick-${i}`}
        x1={cx + innerR * Math.cos(rad)}
        y1={cy + innerR * Math.sin(rad)}
        x2={cx + outerR * Math.cos(rad)}
        y2={cy + outerR * Math.sin(rad)}
        stroke="currentColor"
        strokeOpacity={isMajor ? 0.6 : 0.25}
        strokeWidth={isMajor ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  const arcPath = (startA: number, endA: number, r: number) => {
    const s = (startA * Math.PI) / 180;
    const e = (endA * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + animatedPercentage * totalSweep;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 18;
  const needleTipX = cx + needleLength * Math.cos(needleRad);
  const needleTipY = cy + needleLength * Math.sin(needleRad);

  const filledEndAngle = startAngle + animatedPercentage * totalSweep;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          width="200"
          height="170"
          viewBox="0 0 200 170"
          className="drop-shadow-lg"
        >
          <defs>
            <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={glowColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <path
            d={arcPath(startAngle, endAngle, radius)}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {animatedPercentage > 0.001 && (
            <path
              d={arcPath(startAngle, filledEndAngle, radius)}
              fill="none"
              stroke={`url(#grad-${label})`}
              strokeWidth="8"
              strokeLinecap="round"
              filter={`url(#glow-${label})`}
            />
          )}

          <g className="text-muted-foreground">{tickMarks}</g>

          <line
            x1={cx}
            y1={cy}
            x2={needleTipX}
            y2={needleTipY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="7" fill={color} />
          <circle cx={cx} cy={cy} r="3.5" fill="white" opacity="0.9" />

          <circle
            cx={cx}
            cy={cy}
            r={radius + 4}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </svg>

        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 70%, ${glowColor}, transparent 70%)`,
            animation: isVisible ? `rpm-pulse 2s ease-in-out infinite` : "none",
            animationDelay: `${delay}ms`,
          }}
        />
      </div>

      <div className="flex flex-col items-center text-center mt-2">
        <span className="text-2xl font-bold tracking-tight" data-testid={`value-${label}`}>
          {formatCurrency(value)}
        </span>
      </div>
    </div>
  );
}

export function SemaforoDisplay({
  creditoVerde,
  creditoAmarelo,
  creditoVermelho,
  percentualVerde = 0.15,
  percentualAmarelo = 0.35,
  percentualVermelho = 0.50,
}: SemaforoDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => setIsVisible(true), 200);
          observer.disconnect();
        }
      },
      { threshold: [0.5, 0.75, 1.0] }
    );

    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const clampPercent = (value?: number) => Math.max(0, Math.min(1, Number(value) || 0));

  const gauges = [
    {
      key: "verde",
      label: "Verde",
      value: creditoVerde,
      percentage: clampPercent(percentualVerde),
      color: "#10b981",
      glowColor: "#34d399",
    },
    {
      key: "amarelo",
      label: "Amarelo",
      value: creditoAmarelo,
      percentage: clampPercent(percentualAmarelo),
      color: "#f59e0b",
      glowColor: "#fbbf24",
    },
    {
      key: "vermelho",
      label: "Vermelho",
      value: creditoVermelho,
      percentage: clampPercent(percentualVermelho),
      color: "#ef4444",
      glowColor: "#f87171",
    },
  ];

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {gauges.map((gauge, index) => (
          <div
            key={gauge.key}
            className="flex flex-col items-center rounded-lg p-4 bg-muted/30 dark:bg-muted/10"
            data-testid={`semaforo-${gauge.key}`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: gauge.color, boxShadow: `0 0 8px ${gauge.glowColor}` }}
              />
              <span className="text-sm font-medium text-muted-foreground" data-testid={`text-risk-label-${gauge.key}`}>{gauge.label}</span>
            </div>

            <SpeedometerGauge
              value={gauge.value}
              percentage={gauge.percentage}
              label={gauge.key}
              color={gauge.color}
              glowColor={gauge.glowColor}
              delay={index * 400}
              isVisible={isVisible}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rpm-pulse {
          0%, 100% { opacity: 0.15; transform: scale(0.95); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
