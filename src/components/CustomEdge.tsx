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
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              width: 20,
              height: 20,
              cursor: 'pointer',
              pointerEvents: 'all',
            }}
            title="Double-click to add label"
          />
        </EdgeLabelRenderer>
        {editing && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
                zIndex: 10,
              }}
            >
              <input
                autoFocus
                value={labelValue}
                onChange={e => setLabelValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="Edge label"
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  border: '1px solid #2196f3',
                  borderRadius: 4,
                  outline: 'none',
                  width: 80,
                  textAlign: 'center',
                  background: '#fff',
                }}
              />
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  return (
    <>
      <SmoothStepEdge {...props} label={undefined} />
      <EdgeLabelRenderer>
        {editing ? (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
          >
            <input
              autoFocus
              value={labelValue}
              onChange={e => setLabelValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                border: '1px solid #2196f3',
                borderRadius: 4,
                outline: 'none',
                width: 80,
                textAlign: 'center',
                background: '#fff',
              }}
            />
          </div>
        ) : (
          <div
            onClick={handleLabelClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              border: '1px solid #ccc',
              cursor: 'pointer',
              pointerEvents: 'all',
            }}
            title="Click to edit label"
          >
            {props.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
