import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import type { SectionData, Task, Subgraph } from '../types/flowchart.ts';
import type { TaskNodeData } from '../utils/jsonTransform.ts';
import { sectionToFlow, flowToSection } from '../utils/jsonTransform.ts';
import { useFlowchartData } from '../hooks/useFlowchartData.ts';
import { useAutoLayout } from '../hooks/useAutoLayout.ts';
import { useUndoRedo } from '../hooks/useUndoRedo.ts';
import { generateNextId } from '../utils/idGenerator.ts';
import { FilterContext } from '../contexts/FilterContext.ts';
import { CustomNode } from './CustomNode.tsx';
import { SubgraphNode } from './SubgraphNode.tsx';
import { CustomEdge } from './CustomEdge.tsx';
import { LegendDropdown } from './Legend.tsx';
import { Toolbar } from './Toolbar.tsx';
import { DetailTable } from './DetailTable.tsx';
import { NodeEditorPanel } from './NodeEditorPanel.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog.tsx';

const nodeTypes = { custom: CustomNode, subgraph: SubgraphNode };
const edgeTypes = { custom: CustomEdge };

function waitForMeasuredThenFit(
  rfInstance: ReactFlowInstance,
  fitView: (opts?: { padding?: number }) => void,
  padding = 0.05
) {
  let attempts = 0;
  const maxAttempts = 60;
  const check = () => {
    attempts++;
    const nodes = rfInstance.getNodes();
    const measured = nodes.length > 0 && nodes.some(
      (n) => n.measured?.width && n.measured.width > 0
    );
    if (measured) {
      fitView({ padding });
    } else if (attempts < maxAttempts) {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
}

interface Props {
  section: SectionData;
  onSectionUpdate: (section: SectionData) => void;
}

export function FlowchartCanvas({ section, onSectionUpdate }: Props) {
  const { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onConnect } = useFlowchartData(section);
  const { applyLayout } = useAutoLayout();
  const { fitView } = useReactFlow();
  const { pushSnapshot, undo, redo, canUndo, canRedo, clear: clearHistory } = useUndoRedo();

  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSelectedTasks, setGroupSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const initialLayoutDone = useRef(false);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentSectionRef = useRef(section);
  currentSectionRef.current = section;

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const assignees = useMemo(() => {
    const set = new Set<string>();
    section.tasks.forEach(t => { if (t.assignedTo) set.add(t.assignedTo); });
    return Array.from(set).sort();
  }, [section.tasks]);

  const filterValue = useMemo(() => ({
    searchQuery,
    assigneeFilter,
  }), [searchQuery, assigneeFilter]);

  useEffect(() => {
    setSearchQuery('');
    setAssigneeFilter('');
    clearHistory();
    initialLayoutDone.current = false;
  }, [section.id, clearHistory]);

  useEffect(() => {
    if (!initialLayoutDone.current && nodes.length > 0) {
      initialLayoutDone.current = true;
      applyLayout(nodes, edges).then(layouted => {
        setNodes(layouted);
        if (rfInstance.current) {
          waitForMeasuredThenFit(rfInstance.current, fitView);
        }
      });
    }
  }, [nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance;
  }, []);

  const syncSection = useCallback(() => {
    const updated = flowToSection(currentSectionRef.current, nodesRef.current, edgesRef.current);
    onSectionUpdate(updated);
  }, [onSectionUpdate]);

  const handleNodesDelete = useCallback(() => {
    pushSnapshot(nodes, edges);
    setTimeout(syncSection, 0);
  }, [nodes, edges, pushSnapshot, syncSection]);

  const handleEdgesDelete = useCallback(() => {
    pushSnapshot(nodes, edges);
    setTimeout(syncSection, 0);
  }, [nodes, edges, pushSnapshot, syncSection]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const snapshot = undo(nodes, edges);
        if (snapshot) {
          setNodes(snapshot.nodes);
          setEdges(snapshot.edges);
          setTimeout(() => {
            const updated = flowToSection(currentSectionRef.current, snapshot.nodes, snapshot.edges);
            onSectionUpdate(updated);
          }, 0);
        }
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const snapshot = redo(nodes, edges);
        if (snapshot) {
          setNodes(snapshot.nodes);
          setEdges(snapshot.edges);
          setTimeout(() => {
            const updated = flowToSection(currentSectionRef.current, snapshot.nodes, snapshot.edges);
            onSectionUpdate(updated);
          }, 0);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodes, edges, undo, redo, setNodes, setEdges, onSectionUpdate]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'subgraph') return;
    const data = node.data as TaskNodeData;
    setEditingTask(data.task);
    setIsNewTask(false);
    setEditorOpen(true);
  }, []);

  const handleAddNode = useCallback(() => {
    setEditingTask(null);
    setIsNewTask(true);
    setEditorOpen(true);
  }, []);

  const handleSaveTask = useCallback((task: Task) => {
    pushSnapshot(nodes, edges);
    const style = section.styles[task.style] || { fill: 'hsl(var(--muted-foreground))', stroke: '#444', color: '#fff' };

    if (isNewTask) {
      const newNode: Node = {
        id: task.id || generateNextId(section.tasks),
        type: 'custom',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { task, fill: style.fill, stroke: style.stroke, color: style.color } satisfies TaskNodeData,
      };
      setNodes(nds => [...nds, newNode]);

      const newEdges = task.connectsTo.map(target => ({
        id: `${task.id}-${target}`,
        source: task.id,
        target,
        type: 'custom' as const,
        data: {},
      }));
      setEdges(eds => [...eds, ...newEdges]);
    } else {
      setNodes(nds => nds.map(n => {
        if (n.id !== task.id) return n;
        return {
          ...n,
          data: { task, fill: style.fill, stroke: style.stroke, color: style.color } satisfies TaskNodeData,
        };
      }));

      setEdges(eds => {
        const withoutOld = eds.filter(e => e.source !== task.id);
        const newEdges = task.connectsTo.map(target => {
          const edgeLabel = task.edgeLabels?.[target];
          return {
            id: `${task.id}-${target}`,
            source: task.id,
            target,
            type: 'custom' as const,
            label: edgeLabel || undefined,
            data: {},
          };
        });
        return [...withoutOld, ...newEdges];
      });
    }

    setEditorOpen(false);
    setTimeout(syncSection, 0);
  }, [isNewTask, section.styles, section.tasks, setNodes, setEdges, syncSection, nodes, edges, pushSnapshot]);

  const handleDeleteTask = useCallback((id: string) => {
    pushSnapshot(nodes, edges);
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setEditorOpen(false);
    setTimeout(syncSection, 0);
  }, [setNodes, setEdges, syncSection, nodes, edges, pushSnapshot]);

  const handleAutoLayout = useCallback(async () => {
    pushSnapshot(nodes, edges);
    const layouted = await applyLayout(nodes, edges);
    setNodes(layouted);
    if (rfInstance.current) {
      waitForMeasuredThenFit(rfInstance.current, fitView);
    }
  }, [nodes, edges, applyLayout, setNodes, fitView, pushSnapshot]);

  const handleExport = useCallback(() => {
    const updated = flowToSection(currentSectionRef.current, nodes, edges);
    const json = JSON.stringify(updated, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges, section.id]);

  const handleExportPng = useCallback(async () => {
    const el = canvasRef.current?.querySelector('.react-flow') as HTMLElement | null;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        style: { width: el.scrollWidth + 'px', height: el.scrollHeight + 'px' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${section.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  }, [section.id]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text) as SectionData;
        if (!data.id || !data.tasks) {
          alert('Invalid JSON: missing id or tasks');
          return;
        }
        pushSnapshot(nodes, edges);
        onSectionUpdate(data);
        const { nodes: newNodes, edges: newEdges } = sectionToFlow(data);
        const layouted = await applyLayout(newNodes, newEdges);
        setNodes(layouted);
        setEdges(newEdges);
        if (rfInstance.current) {
          waitForMeasuredThenFit(rfInstance.current, fitView);
        }
      } catch {
        alert('Error reading JSON file');
      }
    };
    input.click();
  }, [onSectionUpdate, applyLayout, setNodes, setEdges, fitView, nodes, edges, pushSnapshot]);

  const handleUndo = useCallback(() => {
    const snapshot = undo(nodes, edges);
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setTimeout(() => {
        const updated = flowToSection(currentSectionRef.current, snapshot.nodes, snapshot.edges);
        onSectionUpdate(updated);
      }, 0);
    }
  }, [nodes, edges, undo, setNodes, setEdges, onSectionUpdate]);

  const handleRedo = useCallback(() => {
    const snapshot = redo(nodes, edges);
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setTimeout(() => {
        const updated = flowToSection(currentSectionRef.current, snapshot.nodes, snapshot.edges);
        onSectionUpdate(updated);
      }, 0);
    }
  }, [nodes, edges, redo, setNodes, setEdges, onSectionUpdate]);

  const handleConnect = useCallback((connection: Parameters<typeof onConnect>[0]) => {
    pushSnapshot(nodes, edges);
    onConnect(connection);
    setTimeout(syncSection, 0);
  }, [onConnect, nodes, edges, pushSnapshot, syncSection]);

  const handleAddGroup = useCallback(() => {
    setGroupName('');
    setGroupSelectedTasks([]);
    setGroupDialogOpen(true);
  }, []);

  const handleSaveGroup = useCallback(() => {
    if (!groupName.trim() || groupSelectedTasks.length === 0) return;
    pushSnapshot(nodes, edges);

    const groupId = groupName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const newSubgraph: Subgraph = {
      id: groupId,
      title: groupName.trim(),
      taskIds: groupSelectedTasks,
    };

    const updatedSection: SectionData = {
      ...currentSectionRef.current,
      subgraphs: [...(currentSectionRef.current.subgraphs || []), newSubgraph],
    };
    onSectionUpdate(updatedSection);

    const { nodes: newNodes, edges: newEdges } = sectionToFlow(updatedSection);
    applyLayout(newNodes, newEdges).then(layouted => {
      setNodes(layouted);
      setEdges(newEdges);
      if (rfInstance.current) {
        waitForMeasuredThenFit(rfInstance.current, fitView);
      }
    });

    setGroupDialogOpen(false);
  }, [groupName, groupSelectedTasks, onSectionUpdate, applyLayout, setNodes, setEdges, fitView, nodes, edges, pushSnapshot]);

  const toggleGroupTask = (taskId: string) => {
    setGroupSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const availableForGrouping = section.tasks.filter(t => {
    if (!section.subgraphs) return true;
    return !section.subgraphs.some(sg => sg.taskIds.includes(t.id));
  });

  return (
    <FilterContext.Provider value={filterValue}>
      <div className="flex flex-col flex-1 min-h-0">
        <Toolbar
          onAddNode={handleAddNode}
          onAutoLayout={handleAutoLayout}
          onFitView={() => fitView({ padding: 0.05 })}
          onImport={handleImport}
          onExport={handleExport}
          onExportPng={handleExportPng}
          view={view}
          onToggleView={() => setView(v => v === 'chart' ? 'table' : 'chart')}
          onAddGroup={handleAddGroup}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          assignees={assignees}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          legendContent={<LegendDropdown items={section.legend} />}
        />

        {view === 'chart' ? (
          <div ref={canvasRef} className="flex-1 min-h-0 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onNodesDelete={handleNodesDelete}
              onEdgesDelete={handleEdgesDelete}
              onNodeClick={handleNodeClick}
              onInit={handleInit}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              deleteKeyCode="Delete"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(n) => {
                  if (n.type === 'subgraph') return 'hsl(var(--border))';
                  const data = n.data as TaskNodeData;
                  return data.fill;
                }}
                style={{ borderRadius: 8 }}
              />
            </ReactFlow>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full pointer-events-none">
              Drag from handle to connect · Double-click edge midpoint to add label
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <DetailTable section={section} />
          </div>
        )}

        <NodeEditorPanel
          task={editingTask}
          section={section}
          isOpen={editorOpen}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setEditorOpen(false)}
          isNew={isNewTask}
        />

        {/* Group creation dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>
                Group related tasks together to visually organize the flowchart.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Group Name
                </label>
                <Input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="e.g. Phase 1: Deposition Scheduling"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Select Tasks ({groupSelectedTasks.length} selected)
                </label>
                <div className="max-h-60 overflow-auto border border-border rounded-md p-1">
                  {availableForGrouping.length === 0 ? (
                    <div className="p-4 text-muted-foreground text-sm text-center">
                      All tasks are already in groups
                    </div>
                  ) : (
                    availableForGrouping.map(t => {
                      const isChecked = groupSelectedTasks.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                            isChecked ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleGroupTask(t.id)}
                            className="rounded border-input"
                          />
                          <span className="font-medium min-w-10 text-xs text-muted-foreground">{t.id}</span>
                          <span>{t.label.split('\n')[0]}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {section.subgraphs && section.subgraphs.length > 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                    Existing Groups
                  </div>
                  {section.subgraphs.map(sg => (
                    <div key={sg.id} className="text-muted-foreground py-0.5">
                      {sg.title} ({sg.taskIds.length} tasks)
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveGroup}
                disabled={!groupName.trim() || groupSelectedTasks.length === 0}
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FilterContext.Provider>
  );
}
