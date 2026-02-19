import type { LegendItem } from '../types/flowchart.ts';
import { Button } from './ui/button.tsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.tsx';
import { Palette } from 'lucide-react';

export function LegendDropdown({ items }: { items: LegendItem[] }) {
  if (items.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Palette className="h-4 w-4" />
          Legend
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-48">
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color Legend</p>
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm">
              <div
                className="w-4 h-4 rounded-sm border border-border shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
