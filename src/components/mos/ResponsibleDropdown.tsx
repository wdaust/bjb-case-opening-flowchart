import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn.ts';
import { ChevronDown } from 'lucide-react';

interface ResponsibleDropdownProps {
  value: string;
  options: string[];
  onSave: (value: string) => void;
  className?: string;
}

export function ResponsibleDropdown({ value, options, onSave, className }: ResponsibleDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      updatePos();
      // focus after portal renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        inputRef.current?.contains(t) ||
        listRef.current?.contains(t)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const showCustom = search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase());

  const select = (val: string) => {
    setOpen(false);
    if (val !== value) onSave(val);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={cn('cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors inline-flex items-center gap-0.5', className)}
        title="Click to change"
      >
        {value || <span className="text-muted-foreground/50">—</span>}
        <ChevronDown size={10} className="text-muted-foreground/50 shrink-0" />
      </span>
      {open && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-52 bg-popover border border-border rounded-md shadow-lg"
        >
          <div className="p-1.5 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { select(search.trim() || value); }
                if (e.key === 'Escape') { setOpen(false); }
              }}
              className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary/40"
              placeholder="Type or select…"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map(o => (
              <button
                key={o}
                onMouseDown={() => select(o)}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/60 transition-colors',
                  o === value && 'text-primary font-medium',
                )}
              >
                {o}
              </button>
            ))}
            {showCustom && (
              <button
                onMouseDown={() => select(search.trim())}
                className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/60 transition-colors text-muted-foreground"
              >
                + "{search.trim()}"
              </button>
            )}
            {filtered.length === 0 && !showCustom && (
              <div className="px-2.5 py-1.5 text-xs text-muted-foreground">No matches</div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
