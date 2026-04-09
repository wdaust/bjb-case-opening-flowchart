import { Clock } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface Props {
  timing: string;
}

export function TimingTooltip({ timing }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <Clock size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap">{timing}</pre>
      </TooltipContent>
    </Tooltip>
  );
}
