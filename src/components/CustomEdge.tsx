import {
  SmoothStepEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export function CustomEdge(props: EdgeProps) {
  if (!props.label) {
    return <SmoothStepEdge {...props} />;
  }

  const [, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });

  return (
    <>
      <SmoothStepEdge {...props} label={undefined} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            border: '1px solid #ccc',
            pointerEvents: 'none',
          }}
        >
          {props.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
