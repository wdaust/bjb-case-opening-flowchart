import type { Node, Edge } from '@xyflow/react';
import type { SectionData, Task } from '../types/flowchart.ts';

export interface TaskNodeData {
  task: Task;
  fill: string;
  stroke: string;
  color: string;
  [key: string]: unknown;
}

export interface SubgraphNodeData {
  label: string;
  [key: string]: unknown;
}

export function sectionToFlow(section: SectionData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const subgraphTaskMap = new Map<string, string>();
  if (section.subgraphs) {
    for (const sg of section.subgraphs) {
      nodes.push({
        id: sg.id,
        type: 'subgraph',
        position: { x: 0, y: 0 },
        data: { label: sg.title } satisfies SubgraphNodeData,
        style: { width: 400, height: 300 },
      });
      for (const tid of sg.taskIds) {
        subgraphTaskMap.set(tid, sg.id);
      }
    }
  }

  for (const task of section.tasks) {
    const style = section.styles[task.style] || { fill: '#666', stroke: '#444', color: '#fff' };
    const node: Node = {
      id: task.id,
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        task,
        fill: style.fill,
        stroke: style.stroke,
        color: style.color,
      } satisfies TaskNodeData,
    };
    const parentId = subgraphTaskMap.get(task.id);
    if (parentId) {
      node.parentId = parentId;
      node.extent = 'parent' as const;
    }
    nodes.push(node);

    for (const target of task.connectsTo) {
      const edgeLabel = task.edgeLabels?.[target];
      edges.push({
        id: `${task.id}-${target}`,
        source: task.id,
        target,
        type: 'custom',
        label: edgeLabel || undefined,
        data: {},
      });
    }
  }

  return { nodes, edges };
}

export function flowToSection(original: SectionData, nodes: Node[], edges: Edge[]): SectionData {
  const taskNodes = nodes.filter(n => n.type === 'custom');
  const tasks: Task[] = taskNodes.map(n => {
    const data = n.data as TaskNodeData;
    const task = { ...data.task };
    task.connectsTo = edges
      .filter(e => e.source === n.id)
      .map(e => e.target);

    const edgeLabels: Record<string, string> = {};
    let hasLabels = false;
    for (const e of edges) {
      if (e.source === n.id && e.label) {
        edgeLabels[e.target] = e.label as string;
        hasLabels = true;
      }
    }
    if (hasLabels) {
      task.edgeLabels = edgeLabels;
    } else {
      delete task.edgeLabels;
    }

    return task;
  });

  return {
    ...original,
    tasks,
  };
}
