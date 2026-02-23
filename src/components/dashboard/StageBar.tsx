import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import type { ParentStage, ParentStageCount } from '../../data/mockData';
import { stageLabels, stageColors } from '../../data/mockData';

const parentColors: Record<ParentStage, string> = {
  intake: "bg-blue-500",
  "pre-lit": "bg-emerald-500",
  lit: "bg-red-500",
};

interface Props {
  parentStages: ParentStageCount[];
  className?: string;
}

export function StageBar({ parentStages, className }: Props) {
  const navigate = useNavigate();

  // Filter out Intake — only Pre-Lit and Lit
  const filtered = parentStages.filter(ps => ps.parentStage !== "intake");
  const total = filtered.reduce((s, ps) => s + ps.count, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Parent bar — 2 segments (Pre-Lit + Lit only) */}
      <div className="flex h-10 rounded-lg overflow-hidden border border-border">
        {filtered.map(ps => {
          const pct = total > 0 ? (ps.count / total) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={ps.parentStage}
              className={cn(
                "flex items-center justify-center text-xs font-medium text-white transition-all",
                parentColors[ps.parentStage],
              )}
              style={{ width: `${pct}%` }}
              title={`${ps.label}: ${ps.count} cases`}
            >
              {pct > 8 && (
                <span>{ps.label} ({ps.count})</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sub-stage cards inline under each parent segment */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(ps => (
          <div key={ps.parentStage} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-sm shrink-0", parentColors[ps.parentStage])} />
              <p className="text-xs font-semibold text-foreground">{ps.label}</p>
              <span className="text-xs text-muted-foreground">({ps.count})</span>
              {ps.overSla > 0 && (
                <span className="text-[10px] text-red-500">{ps.overSla} over SLA</span>
              )}
            </div>
            {ps.substages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {ps.substages.map(sub => (
                  <div
                    key={sub.stage}
                    onClick={() => navigate(`/stage/${sub.stage}`)}
                    className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", stageColors[sub.stage])} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">{stageLabels[sub.stage]}</p>
                      <p className="text-sm font-bold text-foreground">{sub.count}</p>
                      {sub.overSla > 0 && (
                        <p className="text-[10px] text-red-500">{sub.overSla} over SLA</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
