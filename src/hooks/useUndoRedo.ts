import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export function useUndoRedo(maxHistory = 50) {
  const history = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    history.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (history.current.length > maxHistory) history.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [maxHistory]);

  const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]): Snapshot | null => {
    if (history.current.length === 0) return null;
    future.current.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    });
    const snapshot = history.current.pop()!;
    setCanUndo(history.current.length > 0);
    setCanRedo(true);
    return snapshot;
  }, []);

  const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]): Snapshot | null => {
    if (future.current.length === 0) return null;
    history.current.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    });
    const snapshot = future.current.pop()!;
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    return snapshot;
  }, []);

  const clear = useCallback(() => {
    history.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { pushSnapshot, undo, redo, canUndo, canRedo, clear };
}
