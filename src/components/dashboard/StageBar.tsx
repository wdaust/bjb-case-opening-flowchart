import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import type { ParentStageCount } from '../../data/mockData';
import { stageLabels, stageColors } from '../../data/mockData';

interface Props {
  parentStages: ParentStageCount[];
  className?: string;
}

export function StageBar({ parentStages, className }: Props) {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Filter out Intake — only Pre-Lit and Lit
  const filtered = parentStages.filter(ps => ps.parentStage !== "intake");

  // Flatten all substages for proportional sizing
  const allSubstages = filtered.flatMap((ps, groupIdx) =>
    ps.substages.map(sub => ({ ...sub, parentStage: ps.parentStage, groupIdx }))
  );
  const total = allSubstages.reduce((s, sub) => s + sub.count, 0);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Stacked bar with sub-stage segments */}
      <div className="flex h-14 rounded-lg overflow-hidden border border-border relative">
        {allSubstages.map((sub, i) => {
          const pct = total > 0 ? (sub.count / total) * 100 : 0;
          if (pct < 0.5) return null;

          // Add a visual separator between parent groups
          const prevGroup = i > 0 ? allSubstages[i - 1]?.groupIdx : sub.groupIdx;
          const isGroupBoundary = sub.groupIdx !== prevGroup;

          return (
            <div
              key={sub.stage}
              className={cn(
                "flex flex-col items-center justify-center text-[10px] font-medium text-white cursor-pointer transition-opacity relative",
                stageColors[sub.stage],
                hoveredStage && hoveredStage !== sub.stage && "opacity-70",
                isGroupBoundary && "border-l-[3px] border-white",
              )}
              style={{ width: `${pct}%` }}
              onClick={() => navigate(`/stage/${sub.stage}`)}
              onMouseEnter={() => setHoveredStage(sub.stage)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {pct > 5 && (
                <>
                  <span className="truncate max-w-full px-1 leading-tight">
                    {stageLabels[sub.stage].replace("Treatment Monitoring", "Treat Mon").replace("Account Opening", "Acct Open").replace("Value Development", "Val Dev").replace("Demand Readiness", "Dem Ready").replace("Resolution Pending", "Res Pend").replace("Case Opening", "Case Open").replace("Expert & Deposition", "Exp & Dep").replace("Arbitration/Mediation", "Arb/Med")}
                  </span>
                  <span className="font-bold text-xs">{sub.count}</span>
                </>
              )}

              {/* Tooltip */}
              {hoveredStage === sub.stage && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 text-left whitespace-nowrap pointer-events-none">
                  <p className="text-xs font-semibold text-foreground">{stageLabels[sub.stage]}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Cases: <span className="text-foreground font-medium">{sub.count}</span></p>
                  <p className="text-[11px] text-muted-foreground">Over SLA: <span className="text-red-500 font-medium">{sub.overSla}</span></p>
                  <p className="text-[11px] text-muted-foreground">Avg Age: <span className="text-foreground font-medium">{sub.avgAge}d</span></p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact inline legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        {filtered.map((ps, groupIdx) => (
          <div key={ps.parentStage} className="contents">
            {groupIdx > 0 && (
              <div className="w-px h-4 bg-border mx-1" />
            )}
            {ps.substages.map(sub => (
              <div
                key={sub.stage}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/stage/${sub.stage}`)}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", stageColors[sub.stage])} />
                <span className="text-[10px] text-muted-foreground">{stageLabels[sub.stage]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
