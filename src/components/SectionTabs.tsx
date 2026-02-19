import { useState, useRef, useEffect } from 'react';
import type { SectionData } from '../types/flowchart.ts';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs.tsx';

interface Props {
  sections: SectionData[];
  activeId: string;
  onSelect: (id: string) => void;
  onRenameSection?: (id: string, newTitle: string) => void;
}

export function SectionTabs({ sections, activeId, onSelect, onRenameSection }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (id: string, title: string) => {
    if (!onRenameSection) return;
    setEditingId(id);
    setEditValue(title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim() && onRenameSection) {
      onRenameSection(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <Tabs value={activeId} onValueChange={onSelect} className="shrink-0">
      <TabsList className="w-full justify-start overflow-x-auto">
        {sections.map(s => {
          const isEditing = editingId === s.id;

          return (
            <TabsTrigger
              key={s.id}
              value={s.id}
              onDoubleClick={() => startEdit(s.id, s.title)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  onClick={e => e.stopPropagation()}
                  className="border border-border rounded px-1.5 py-0.5 text-sm bg-background text-foreground outline-none focus:ring-1 focus:ring-ring"
                  style={{ width: Math.max(80, editValue.length * 8 + 20) }}
                />
              ) : (
                s.title
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
