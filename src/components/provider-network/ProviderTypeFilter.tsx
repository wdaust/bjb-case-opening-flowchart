import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { PROVIDER_TYPE_COLORS, getUniqueProviderTypes, type ProviderType } from '../../data/providerNetworkData.ts';

interface Props {
  selected: ProviderType[];
  onChange: (types: ProviderType[]) => void;
}

export function ProviderTypeFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const types = getUniqueProviderTypes();

  function toggle(type: ProviderType) {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
      >
        <span>Filter Types {selected.length > 0 ? `(${selected.length})` : ''}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-[1000] mt-1 w-56 rounded-lg border border-border bg-card p-2 shadow-lg space-y-1">
          {types.map(type => (
            <label
              key={type}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(type)}
                onChange={() => toggle(type)}
                className="rounded border-border"
              />
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: PROVIDER_TYPE_COLORS[type] }}
              />
              <span className="text-xs text-foreground">{type}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
