import { cn } from '../../utils/cn';
import { MiniSparkline } from './MiniSparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface SubMetric {
  label: string;
  value: string | number;
  deltaType?: "positive" | "negative" | "neutral";
}

export interface AnomalyBadge {
  direction: 'up' | 'down';
  pct: number;
  severity: 'amber' | 'red';
}

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  sparklineData?: number[];
  subMetrics?: SubMetric[];
  anomaly?: AnomalyBadge;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "hero" | "glass";
}

export function StatCard({ label, value, delta, deltaType = "neutral", sparklineData, subMetrics, anomaly, onClick, className, variant = "default" }: Props) {
  const isHero = variant === "hero";
  const isGlass = variant === "glass";
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative",
        "rounded-lg border p-4 transition-colors",
        isHero
          ? "bg-[hsl(220,15%,10%)] text-white border-[hsl(220,10%,18%)] dark:bg-[hsl(220,15%,13%)] dark:border-[hsl(220,10%,20%)]"
          : isGlass
            ? "bg-white/[0.04] backdrop-blur-sm border-white/[0.08] rounded-xl hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:border-white/[0.15] gradient-border"
            : "bg-card border-border",
        onClick && "cursor-pointer hover:bg-accent/50",
        className,
      )}
    >
      {anomaly && (
        <span className={cn(
          "absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
          anomaly.severity === 'red'
            ? "bg-red-500/20 text-red-400"
            : "bg-amber-500/20 text-amber-400",
        )}>
          {anomaly.direction === 'up' ? '↑' : '↓'} {anomaly.pct}%
        </span>
      )}
      <p className={cn("text-xs font-medium truncate mb-2", (isHero || isGlass) ? "text-white/60" : "text-muted-foreground")}>{label}</p>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn("text-3xl font-bold", (isHero || isGlass) ? "text-white" : "text-card-foreground")}>{value}</p>
          {delta && (
            <div className="flex items-center gap-1 mt-1">
              {deltaType === "positive" && <TrendingUp size={12} className="text-green-500" />}
              {deltaType === "negative" && <TrendingDown size={12} className="text-red-500" />}
              <span className={cn(
                "text-xs font-medium",
                deltaType === "positive" && "text-green-500",
                deltaType === "negative" && "text-red-500",
                deltaType === "neutral" && "text-muted-foreground",
              )}>
                {delta}
              </span>
            </div>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <div className={cn("w-20 mt-1", isGlass && "sparkline-draw-in")}>
              <MiniSparkline
                data={sparklineData}
                color={deltaType === "negative" ? "#ef4444" : deltaType === "neutral" ? "#f59e0b" : "#22c55e"}
              />
            </div>
          )}
        </div>
        {subMetrics && subMetrics.length > 0 && (
          <div className={cn("border-l pl-3 space-y-1.5 shrink-0", (isHero || isGlass) ? "border-white/20" : "border-border")}>
            {subMetrics.slice(0, 3).map((sm, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="min-w-0">
                  <p className={cn("text-[10px] leading-tight truncate", (isHero || isGlass) ? "text-white/50" : "text-muted-foreground")}>{sm.label}</p>
                  <p className={cn("text-xs font-semibold leading-tight", (isHero || isGlass) ? "text-white" : "text-card-foreground")}>{sm.value}</p>
                </div>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  sm.deltaType === "positive" && "bg-green-500",
                  sm.deltaType === "negative" && "bg-gray-600",
                  (!sm.deltaType || sm.deltaType === "neutral") && "bg-muted-foreground/40",
                )} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
