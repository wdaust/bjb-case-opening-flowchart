import { cn } from '../../utils/cn';
import { agingBands, stageLabels, type Stage, type AgingBand } from '../../data/mockData';

interface Props {
  data: Record<Stage, Record<AgingBand, number>>;
  stages?: Stage[];
  className?: string;
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return "bg-muted/30";
  const ratio = count / Math.max(max, 1);
  if (ratio > 0.6) return "bg-red-500/80 text-white";
  if (ratio > 0.3) return "bg-amber-500/60 text-white";
  if (ratio > 0.1) return "bg-emerald-500/40";
  return "bg-emerald-500/20";
}

export function AgingHeatmap({ data, stages, className }: Props) {
  const displayStages = stages || (Object.keys(data) as Stage[]);
  const allCounts = displayStages.flatMap(s => agingBands.map(b => data[s]?.[b] || 0));
  const max = Math.max(...allCounts, 1);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Stage</th>
            {agingBands.map(band => (
              <th key={band} className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">{band}</th>
            ))}
            <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {displayStages.map(stage => {
            const row = data[stage] || {};
            const total = agingBands.reduce((s, b) => s + (row[b] || 0), 0);
            return (
              <tr key={stage} className="border-t border-border">
                <td className="py-2 px-3 text-xs font-medium text-foreground whitespace-nowrap">
                  {stageLabels[stage] || stage}
                </td>
                {agingBands.map(band => {
                  const count = row[band] || 0;
                  return (
                    <td key={band} className="py-1 px-1 text-center">
                      <div className={cn(
                        "rounded px-2 py-1 text-xs font-medium mx-auto min-w-[36px]",
                        getIntensity(count, max),
                      )}>
                        {count}
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center text-xs font-bold text-foreground">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
