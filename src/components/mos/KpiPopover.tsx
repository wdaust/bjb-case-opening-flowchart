import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover.tsx';
import { cn } from '../../utils/cn.ts';
import type { KpiType, KpiDirection } from '../../types/mos.ts';

const KPI_TYPES: { value: KpiType; label: string; icon: string }[] = [
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'currency', label: 'Currency', icon: '$' },
  { value: 'percent', label: 'Percent', icon: '%' },
  { value: 'days', label: 'Days', icon: 'D' },
  { value: 'text', label: 'Text', icon: 'T' },
];

const DIRECTIONS: { value: KpiDirection | ''; label: string; icon: string }[] = [
  { value: 'above', label: 'At or above', icon: '≥' },
  { value: 'below', label: 'At or below', icon: '≤' },
  { value: '', label: 'None', icon: '=' },
];

export function formatKpiDisplay(kpi: string, type?: KpiType): string {
  if (!kpi) return '';
  if (!type || type === 'text') return kpi;
  const num = parseFloat(kpi.replace(/[^0-9.\-]/g, ''));
  if (isNaN(num)) return kpi;
  switch (type) {
    case 'currency': return `$${num.toLocaleString()}`;
    case 'percent': return `${num}%`;
    case 'days': return `${num} Days`;
    case 'number': return num.toLocaleString();
    default: return kpi;
  }
}

export function evaluateKpi(
  value: string,
  kpi: string,
  kpiType?: KpiType,
  kpiDirection?: KpiDirection,
  isRock?: boolean,
): 'green' | 'red' | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;

  // Rocks: simple on-track / off-track evaluation
  if (isRock) {
    if (trimmed === 'on track') return 'green';
    if (trimmed === 'off track') return 'red';
    return null;
  }

  if (!kpi?.trim() || !kpiDirection) return null;
  if (kpiType === 'text' || (!kpiType && !/^\d/.test(kpi.replace(/[^0-9.\-]/g, '')))) return null;

  const parseNum = (s: string) => parseFloat(s.replace(/[^0-9.\-]/g, ''));
  const v = parseNum(value);
  const t = parseNum(kpi);
  if (isNaN(v) || isNaN(t)) return null;

  if (kpiDirection === 'above') return v >= t ? 'green' : 'red';
  if (kpiDirection === 'below') return v <= t ? 'green' : 'red';
  return null;
}

interface KpiPopoverProps {
  kpi: string;
  kpiType?: KpiType;
  kpiDirection?: KpiDirection;
  onKpiChange: (kpi: string) => void;
  onTypeChange: (type: KpiType) => void;
  onDirectionChange: (dir: KpiDirection | undefined) => void;
  isAdmin: boolean;
}

export function KpiPopover({ kpi, kpiType, kpiDirection, onKpiChange, onTypeChange, onDirectionChange, isAdmin }: KpiPopoverProps) {
  const type = kpiType ?? 'text';
  const dirIcon = kpiDirection === 'above' ? '≥' : kpiDirection === 'below' ? '≤' : '';
  const typeIcon = KPI_TYPES.find(t => t.value === type)?.icon ?? 'T';
  const display = formatKpiDisplay(kpi, kpiType);

  if (!isAdmin) {
    return <span className="text-muted-foreground">{display || '—'}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors text-muted-foreground"
          title="Edit KPI"
        >
          {dirIcon && <span className="text-[9px] font-mono opacity-60">{dirIcon}</span>}
          <span>{display || '—'}</span>
          {type !== 'text' && <span className="text-[9px] font-mono opacity-40">{typeIcon}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3" align="start">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">KPI Value</label>
          <input
            type="text"
            value={kpi}
            onChange={e => onKpiChange(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary/40"
            placeholder="Target value"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
          <div className="flex gap-1 mt-1">
            {KPI_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => onTypeChange(t.value)}
                className={cn(
                  'flex-1 py-1 text-[10px] font-mono rounded border transition-colors',
                  type === t.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30',
                )}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Direction</label>
          <div className="flex gap-1 mt-1">
            {DIRECTIONS.map(d => (
              <button
                key={d.value}
                onClick={() => onDirectionChange(d.value ? (d.value as KpiDirection) : undefined)}
                className={cn(
                  'flex-1 py-1 text-xs rounded border transition-colors',
                  (kpiDirection ?? '') === d.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30',
                )}
                title={d.label}
              >
                {d.icon}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
