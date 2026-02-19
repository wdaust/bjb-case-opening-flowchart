import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { SubgraphNodeData } from '../utils/jsonTransform.ts';

function SubgraphNodeComponent({ data }: NodeProps) {
  const { label } = data as SubgraphNodeData;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '2px dashed #9e9e9e',
        borderRadius: 12,
        background: 'rgba(245,245,245,0.5)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '6px 12px',
          background: 'rgba(66,66,66,0.08)',
          borderRadius: '10px 10px 0 0',
          fontWeight: 700,
          fontSize: 13,
          color: '#424242',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const SubgraphNode = memo(SubgraphNodeComponent);
