import { cn } from '../../utils/cn';

interface LCIBadgeProps {
  score: number;
  size?: 'sm' | 'md';
  className?: string;
}

function getBandClasses(score: number): string {
  if (score >= 85) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-red-500/15 text-red-600 dark:text-red-400';
}

export function LCIBadge({ score, size = 'md', className }: LCIBadgeProps) {
  const bandClasses = getBandClasses(score);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        bandClasses,
        size === 'sm' && 'px-1.5 py-0.5 text-[10px] leading-none',
        size === 'md' && 'px-2 py-0.5 text-xs',
        className,
      )}
    >
      {size === 'sm' ? score : `LCI: ${score}`}
    </span>
  );
}
