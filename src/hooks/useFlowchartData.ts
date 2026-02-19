import { useMemo, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type { SectionData } from '../types/flowchart.ts';
import { sectionToFlow } from '../utils/jsonTransform.ts';

export function useFlowchartData(section: SectionData) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => sectionToFlow(section),
    [section],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => [
        ...eds,
        {
          id: `${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          type: 'custom',
          data: {},
        },
      ]);
    },
    [setEdges],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect,
  };
}
