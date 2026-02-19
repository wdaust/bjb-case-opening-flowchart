import { useState, useCallback } from 'react';
import {
  SmoothStepEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react';

export function CustomEdge(props: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState('');

  const [, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelValue((props.label as string) || '');
    setEditing(true);
  }, [props.label]);

  const handleSave = useCallback(() => {
    const newLabel = labelValue.trim();
    setEdges(eds => eds.map(e => {
      if (e.id !== props.id) return e;
      return { ...e, label: newLabel || undefined };
    }));
    setEditing(false);
  }, [labelValue, props.id, setEdges]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  }, [handleSave]);

  const editorInput = (
    <EdgeLabelRenderer>
      <div
        className="absolute pointer-events-auto z-10"
        style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
      >
        <input
          autoFocus
          value={labelValue}
          onChange={e => setLabelValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Edge label"
          className="px-1.5 py-0.5 text-[10px] border border-ring rounded outline-none w-20 text-center bg-input"
        />
      </div>
    </EdgeLabelRenderer>
  );

  // No label — render plain edge with double-click to add label
  if (!props.label && !editing) {
    return (
      <>
        <SmoothStepEdge {...props} />
        <EdgeLabelRenderer>
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setLabelValue('');
              setEditing(true);
            }}
            className="absolute w-5 h-5 cursor-pointer pointer-events-auto"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            title="Double-click to add label"
          />
        </EdgeLabelRenderer>
        {editing && editorInput}
      </>
    );
  }

  return (
    <>
      <SmoothStepEdge {...props} label={undefined} />
      <EdgeLabelRenderer>
        {editing ? (
          <div
            className="absolute pointer-events-auto z-10"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            <input
              autoFocus
              value={labelValue}
              onChange={e => setLabelValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="px-1.5 py-0.5 text-[10px] border border-ring rounded outline-none w-20 text-center bg-input"
            />
          </div>
        ) : (
          <div
            onClick={handleLabelClick}
            className="absolute bg-card px-1.5 py-0.5 rounded text-[10px] font-semibold border border-border cursor-pointer pointer-events-auto"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            title="Click to edit label"
          >
            {props.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
