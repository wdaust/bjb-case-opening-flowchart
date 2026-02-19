import { cn } from '../../utils/cn';
import { MiniSparkline } from './MiniSparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, delta, deltaType = "neutral", sparklineData, onClick, className }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
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
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 shrink-0">
            <MiniSparkline
              data={sparklineData}
              color={deltaType === "negative" ? "#ef4444" : "#10b981"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
