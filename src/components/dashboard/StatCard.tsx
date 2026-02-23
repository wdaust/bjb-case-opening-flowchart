import { cn } from '../../utils/cn';
import { MiniSparkline } from './MiniSparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface SubMetric {
  label: string;
  value: string | number;
  deltaType?: "positive" | "negative" | "neutral";
}

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  sparklineData?: number[];
  subMetrics?: SubMetric[];
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, delta, deltaType = "neutral", sparklineData, subMetrics, onClick, className }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50",
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground truncate mb-2">{label}</p>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {delta && (
            <div className="flex items-center gap-1 mt-1">
              {deltaType === "positive" && <TrendingUp size={12} className="text-emerald-500" />}
              {deltaType === "negative" && <TrendingDown size={12} className="text-red-500" />}
              <span className={cn(
                "text-xs font-medium",
                deltaType === "positive" && "text-emerald-500",
                deltaType === "negative" && "text-red-500",
                deltaType === "neutral" && "text-muted-foreground",
              )}>
                {delta}
              </span>
            </div>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <div className="w-20 mt-1">
              <MiniSparkline
                data={sparklineData}
                color={deltaType === "negative" ? "#ef4444" : "#10b981"}
              />
            </div>
          )}
        </div>
        {subMetrics && subMetrics.length > 0 && (
          <div className="border-l border-border pl-3 space-y-1.5 shrink-0">
            {subMetrics.slice(0, 3).map((sm, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">{sm.label}</p>
                  <p className="text-xs font-semibold text-card-foreground leading-tight">{sm.value}</p>
                </div>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  sm.deltaType === "positive" && "bg-emerald-500",
                  sm.deltaType === "negative" && "bg-red-500",
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
