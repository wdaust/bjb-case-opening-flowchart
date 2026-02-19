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
      className="rounded-lg px-3 py-2 text-xs min-w-[180px] max-w-[240px] text-center cursor-pointer relative transition-opacity"
      style={{
        background: fill,
        border: `2px solid ${selected ? '#ff0' : stroke}`,
        color,
        boxShadow: selected ? '0 0 0 2px #ff0' : '0 1px 4px rgba(0,0,0,0.2)',
        opacity: dimmed ? 0.2 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: hovered ? 'hsl(var(--ring))' : stroke,
          width: hovered ? 12 : 10,
          height: hovered ? 12 : 10,
          border: '2px solid hsl(var(--card))',
          transition: 'all 0.15s',
          boxShadow: hovered ? '0 0 6px rgba(33,150,243,0.5)' : 'none',
        }}
      />

      {hasNotes && (
        <div className="absolute top-1 right-1.5 text-[11px] leading-none opacity-80" title="Has notes">
          📝
        </div>
      )}

      <div className="font-bold mb-0.5">
        {task.emoji ? `${task.emoji} ` : ''}{lines[0]}
      </div>
      {lines.slice(1).map((line, i) => (
        <div key={i} className="text-[11px] opacity-90">{line}</div>
      ))}
      {task.assignedTo && (
        <div className="text-[10px] mt-1 opacity-85">
          {assignedIcon} {task.assignedTo}
        </div>
      )}
      {task.sla && (
        <div className="text-[10px] mt-0.5 opacity-75">
          ⏱ {task.sla}
        </div>
      )}

      {hasNotes && hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-tooltip-bg text-tooltip-color px-2.5 py-1.5 rounded-md text-[11px] leading-snug max-w-[220px] whitespace-pre-wrap text-left shadow-lg z-10 pointer-events-none">
          {task.notes!.length > 120 ? task.notes!.slice(0, 120) + '…' : task.notes}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-tooltip-bg" />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: hovered ? 'hsl(var(--ring))' : stroke,
          width: hovered ? 12 : 10,
          height: hovered ? 12 : 10,
          border: '2px solid hsl(var(--card))',
          transition: 'all 0.15s',
          boxShadow: hovered ? '0 0 6px rgba(33,150,243,0.5)' : 'none',
        }}
      />
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
