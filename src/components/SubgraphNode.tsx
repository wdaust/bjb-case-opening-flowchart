import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { SubgraphNodeData } from '../utils/jsonTransform.ts';

function SubgraphNodeComponent({ data }: NodeProps) {
  const { label } = data as SubgraphNodeData;

  return (
    <div className="w-full h-full border-2 border-dashed border-subgraph-border rounded-xl bg-subgraph-bg relative">
      <div className="absolute top-0 left-0 right-0 px-3 py-1.5 bg-subgraph-bg rounded-t-[10px] font-bold text-[13px] text-subgraph-label">
        {label}
      </div>
    </div>
  );
}

export const SubgraphNode = memo(SubgraphNodeComponent);
