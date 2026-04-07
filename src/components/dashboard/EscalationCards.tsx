import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { fmtNum } from '../../utils/sfHelpers';
import { DashboardGrid } from './DashboardGrid';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface EscalationCardsProps {
  complaintsOverdue: number;
  formAPastDue60: number;
  missingAnswers: number;
  formCPastDue: number;
  depsOverdue90: number;
}

const hoverCard = "transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 cursor-pointer";

interface CardDef {
  label: string;
  key: keyof EscalationCardsProps;
  path: string | null;
  temp?: boolean;
  tempNote?: string;
}

const cards: CardDef[] = [
  { label: 'Complaints >14 Days', key: 'complaintsOverdue', path: '/complaints-overdue' },
  { label: 'Form A Past Due >60d', key: 'formAPastDue60', path: '/form-a' },
  { label: 'Missing Answers >40d', key: 'missingAnswers', path: '/missing-answers' },
  { label: 'Def. Discovery >75d', key: 'formCPastDue', path: '/defendants-discovery' },
  { label: 'Deps Not Sched >90d', key: 'depsOverdue90', path: '/depositions' },
];

export function EscalationCards(props: EscalationCardsProps) {
  const navigate = useNavigate();

  return (
    <DashboardGrid cols={5}>
      {cards.map(card => {
        const count = props[card.key];
        const severity = count > 0 ? (count >= 50 ? 'red' : 'amber') : 'green';
        const borderColor = severity === 'red' ? 'border-red-500/50' : severity === 'amber' ? 'border-amber-500/50' : 'border-green-500/50';
        const bgColor = severity === 'red' ? 'bg-red-500/5' : severity === 'amber' ? 'bg-amber-500/5' : 'bg-green-500/5';
        const textColor = severity === 'red' ? 'text-red-400' : severity === 'amber' ? 'text-amber-400' : 'text-green-400';

        const cardContent = (
          <div
            key={card.key}
            className={cn(
              'relative rounded-xl border-t-2 border bg-card p-5 text-center',
              borderColor, bgColor, hoverCard,
              !card.path && 'cursor-default hover:scale-100 hover:shadow-none',
            )}
            onClick={() => card.path && navigate(card.path)}
          >
            {card.temp && (
              <span className="absolute top-2 right-2 text-[9px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                Temp
              </span>
            )}
            <p className={cn('text-4xl font-bold', textColor)}>{fmtNum(count)}</p>
            <p className="text-xs font-medium text-muted-foreground mt-2">{card.label}</p>
          </div>
        );

        if (card.temp && card.tempNote) {
          return (
            <Tooltip key={card.key}>
              <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                {card.tempNote}
              </TooltipContent>
            </Tooltip>
          );
        }

        return cardContent;
      })}
    </DashboardGrid>
  );
}
