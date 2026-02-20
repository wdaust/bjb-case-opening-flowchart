
import { Button } from '../ui/button.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip.tsx';
import { cn } from '../../utils/cn.ts';

interface ScoreInputProps {
  value: number | null;
  onChange: (v: number) => void;
  rubric: Record<number, string>;
}

const scoreColors: Record<number, string> = {
  1: 'bg-red-500 text-white hover:bg-red-600',
  2: 'bg-orange-500 text-white hover:bg-orange-600',
  3: 'bg-yellow-500 text-white hover:bg-yellow-600',
  4: 'bg-blue-500 text-white hover:bg-blue-600',
  5: 'bg-green-500 text-white hover:bg-green-600',
};

export function ScoreInput({ value, onChange, rubric }: ScoreInputProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Tooltip key={n}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={value === n ? 'default' : 'outline'}
                className={cn(
                  'w-8 h-8 p-0',
                  value === n && scoreColors[n]
                )}
                onClick={() => onChange(n)}
              >
                {n}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{rubric[n] ?? `Score ${n}`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
