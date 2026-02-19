import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';

interface DeadlineItem {
  type: string;
  date: string;
  description: string;
  caseId: string;
  caseTitle: string;
  attorney: string;
  stage: string;
}

interface Props {
  deadlines: DeadlineItem[];
  maxItems?: number;
  className?: string;
}

function getUrgency(dateStr: string): { label: string; color: string; icon: typeof AlertTriangle } {
  const today = new Date("2026-02-19");
  const date = new Date(dateStr);
  const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Overdue", color: "text-red-500 bg-red-500/10 border-red-500/20", icon: AlertTriangle };
  if (days <= 7) return { label: `${days}d`, color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Clock };
  if (days <= 30) return { label: `${days}d`, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: Clock };
  return { label: `${days}d`, color: "text-muted-foreground bg-muted/50 border-border", icon: Calendar };
}

const typeLabels: Record<string, string> = {
  SOL: "SOL",
  trial: "Trial",
  expert: "Expert",
  discovery: "Discovery",
  court: "Court",
  motion: "Motion",
  depo: "Deposition",
};

export function DeadlineList({ deadlines, maxItems = 20, className }: Props) {
  const navigate = useNavigate();
  const items = deadlines.slice(0, maxItems);

  return (
    <div className={cn("space-y-2", className)}>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
      )}
      {items.map((d, i) => {
        const urgency = getUrgency(d.date);
        const Icon = urgency.icon;
        return (
          <div
            key={`${d.caseId}-${d.type}-${i}`}
            onClick={() => navigate(`/case/${d.caseId}`)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
              urgency.color,
            )}
          >
            <Icon size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase">{typeLabels[d.type] || d.type}</span>
                <span className="text-xs opacity-70">{d.date}</span>
              </div>
              <p className="text-xs mt-0.5 truncate">{d.caseTitle}</p>
              <p className="text-[10px] opacity-70">{d.attorney} &middot; {d.caseId}</p>
            </div>
            <span className="text-xs font-bold shrink-0">{urgency.label}</span>
          </div>
        );
      })}
    </div>
  );
}
