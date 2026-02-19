import { useState } from 'react';
import type { LegendItem } from '../types/flowchart.ts';

export function Legend({ items }: { items: LegendItem[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: '#fafafa',
      borderBottom: '1px solid #e0e0e0',
      padding: collapsed ? '6px 16px' : '10px 16px',
      transition: 'padding 0.15s',
    }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 4, padding: 0,
          marginBottom: collapsed ? 0 : 8,
        }}
      >
        <span style={{
          transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          transition: 'transform 0.15s', display: 'inline-block',
        }}>
          ▶
        </span>
        Legend
      </button>
      {!collapsed && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {items.map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: item.color,
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0,
              }} />
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
