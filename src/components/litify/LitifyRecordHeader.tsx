import { Badge } from '../ui/badge.tsx';
import { cn } from '../../utils/cn.ts';

// ── Types ──────────────────────────────────────────────────────────────

export interface RecordHeaderField {
  label: string;
  value: string;
}

export interface StatusBadge {
  label: string;
  variant: 'info' | 'success' | 'warning';
}

interface LitifyRecordHeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  fields: RecordHeaderField[];
  statusBadge: StatusBadge;
}

// ── Helpers ────────────────────────────────────────────────────────────

const badgeStyles: Record<StatusBadge['variant'], string> = {
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  success: 'bg-green-500/10 text-green-600 border-green-500/30',
  warning: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
};

// ── Component ──────────────────────────────────────────────────────────

export function LitifyRecordHeader({ title, icon: Icon, fields, statusBadge }: LitifyRecordHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {field.label}
              </span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{field.value}</p>
            </div>
          ))}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <div className="mt-0.5">
              <Badge className={cn('text-xs', badgeStyles[statusBadge.variant])}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
