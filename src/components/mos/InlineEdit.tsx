import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn.ts';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function InlineEdit({ value, onSave, placeholder = '—', className, inputClassName }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={cn('cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors', className)}
        title="Click to edit"
      >
        {value || <span className="text-muted-foreground/50">{placeholder}</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className={cn(
        'bg-background border border-primary/40 rounded px-1.5 py-0.5 text-xs focus:outline-none w-full',
        inputClassName,
      )}
      placeholder={placeholder}
    />
  );
}
