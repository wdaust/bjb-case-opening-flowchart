import { cn } from '../../utils/cn.ts';

interface Props {
  documentation: number;
  treatmentOutcomes: number;
  responsiveness: number;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-amber-400' :
    'bg-red-500';

  const textColor =
    score >= 80 ? 'text-emerald-400' :
    score >= 60 ? 'text-amber-400' :
    'text-red-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-semibold', textColor)}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function QualityScoreBars({ documentation, treatmentOutcomes, responsiveness }: Props) {
  return (
    <div className="space-y-2.5">
      <ScoreBar label="Documentation Quality" score={documentation} />
      <ScoreBar label="Treatment Outcomes" score={treatmentOutcomes} />
      <ScoreBar label="Responsiveness" score={responsiveness} />
    </div>
  );
}
