import { useState, useRef, useEffect } from 'react';
import type { SectionData } from '../types/flowchart.ts';

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
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '2px solid var(--border-color, #e0e0e0)',
      marginBottom: 0,
      overflow: 'auto',
    }}>
      {sections.map(s => {
        const isActive = s.id === activeId;
        const isEditing = editingId === s.id;

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            onDoubleClick={() => startEdit(s.id, s.title)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: isActive ? `3px solid ${s.themeColor}` : '3px solid transparent',
              background: isActive ? 'var(--surface, #fff)' : 'var(--toolbar-bg, #f5f5f5)',
              color: isActive ? s.themeColor : 'var(--text-muted, #666)',
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
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
                style={{
                  border: '1px solid var(--border-color, #ccc)',
                  borderRadius: 3,
                  padding: '2px 6px',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'inherit',
                  color: 'inherit',
                  background: 'var(--surface, #fff)',
                  outline: 'none',
                  width: Math.max(80, editValue.length * 8 + 20),
                }}
              />
            ) : (
              s.title
            )}
          </button>
        );
      })}
    </div>
  );
}
