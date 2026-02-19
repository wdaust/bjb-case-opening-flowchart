import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getLayoutedElements } from '../utils/elkLayout.ts';

export function useAutoLayout() {
  const applyLayout = useCallback(
    async (nodes: Node[], edges: Edge[]): Promise<Node[]> => {
      return getLayoutedElements(nodes, edges);
    },
    [],
  );

  return { applyLayout };
}
