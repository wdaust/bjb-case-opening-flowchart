import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';

const elk = new ELK();

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

export async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): Promise<Node[]> {
  const parentNodes = nodes.filter(n => n.type === 'subgraph');
  const childNodes = nodes.filter(n => n.type !== 'subgraph');

  const parentIds = new Set(parentNodes.map(n => n.id));
  const childrenByParent = new Map<string, Node[]>();
  const topLevelNodes: Node[] = [];

  for (const node of childNodes) {
    if (node.parentId && parentIds.has(node.parentId)) {
      const list = childrenByParent.get(node.parentId) || [];
      list.push(node);
      childrenByParent.set(node.parentId, list);
    } else {
      topLevelNodes.push(node);
    }
  }

  const elkChildren: Array<{
    id: string;
    width: number;
    height: number;
    children?: Array<{ id: string; width: number; height: number }>;
    layoutOptions?: Record<string, string>;
  }> = [];

  for (const node of topLevelNodes) {
    elkChildren.push({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  for (const pNode of parentNodes) {
    const children = childrenByParent.get(pNode.id) || [];
    elkChildren.push({
      id: pNode.id,
      width: 0,
      height: 0,
      children: children.map(c => ({
        id: c.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })),
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '30',
        'elk.layered.spacing.nodeNodeBetweenLayers': '50',
        'elk.padding': '[top=40,left=20,bottom=20,right=20]',
      },
    });
  }

  const elkEdges = edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const graph = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: elkChildren,
    edges: elkEdges,
  });

  const positionMap = new Map<string, { x: number; y: number }>();
  const sizeMap = new Map<string, { width: number; height: number }>();

  function processElkNode(elkNode: { id?: string; x?: number; y?: number; width?: number; height?: number; children?: Array<{ id?: string; x?: number; y?: number; width?: number; height?: number }> }) {
    if (elkNode.id && elkNode.x !== undefined && elkNode.y !== undefined) {
      positionMap.set(elkNode.id, { x: elkNode.x, y: elkNode.y });
      if (elkNode.width && elkNode.height) {
        sizeMap.set(elkNode.id, { width: elkNode.width, height: elkNode.height });
      }
    }
    if (elkNode.children) {
      for (const child of elkNode.children) {
        processElkNode(child);
      }
    }
  }

  if (graph.children) {
    for (const child of graph.children) {
      processElkNode(child);
    }
  }

  return nodes.map(node => {
    const pos = positionMap.get(node.id);
    const size = sizeMap.get(node.id);
    if (pos) {
      const updated = { ...node, position: { x: pos.x, y: pos.y } };
      if (node.type === 'subgraph' && size) {
        updated.style = { ...updated.style, width: size.width, height: size.height };
      }
      return updated;
    }
    return node;
  });
}
