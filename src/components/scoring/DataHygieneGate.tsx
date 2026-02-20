
import { Badge } from '../ui/badge.tsx';
import type { HygieneItem } from '../../data/scoringData.ts';

interface DataHygieneGateProps {
  items: HygieneItem[];
  checked: Record<string, boolean>;
  onChange: (id: string, val: boolean) => void;
}

export function DataHygieneGate({
  items,
  checked,
  onChange,
}: DataHygieneGateProps) {
  const checkedCount = items.filter((item) => checked[item.id]).length;
  const allChecked = checkedCount === items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Data Hygiene Gate
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {checkedCount}/{items.length}
          </span>
          {allChecked ? (
            <Badge className="bg-green-500 text-white hover:bg-green-600">
              VERIFIED
            </Badge>
          ) : (
            <Badge variant="destructive">PROVISIONAL</Badge>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 cursor-pointer text-sm text-foreground"
          >
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={(e) => onChange(item.id, e.target.checked)}
              className="h-4 w-4 rounded border-border accent-green-500"
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
