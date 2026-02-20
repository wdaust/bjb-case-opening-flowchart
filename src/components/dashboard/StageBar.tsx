import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';
import type { ParentStage, ParentStageCount } from '../../data/mockData';
import { stageLabels, stageColors, substagesOf } from '../../data/mockData';

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
  const [expandedParent, setExpandedParent] = useState<ParentStage | null>(null);
  const total = parentStages.reduce((s, ps) => s + ps.count, 0);

  const expanded = expandedParent
    ? parentStages.find(ps => ps.parentStage === expandedParent)
    : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Parent bar — 3 segments */}
      <div className="flex h-10 rounded-lg overflow-hidden border border-border">
        {parentStages.map(ps => {
          const pct = total > 0 ? (ps.count / total) * 100 : 0;
          if (pct < 1) return null;
          const isExpanded = expandedParent === ps.parentStage;
          return (
            <div
              key={ps.parentStage}
              className={cn(
                "flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all",
                parentColors[ps.parentStage],
                isExpanded ? "opacity-100 ring-2 ring-white/40 ring-inset" : "hover:opacity-80",
              )}
              style={{ width: `${pct}%` }}
              onClick={() => setExpandedParent(prev => prev === ps.parentStage ? null : ps.parentStage)}
              title={`${ps.label}: ${ps.count} cases`}
            >
              {pct > 8 && (
                <span className="flex items-center gap-1">
                  {ps.label} ({ps.count})
                  {substagesOf[ps.parentStage] && (
                    <ChevronDown
                      size={12}
                      className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")}
                    />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded substage bar */}
      {expanded && expanded.substages.length > 0 && (
        <div className="overflow-hidden transition-all duration-300">
          <div className="flex h-8 rounded-lg overflow-hidden border border-border">
            {expanded.substages.map(sub => {
              const subPct = expanded.count > 0 ? (sub.count / expanded.count) * 100 : 0;
              if (subPct < 1) return null;
              return (
                <div
                  key={sub.stage}
                  className={cn(
                    "flex items-center justify-center text-[10px] font-medium text-white cursor-pointer transition-opacity hover:opacity-80",
                    stageColors[sub.stage],
                  )}
                  style={{ width: `${subPct}%` }}
                  onClick={() => navigate(`/stage/${sub.stage}`)}
                  title={`${sub.label}: ${sub.count} cases`}
                >
                  {subPct > 6 && sub.count}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {!expandedParent ? (
        <div className="grid grid-cols-3 gap-2">
          {parentStages.map(ps => (
            <div
              key={ps.parentStage}
              onClick={() => setExpandedParent(ps.parentStage)}
              className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className={cn("w-3 h-3 rounded-sm shrink-0", parentColors[ps.parentStage])} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{ps.label}</p>
                <p className="text-sm font-bold text-foreground">{ps.count}</p>
                {ps.overSla > 0 && (
                  <p className="text-[10px] text-red-500">{ps.overSla} over SLA</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : expanded && expanded.substages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {expanded.substages.map(sub => (
            <div
              key={sub.stage}
              onClick={() => navigate(`/stage/${sub.stage}`)}
              className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className={cn("w-3 h-3 rounded-sm shrink-0", stageColors[sub.stage])} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{stageLabels[sub.stage]}</p>
                <p className="text-sm font-bold text-foreground">{sub.count}</p>
                {sub.overSla > 0 && (
                  <p className="text-[10px] text-red-500">{sub.overSla} over SLA</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {parentStages.map(ps => (
            <div
              key={ps.parentStage}
              onClick={() => navigate(`/stage/${ps.parentStage}`)}
              className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className={cn("w-3 h-3 rounded-sm shrink-0", parentColors[ps.parentStage])} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{ps.label}</p>
                <p className="text-sm font-bold text-foreground">{ps.count}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
