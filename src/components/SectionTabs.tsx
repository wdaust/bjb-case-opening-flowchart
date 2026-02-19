import type { SectionData } from '../types/flowchart.ts';

interface Props {
  sections: SectionData[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SectionTabs({ sections, activeId, onSelect }: Props) {
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
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
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
            {s.title}
          </button>
        );
      })}
    </div>
  );
}
