import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import type { ParentStageCount, Stage } from '../../data/mockData';
import { stageLabels, stageColors } from '../../data/mockData';

interface Props {
  parentStages: ParentStageCount[];
  className?: string;
}

interface HoverInfo {
  stage: Stage;
  left: number;
  count: number;
  overSla: number;
  avgAge: number;
}

export function StageBar({ parentStages, className }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Filter out Intake — only Pre-Lit and Lit
  const filtered = parentStages.filter(ps => ps.parentStage !== "intake");

  // Flatten all substages for proportional sizing
  const allSubstages = filtered.flatMap((ps, groupIdx) =>
    ps.substages.map(sub => ({ ...sub, parentStage: ps.parentStage, groupIdx }))
  );
  const total = allSubstages.reduce((s, sub) => s + sub.count, 0);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, sub: typeof allSubstages[number]) => {
    const segment = e.currentTarget;
    const bar = barRef.current;
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    const segRect = segment.getBoundingClientRect();
    const left = segRect.left - barRect.left + segRect.width / 2;
    setHovered({ stage: sub.stage, left, count: sub.count, overSla: sub.overSla, avgAge: sub.avgAge });
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Positioning context for tooltip */}
      <div className="relative" ref={barRef}>
        {/* Stacked bar with sub-stage segments */}
        <div className="flex h-14 rounded-lg overflow-hidden border border-border">
          {allSubstages.map((sub, i) => {
            const pct = total > 0 ? (sub.count / total) * 100 : 0;
            if (pct < 0.5) return null;

            const prevGroup = i > 0 ? allSubstages[i - 1]?.groupIdx : sub.groupIdx;
            const isGroupBoundary = sub.groupIdx !== prevGroup;

            return (
              <div
                key={sub.stage}
                className={cn(
                  "flex flex-col items-center justify-center text-[10px] font-medium text-white cursor-pointer transition-opacity",
                  stageColors[sub.stage],
                  hovered && hovered.stage !== sub.stage && "opacity-70",
                  isGroupBoundary && "border-l-[3px] border-white",
                )}
                style={{ width: `${pct}%` }}
                onClick={() => navigate(`/stage/${sub.stage}`)}
                onMouseEnter={(e) => handleMouseEnter(e, sub)}
                onMouseLeave={() => setHovered(null)}
              >
                {pct > 5 && (
                  <>
                    <span className="truncate max-w-full px-1 leading-tight">
                      {stageLabels[sub.stage].replace("Treatment Monitoring", "Treat Mon").replace("Account Opening", "Acct Open").replace("Value Development", "Val Dev").replace("Demand Readiness", "Dem Ready").replace("Resolution Pending", "Res Pend").replace("Case Opening", "Case Open").replace("Expert & Deposition", "Exp & Dep").replace("Arbitration/Mediation", "Arb/Med")}
                    </span>
                    <span className="font-bold text-xs">{sub.count}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Tooltip rendered outside overflow-hidden container */}
        {hovered && (
          <div
            className="absolute bottom-full mb-2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 text-left whitespace-nowrap pointer-events-none -translate-x-1/2"
            style={{ left: hovered.left }}
          >
            <p className="text-xs font-semibold text-foreground">{stageLabels[hovered.stage]}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Cases: <span className="text-foreground font-medium">{hovered.count}</span></p>
            <p className="text-[11px] text-muted-foreground">Over SLA: <span className="text-red-500 font-medium">{hovered.overSla}</span></p>
            <p className="text-[11px] text-muted-foreground">Avg Age: <span className="text-foreground font-medium">{hovered.avgAge}d</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
