import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { ScoreInput } from './ScoreInput.tsx';
import type { ScoringCategory } from '../../data/scoringData.ts';
import { Badge } from '../ui/badge.tsx';

interface ScoringCategoryCardProps {
  category: ScoringCategory;
  scores: Record<string, number>;
  onScoreChange: (factorId: string, value: number) => void;
}

export function ScoringCategoryCard({
  category,
  scores,
  onScoreChange,
}: ScoringCategoryCardProps) {
  const [open, setOpen] = useState(true);

  const completedCount = category.factors.filter(
    (f) => scores[f.id] != null
  ).length;
  const totalCount = category.factors.length;

  // Weighted subtotal: sum of (score/5 * factorWeight) for scored factors
  const weightedSubtotal = category.factors.reduce((sum, factor) => {
    const score = scores[factor.id];
    if (score == null) return sum;
    return sum + (score / 5) * factor.weight;
  }, 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">
            {category.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Weight: {(category.weight * 100).toFixed(0)}% &middot; Subtotal:{' '}
            {(weightedSubtotal * 100).toFixed(1)}% &middot; {completedCount}/
            {totalCount} scored
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            !open && '-rotate-90'
          )}
        />
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-2 space-y-3">
          {category.factors.map((factor) => (
            <div
              key={factor.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{factor.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {(factor.weight * 100).toFixed(0)}%
                </Badge>
              </div>
              <ScoreInput
                value={scores[factor.id] ?? null}
                onChange={(v) => onScoreChange(factor.id, v)}
                rubric={factor.rubric}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
