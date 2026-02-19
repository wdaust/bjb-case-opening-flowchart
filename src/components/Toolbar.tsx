import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Separator } from './ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.tsx';
import {
  Plus, Group, Undo2, Redo2, LayoutDashboard, Maximize2,
  FileDown, FileUp, Image, Table2, GitBranch,
} from 'lucide-react';

interface Props {
  onAddNode: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onImport: () => void;
  onExport: () => void;
  onExportPng: () => void;
  view: 'chart' | 'table';
  onToggleView: () => void;
  onAddGroup: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (a: string) => void;
  assignees: string[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  legendContent?: React.ReactNode;
}

function ToolbarButton({ onClick, disabled, tooltip, children, variant = 'ghost', size = 'sm' }: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
  variant?: 'ghost' | 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'icon';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} onClick={onClick} disabled={disabled}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  onAddNode, onAutoLayout, onFitView,
  onImport, onExport, onExportPng,
  view, onToggleView, onAddGroup,
  searchQuery, onSearchChange,
  assigneeFilter, onAssigneeFilterChange, assignees,
  onUndo, onRedo, canUndo, canRedo,
  legendContent,
}: Props) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b border-border flex-wrap shrink-0">
      <ToolbarButton onClick={onAddNode} tooltip="Add new node" variant="default" size="sm">
        <Plus className="h-4 w-4" /> Add Node
      </ToolbarButton>
      <ToolbarButton onClick={onAddGroup} tooltip="Group tasks" variant="outline" size="sm">
        <Group className="h-4 w-4" /> Group
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)">
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={onAutoLayout} tooltip="Auto layout nodes">
        <LayoutDashboard className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onFitView} tooltip="Fit to view">
        <Maximize2 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={onImport} tooltip="Import JSON" variant="outline">
        <FileUp className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onExport} tooltip="Export JSON" variant="outline">
        <FileDown className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onExportPng} tooltip="Export PNG" variant="outline">
        <Image className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton onClick={onToggleView} tooltip={view === 'chart' ? 'Switch to table view' : 'Switch to chart view'} variant={view === 'table' ? 'secondary' : 'ghost'}>
        {view === 'chart' ? <Table2 className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />}
        {view === 'chart' ? 'Table' : 'Chart'}
      </ToolbarButton>

      {legendContent}

      <div className="flex-1 min-w-2" />

      <Input
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search nodes..."
        className="w-40 h-8 text-xs"
      />

      <select
        value={assigneeFilter}
        onChange={e => onAssigneeFilterChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">All Assignees</option>
        {assignees.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
