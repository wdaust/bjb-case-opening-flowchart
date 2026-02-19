import { memo, useState, useContext } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TaskNodeData } from '../utils/jsonTransform.ts';
import { FilterContext } from '../contexts/FilterContext.ts';

function matchesFilter(task: TaskNodeData['task'], query: string, assignee: string): boolean {
  if (query) {
    const q = query.toLowerCase();
    const text = `${task.id} ${task.label} ${task.assignedTo} ${task.phase} ${task.notes || ''}`.toLowerCase();
    if (!text.includes(q)) return false;
  }
  if (assignee && task.assignedTo !== assignee) return false;
  return true;
}

function CustomNodeComponent({ data, selected }: NodeProps) {
  const { task, fill, stroke, color } = data as TaskNodeData;
  const lines = task.label.split('\n');
  const [hovered, setHovered] = useState(false);
  const { searchQuery, assigneeFilter } = useContext(FilterContext);

  const isFiltering = !!(searchQuery || assigneeFilter);
  const matches = matchesFilter(task, searchQuery, assigneeFilter);
  const dimmed = isFiltering && !matches;

  const assignedIcon = task.assignedTo
    ? task.assignedTo.includes('System') ? '\u{1F916}'
    : task.assignedTo.includes('Attorney') ? '\u2696\uFE0F'
    : '\u{1F4CB}'
    : '';

  const hasNotes = !!(task.notes && task.notes.trim());

  return (
    <div
      style={{
        background: fill,
        border: `2px solid ${selected ? '#ff0' : stroke}`,
        borderRadius: 8,
        padding: '8px 12px',
        color,
        fontSize: 12,
        minWidth: 180,
        maxWidth: 240,
        textAlign: 'center',
        boxShadow: selected ? '0 0 0 2px #ff0' : '0 1px 4px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        position: 'relative',
        opacity: dimmed ? 0.2 : 1,
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: hovered ? '#2196f3' : stroke,
          width: hovered ? 12 : 10,
          height: hovered ? 12 : 10,
          border: '2px solid #fff',
          transition: 'all 0.15s',
          boxShadow: hovered ? '0 0 6px rgba(33,150,243,0.5)' : 'none',
        }}
      />

      {hasNotes && (
        <div style={{
          position: 'absolute', top: 4, right: 6,
          fontSize: 11, lineHeight: 1,
          opacity: 0.8,
        }} title="Has notes">
          📝
        </div>
      )}

      <div style={{ fontWeight: 700, marginBottom: 2 }}>
        {task.emoji ? `${task.emoji} ` : ''}{lines[0]}
      </div>
      {lines.slice(1).map((line, i) => (
        <div key={i} style={{ fontSize: 11, opacity: 0.9 }}>{line}</div>
      ))}
      {task.assignedTo && (
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.85 }}>
          {assignedIcon} {task.assignedTo}
        </div>
      )}
      {task.sla && (
        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.75 }}>
          ⏱ {task.sla}
        </div>
      )}

      {hasNotes && hovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#333',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 11,
          lineHeight: 1.4,
          maxWidth: 220,
          whiteSpace: 'pre-wrap',
          textAlign: 'left',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          {task.notes!.length > 120 ? task.notes!.slice(0, 120) + '…' : task.notes}
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #333',
          }} />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: hovered ? '#2196f3' : stroke,
          width: hovered ? 12 : 10,
          height: hovered ? 12 : 10,
          border: '2px solid #fff',
          transition: 'all 0.15s',
          boxShadow: hovered ? '0 0 6px rgba(33,150,243,0.5)' : 'none',
        }}
      />
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
