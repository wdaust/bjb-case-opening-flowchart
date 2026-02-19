import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import type { Stage } from '../../data/mockData';
import { stageLabels } from '../../data/mockData';

interface StageData {
  stage: Stage;
  label: string;
  count: number;
  overSla: number;
  avgAge: number;
}

interface Props {
  stages: StageData[];
  className?: string;
}

const stageColors: Record<Stage, string> = {
  opening: "bg-blue-500",
  treatment: "bg-emerald-500",
  discovery: "bg-amber-500",
  "expert-depo": "bg-purple-500",
  adr: "bg-cyan-500",
  trial: "bg-red-500",
};

export function StageBar({ stages, className }: Props) {
  const navigate = useNavigate();
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Horizontal bar */}
      <div className="flex h-10 rounded-lg overflow-hidden border border-border">
        {stages.map(s => {
          const pct = total > 0 ? (s.count / total) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={s.stage}
              className={cn(
                "flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-opacity hover:opacity-80",
                stageColors[s.stage],
              )}
              style={{ width: `${pct}%` }}
              onClick={() => navigate(`/stage/${s.stage}`)}
              title={`${s.label}: ${s.count} cases`}
            >
              {pct > 8 && s.count}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map(s => (
          <div
            key={s.stage}
            onClick={() => navigate(`/stage/${s.stage}`)}
            className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className={cn("w-3 h-3 rounded-sm shrink-0", stageColors[s.stage])} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{stageLabels[s.stage]}</p>
              <p className="text-sm font-bold text-foreground">{s.count}</p>
              {s.overSla > 0 && (
                <p className="text-[10px] text-red-500">{s.overSla} over SLA</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
