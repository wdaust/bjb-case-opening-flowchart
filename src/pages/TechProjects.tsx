// ── Tech Projects — Firm-wide IT project tracking dashboard ────────────────
// Three view modes: Card Grid, Kanban Board, and List Table.
// Persisted to Neon Postgres via loadGenericSection / saveGenericSection.

import { useState, useEffect, useRef, useMemo } from 'react';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { DataTable, type Column } from '../components/dashboard/DataTable.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { cn } from '../utils/cn.ts';
import {
  CheckCircle2,
  LayoutGrid, Columns3, List, Search, X, Plus, Trash2,
  Pin, PinOff, ChevronDown, User, Calendar,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type {
  TechProject, TechProjectsStore, ProjectStatus, ProjectPriority,
  ProjectHealth, ProjectCategory,
} from '../data/techProjectsData.ts';
import {
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, HEALTH_LABELS,
  PRIORITY_COLORS, HEALTH_DOT_COLORS, STATUS_COLORS,
  CATEGORY_COLORS, STATUS_CHART_COLORS, PRIORITY_CHART_COLORS,
  KANBAN_COLUMNS, TEAM_MEMBERS,
  ALL_STATUSES, ALL_PRIORITIES, ALL_HEALTHS, ALL_CATEGORIES,
  createEmptyProject, createEmptyTask, createEmptyNote, computeStats,
  SEED_PROJECTS,
} from '../data/techProjectsData.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'kanban' | 'list';
type SyncStatus = '' | 'Loading...' | 'Saving...' | 'Synced' | 'Saved' | 'Offline — changes not saved' | 'Save failed';

interface Filters {
  search: string;
  status: ProjectStatus | 'all';
  priority: ProjectPriority | 'all';
  health: ProjectHealth | 'all';
  category: ProjectCategory | 'all';
  owner: string | 'all';
}

const DEFAULT_FILTERS: Filters = {
  search: '', status: 'all', priority: 'all', health: 'all', category: 'all', owner: 'all',
};

const STORE_KEY = 'tech-projects';

// ─── Debounced save (matches MOS pattern) ────────────────────────────────────

function useDebouncedSave<T>(key: string, data: T, delay: number, enabled: boolean, onStatus: (s: SyncStatus) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!enabled) return;
    onStatus('Saving...');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ok = await saveGenericSection(key, data);
      onStatus(ok ? 'Saved' : 'Save failed');
      if (ok) setTimeout(() => onStatus(''), 2000);
    }, delay);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), key, delay, enabled]);
}

// ─── Relative time helper ────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Badge helper ────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border', className)}>
      {children}
    </span>
  );
}

// ─── Filter Select ───────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-8 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-xs text-gray-300 px-2 min-w-[110px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function TechProjects() {
  // Data
  const [projects, setProjects] = useState<TechProject[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // UI
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedProject, setSelectedProject] = useState<TechProject | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'tasks' | 'notes'>('overview');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);

  // ── Load data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setSyncStatus('Loading...');
      const ok = await initDb();
      if (!ok) { setSyncStatus('Offline — changes not saved'); setDataLoaded(true); return; }
      const store = await loadGenericSection<TechProjectsStore>(STORE_KEY);
      if (store?.projects) setProjects(store.projects);
      setDataLoaded(true);
      setSyncStatus('Synced');
      setTimeout(() => setSyncStatus(''), 3000);
    })();
  }, []);

  // ── Debounced save ──────────────────────────────────────────────────────

  const storeData = useMemo<TechProjectsStore>(() => ({ projects, version: 1 }), [projects]);
  useDebouncedSave(STORE_KEY, storeData, 800, dataLoaded, setSyncStatus);

  // ── Keep selected project synced ────────────────────────────────────────

  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [projects, selectedProject?.id]);

  // ── Filtering ───────────────────────────────────────────────────────────

  const owners = useMemo(() => {
    const set = new Set(projects.map(p => p.owner).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)
            && !p.owner.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q)))
          return false;
      }
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.priority !== 'all' && p.priority !== filters.priority) return false;
      if (filters.health !== 'all' && p.health !== filters.health) return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.owner !== 'all' && p.owner !== filters.owner) return false;
      return true;
    });
  }, [projects, filters]);

  const stats = useMemo(() => computeStats(projects), [projects]);

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all' || filters.priority !== 'all'
    || filters.health !== 'all' || filters.category !== 'all' || filters.owner !== 'all';

  // ── CRUD ────────────────────────────────────────────────────────────────

  const updateProject = (id: string, data: Partial<TechProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setDetailOpen(false);
    setSelectedProject(null);
  };

  const addProject = (project: TechProject) => {
    setProjects(prev => [project, ...prev]);
  };

  const openDetail = (project: TechProject) => {
    setSelectedProject(project);
    setDetailTab('overview');
    setDetailOpen(true);
  };

  // ── Seed button ─────────────────────────────────────────────────────────

  const seedData = () => {
    setProjects(SEED_PROJECTS);
  };

  // ── Sync status styling ─────────────────────────────────────────────────

  const syncColor = syncStatus === 'Synced' || syncStatus === 'Saved' ? '#10b981'
    : syncStatus === 'Save failed' || syncStatus.startsWith('Offline') ? '#ef4444'
    : syncStatus ? '#737373' : 'transparent';

  // ── Chart data ──────────────────────────────────────────────────────────

  const statusChartData = ALL_STATUSES.map(s => ({
    name: STATUS_LABELS[s], value: projects.filter(p => p.status === s).length, fill: STATUS_CHART_COLORS[s],
  })).filter(d => d.value > 0);

  const priorityChartData = ALL_PRIORITIES.map(p => ({
    name: PRIORITY_LABELS[p], value: projects.filter(proj => proj.priority === p).length, fill: PRIORITY_CHART_COLORS[p],
  }));

  const healthChartData = ALL_HEALTHS.map(h => ({
    name: HEALTH_LABELS[h],
    value: projects.filter(p => p.health === h && p.status !== 'done').length,
    fill: h === 'green' ? '#10b981' : h === 'amber' ? '#f59e0b' : '#ef4444',
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[{ label: 'Tech Projects' }]} />

      {/* Header bar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] px-6 py-4 rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Tech Projects</h1>
          {syncStatus && (
            <span className="text-[11px] font-medium" style={{ color: syncColor }}>{syncStatus}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {projects.length === 0 && (
            <button onClick={seedData}
              className="h-8 px-3 rounded-md bg-violet-600 hover:bg-violet-700 text-xs text-white font-medium transition-colors">
              Load Sample Data
            </button>
          )}
          <button onClick={() => setNewDialogOpen(true)}
            className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-medium transition-colors flex items-center gap-1">
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <DashboardGrid cols={5}>
        <StatCard label="Active" value={stats.activeCount} delta="" deltaType="neutral" />
        <StatCard label="On Track" value={stats.onTrackCount} delta="" deltaType="positive" />
        <StatCard label="At Risk" value={stats.atRiskCount} delta="" deltaType={stats.atRiskCount > 0 ? 'negative' : 'neutral'} />
        <StatCard label="Overdue Tasks" value={stats.overdueTasks} delta="" deltaType={stats.overdueTasks > 0 ? 'negative' : 'neutral'} />
        <StatCard label="Done This Month" value={stats.completedThisMonth} delta="" deltaType="positive" />
      </DashboardGrid>

      {/* View Toggle + Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
            {([['grid', LayoutGrid], ['kanban', Columns3], ['list', List]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn('h-7 w-8 rounded flex items-center justify-center transition-colors',
                  viewMode === mode ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white')}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input placeholder="Search projects..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
          </div>
          <FilterSelect value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v as any }))}
            options={[{ value: 'all', label: 'All Status' }, ...ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))]} />
          <FilterSelect value={filters.priority} onChange={v => setFilters(f => ({ ...f, priority: v as any }))}
            options={[{ value: 'all', label: 'All Priority' }, ...ALL_PRIORITIES.map(p => ({ value: p, label: PRIORITY_LABELS[p] }))]} />
          <FilterSelect value={filters.health} onChange={v => setFilters(f => ({ ...f, health: v as any }))}
            options={[{ value: 'all', label: 'All Health' }, ...ALL_HEALTHS.map(h => ({ value: h, label: HEALTH_LABELS[h] }))]} />
          <FilterSelect value={filters.category} onChange={v => setFilters(f => ({ ...f, category: v as any }))}
            options={[{ value: 'all', label: 'All Category' }, ...ALL_CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))]} />
          {owners.length > 0 && (
            <FilterSelect value={filters.owner} onChange={v => setFilters(f => ({ ...f, owner: v }))}
              options={[{ value: 'all', label: 'All Owners' }, ...owners.map(o => ({ value: o, label: o }))]} />
          )}
          {hasActiveFilters && (
            <button onClick={() => setFilters(DEFAULT_FILTERS)}
              className="h-8 px-2 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main View */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-12 text-center">
          <p className="text-gray-500">
            {projects.length === 0 ? 'No projects yet. Create your first project or load sample data.' : 'No projects match current filters.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <CardGridView projects={filteredProjects} onSelect={openDetail} />
      ) : viewMode === 'kanban' ? (
        <KanbanView projects={filteredProjects} onSelect={openDetail}
          onStatusChange={(id, status) => updateProject(id, { status })} />
      ) : (
        <ListTableView projects={filteredProjects} onSelect={openDetail} />
      )}

      {/* Charts */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <button onClick={() => setChartsOpen(!chartsOpen)}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Charts
            <ChevronDown size={14} className={cn('transition-transform', !chartsOpen && '-rotate-90')} />
          </button>
          {chartsOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">By Status</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10} stroke="none">
                    {statusChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie><Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">By Priority</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">Health (Active)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={healthChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10} stroke="none">
                    {healthChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie><Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {detailOpen && selectedProject && (
        <DetailPanel project={selectedProject} tab={detailTab} onTabChange={setDetailTab}
          onClose={() => { setDetailOpen(false); setSelectedProject(null); }}
          onUpdate={updateProject} onDelete={deleteProject} />
      )}

      {/* New Project Dialog */}
      {newDialogOpen && (
        <NewProjectDialog onClose={() => setNewDialogOpen(false)}
          onSubmit={p => { addProject(p); setNewDialogOpen(false); }} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD GRID VIEW
// ═════════════════════════════════════════════════════════════════════════════

function CardGridView({ projects, onSelect }: { projects: TechProject[]; onSelect: (p: TechProject) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {projects.map(project => (
        <div key={project.id} onClick={() => onSelect(project)}
          className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4 cursor-pointer hover:border-[#3a3a3a] hover:bg-[#151515] transition-colors space-y-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', HEALTH_DOT_COLORS[project.health])} />
            <p className="font-semibold text-sm text-white truncate flex-1">{project.name}</p>
            <Badge className={cn(PRIORITY_COLORS[project.priority].bg, PRIORITY_COLORS[project.priority].text, PRIORITY_COLORS[project.priority].border)}>
              {PRIORITY_LABELS[project.priority]}
            </Badge>
          </div>
          <Badge className={cn(CATEGORY_COLORS[project.category].bg, CATEGORY_COLORS[project.category].text, 'border-transparent')}>
            {CATEGORY_LABELS[project.category]}
          </Badge>
          <p className="text-xs text-gray-500 line-clamp-2">{project.description || 'No description'}</p>
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Progress</span><span>{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all',
                project.progress >= 100 ? 'bg-emerald-500' : project.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500')}
                style={{ width: `${Math.min(project.progress, 100)}%` }} />
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5"><User size={10} />{project.owner}</span>
              {project.targetDate && <span className="flex items-center gap-0.5"><Calendar size={10} />{project.targetDate}</span>}
            </div>
            <span>{project.tasks.filter(t => t.status === 'done').length}/{project.tasks.length} tasks</span>
          </div>
          <Badge className={cn(STATUS_COLORS[project.status].bg, STATUS_COLORS[project.status].text, 'border-transparent')}>
            {STATUS_LABELS[project.status]}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// KANBAN VIEW
// ═════════════════════════════════════════════════════════════════════════════

function KanbanView({ projects, onSelect, onStatusChange }: {
  projects: TechProject[]; onSelect: (p: TechProject) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLUMNS.map(col => {
          const items = projects.filter(p => p.status === col.status);
          return (
            <div key={col.status} className={cn('w-[260px] shrink-0 rounded-lg p-2 space-y-2',
              col.muted ? 'bg-[#0d0d0d]' : 'bg-[#141414]')}>
              <div className="flex items-center justify-between px-1">
                <span className={cn('text-xs font-semibold', col.muted ? 'text-gray-600' : 'text-gray-300')}>{col.label}</span>
                <span className="text-[10px] text-gray-600 bg-[#1a1a1a] rounded-full px-1.5">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(project => (
                  <div key={project.id} onClick={() => onSelect(project)}
                    className={cn('rounded-lg border border-[#2a2a2a] bg-[#111] p-3 cursor-pointer hover:border-[#3a3a3a] transition-colors space-y-2',
                      col.muted && 'opacity-60')}>
                    <div className="flex items-center gap-1.5">
                      <div className={cn('h-2 w-2 rounded-full shrink-0', HEALTH_DOT_COLORS[project.health])} />
                      <p className="text-xs font-medium text-white truncate flex-1">{project.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn(PRIORITY_COLORS[project.priority].bg, PRIORITY_COLORS[project.priority].text, PRIORITY_COLORS[project.priority].border, 'text-[9px]')}>
                        {PRIORITY_LABELS[project.priority]}
                      </Badge>
                      <span className="text-[10px] text-gray-500 ml-auto">{project.progress}%</span>
                    </div>
                    <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <select value={project.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); onStatusChange(project.id, e.target.value as ProjectStatus); }}
                      className="w-full h-6 rounded border border-[#2a2a2a] bg-[#1a1a1a] text-[10px] text-gray-400 px-1 focus:outline-none">
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LIST TABLE VIEW
// ═════════════════════════════════════════════════════════════════════════════

function ListTableView({ projects, onSelect }: { projects: TechProject[]; onSelect: (p: TechProject) => void }) {
  const columns: Column<TechProject>[] = useMemo(() => [
    { key: 'health', label: '', sortable: false,
      render: (row) => <div className={cn('h-3 w-3 rounded-full', HEALTH_DOT_COLORS[row.health])} /> },
    { key: 'name', label: 'Name',
      render: (row) => <button onClick={() => onSelect(row)} className="text-sm font-medium text-emerald-400 hover:underline text-left">{row.name}</button> },
    { key: 'category', label: 'Category',
      render: (row) => <Badge className={cn(CATEGORY_COLORS[row.category].bg, CATEGORY_COLORS[row.category].text, 'border-transparent')}>{CATEGORY_LABELS[row.category]}</Badge> },
    { key: 'status', label: 'Status',
      render: (row) => <Badge className={cn(STATUS_COLORS[row.status].bg, STATUS_COLORS[row.status].text, 'border-transparent')}>{STATUS_LABELS[row.status]}</Badge> },
    { key: 'priority', label: 'Priority',
      render: (row) => <Badge className={cn(PRIORITY_COLORS[row.priority].bg, PRIORITY_COLORS[row.priority].text, PRIORITY_COLORS[row.priority].border)}>{PRIORITY_LABELS[row.priority]}</Badge> },
    { key: 'owner', label: 'Owner' },
    { key: 'progress', label: 'Progress',
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="h-1.5 flex-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.progress}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 w-8 text-right">{row.progress}%</span>
        </div>
      ) },
    { key: 'targetDate', label: 'Target' },
    { key: 'tasks', label: 'Tasks', sortable: false,
      render: (row) => <span className="text-xs text-gray-500">{row.tasks.filter(t => t.status === 'done').length}/{row.tasks.length}</span> },
  ], [onSelect]);

  return <DataTable data={projects} columns={columns} keyField="id" maxRows={25} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL (slide-in)
// ═════════════════════════════════════════════════════════════════════════════

function DetailPanel({ project, tab, onTabChange, onClose, onUpdate, onDelete }: {
  project: TechProject; tab: 'overview' | 'tasks' | 'notes';
  onTabChange: (t: 'overview' | 'tasks' | 'notes') => void;
  onClose: () => void; onUpdate: (id: string, data: Partial<TechProject>) => void;
  onDelete: (id: string) => void;
}) {
  const [editDesc, setEditDesc] = useState(project.description);
  const [editProgress, setEditProgress] = useState(project.progress);
  const [editTags, setEditTags] = useState(project.tags.join(', '));
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    setEditDesc(project.description);
    setEditProgress(project.progress);
    setEditTags(project.tags.join(', '));
  }, [project.id, project.description, project.progress, project.tags]);

  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const autoProgress = project.tasks.length > 0 ? Math.round((doneTasks / project.tasks.length) * 100) : 0;

  const inputCls = 'w-full h-8 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-xs text-gray-300 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50';
  const selectCls = inputCls;
  const labelCls = 'text-[10px] text-gray-500 uppercase tracking-wider mb-1 block';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[640px] bg-[#111] border-l border-[#2a2a2a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('h-3 w-3 rounded-full shrink-0', HEALTH_DOT_COLORS[project.health])} />
            <h2 className="font-semibold text-white truncate">{project.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(project.id)} className="h-8 w-8 rounded flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="h-8 w-8 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#2a2a2a]">
          {(['overview', 'tasks', 'notes'] as const).map(t => (
            <button key={t} onClick={() => onTabChange(t)}
              className={cn('flex-1 py-2.5 text-xs font-medium text-center transition-colors border-b-2',
                tab === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300')}>
              {t === 'overview' ? 'Overview' : t === 'tasks' ? `Tasks (${project.tasks.length})` : `Notes (${project.notes.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'overview' && <>
            <div><label className={labelCls}>Description</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                onBlur={() => { if (editDesc !== project.description) onUpdate(project.id, { description: editDesc }); }}
                rows={3} className={cn(inputCls, 'h-auto py-2')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Category</label>
                <select value={project.category} onChange={e => onUpdate(project.id, { category: e.target.value as ProjectCategory })} className={selectCls}>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select></div>
              <div><label className={labelCls}>Status</label>
                <select value={project.status} onChange={e => {
                  const s = e.target.value as ProjectStatus;
                  const updates: Partial<TechProject> = { status: s };
                  if (s === 'done' && !project.completedDate) updates.completedDate = new Date().toISOString().split('T')[0];
                  onUpdate(project.id, updates);
                }} className={selectCls}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select></div>
              <div><label className={labelCls}>Priority</label>
                <select value={project.priority} onChange={e => onUpdate(project.id, { priority: e.target.value as ProjectPriority })} className={selectCls}>
                  {ALL_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select></div>
              <div><label className={labelCls}>Owner</label>
                <input value={project.owner} onChange={e => onUpdate(project.id, { owner: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Start Date</label>
                <input type="date" value={project.startDate} onChange={e => onUpdate(project.id, { startDate: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Target Date</label>
                <input type="date" value={project.targetDate} onChange={e => onUpdate(project.id, { targetDate: e.target.value })} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Stakeholders (comma-separated)</label>
              <input value={project.stakeholders.join(', ')}
                onChange={e => onUpdate(project.id, { stakeholders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className={inputCls} /></div>
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Progress: {editProgress}%</label>
                {project.tasks.length > 0 && (
                  <button onClick={() => { setEditProgress(autoProgress); onUpdate(project.id, { progress: autoProgress }); }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300">Auto ({autoProgress}%)</button>
                )}
              </div>
              <input type="range" min={0} max={100} value={editProgress}
                onChange={e => setEditProgress(Number(e.target.value))}
                onMouseUp={() => onUpdate(project.id, { progress: editProgress })}
                onTouchEnd={() => onUpdate(project.id, { progress: editProgress })}
                className="w-full accent-emerald-500" />
            </div>
            {/* Health */}
            <div><label className={labelCls}>Health</label>
              <div className="flex gap-2">
                {ALL_HEALTHS.map(h => (
                  <button key={h} onClick={() => onUpdate(project.id, { health: h })}
                    className={cn('h-8 px-3 rounded-md text-xs font-medium transition-colors border',
                      project.health === h
                        ? h === 'green' ? 'bg-emerald-600 border-emerald-600 text-white' : h === 'amber' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-red-500 border-red-500 text-white'
                        : 'border-[#2a2a2a] text-gray-400 hover:text-white')}>
                    {HEALTH_LABELS[h]}
                  </button>
                ))}
              </div></div>
            {/* Tags */}
            <div><label className={labelCls}>Tags (comma-separated)</label>
              <input value={editTags} onChange={e => setEditTags(e.target.value)}
                onBlur={() => {
                  const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
                  if (JSON.stringify(tags) !== JSON.stringify(project.tags)) onUpdate(project.id, { tags });
                }}
                placeholder="e.g. litify, salesforce, migration" className={inputCls} /></div>
          </>}

          {tab === 'tasks' && <>
            <div className="flex gap-2">
              <input placeholder="New task title..." value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTaskTitle.trim()) {
                    const t = createEmptyTask(); t.title = newTaskTitle.trim();
                    onUpdate(project.id, { tasks: [...project.tasks, t] }); setNewTaskTitle('');
                  }
                }} className={cn(inputCls, 'flex-1')} />
              <button disabled={!newTaskTitle.trim()}
                onClick={() => { const t = createEmptyTask(); t.title = newTaskTitle.trim(); onUpdate(project.id, { tasks: [...project.tasks, t] }); setNewTaskTitle(''); }}
                className="h-8 w-8 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white flex items-center justify-center transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {project.tasks.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No tasks yet</p>
            ) : (
              <div className="space-y-1">
                {project.tasks.map((task, idx) => (
                  <div key={task.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                    <button onClick={() => {
                      const updated = [...project.tasks];
                      updated[idx] = { ...task, status: task.status === 'done' ? 'todo' : 'done' };
                      onUpdate(project.id, { tasks: updated });
                    }} className={cn('h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600')}>
                      {task.status === 'done' && <CheckCircle2 size={10} className="text-white" />}
                    </button>
                    <input value={task.title}
                      onChange={e => { const u = [...project.tasks]; u[idx] = { ...task, title: e.target.value }; onUpdate(project.id, { tasks: u }); }}
                      className={cn('flex-1 bg-transparent border-0 text-xs text-gray-300 focus:outline-none', task.status === 'done' && 'line-through text-gray-600')} />
                    <select value={task.assignee}
                      onChange={e => { const u = [...project.tasks]; u[idx] = { ...task, assignee: e.target.value }; onUpdate(project.id, { tasks: u }); }}
                      className="h-6 w-24 bg-transparent border-0 text-[10px] text-gray-500 focus:outline-none">
                      {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <Badge className={cn(PRIORITY_COLORS[task.priority].bg, PRIORITY_COLORS[task.priority].text, PRIORITY_COLORS[task.priority].border, 'text-[9px]')}>
                      {task.priority}
                    </Badge>
                    <input type="date" value={task.dueDate || ''}
                      onChange={e => { const u = [...project.tasks]; u[idx] = { ...task, dueDate: e.target.value }; onUpdate(project.id, { tasks: u }); }}
                      className="h-6 w-28 bg-transparent border-0 text-[10px] text-gray-500 focus:outline-none" />
                    <button onClick={() => onUpdate(project.id, { tasks: project.tasks.filter((_, i) => i !== idx) })}
                      className="h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>}

          {tab === 'notes' && <>
            <div className="space-y-2">
              <textarea placeholder="Add a note..." value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                rows={2} className={cn(inputCls, 'h-auto py-2')} />
              <button disabled={!newNoteContent.trim()}
                onClick={() => {
                  const n = createEmptyNote('You'); n.content = newNoteContent.trim();
                  onUpdate(project.id, { notes: [...project.notes, n] }); setNewNoteContent('');
                }}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-xs text-white font-medium transition-colors">
                Add Note
              </button>
            </div>
            {project.notes.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No notes yet</p>
            ) : (
              <div className="space-y-2">
                {[...project.notes]
                  .sort((a, b) => { if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1; return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); })
                  .map(note => (
                    <div key={note.id} className={cn('group rounded-lg border p-3', note.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#2a2a2a] bg-[#141414]')}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {note.pinned && <Pin size={10} className="text-amber-400 shrink-0" />}
                            <span className="text-xs font-medium text-gray-300">{note.author}</span>
                            <span className="text-[10px] text-gray-600">{relativeTime(note.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-400 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onUpdate(project.id, { notes: project.notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n) })}
                            className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                          <button onClick={() => onUpdate(project.id, { notes: project.notes.filter(n => n.id !== note.id) })}
                            className="h-6 w-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NEW PROJECT DIALOG
// ═════════════════════════════════════════════════════════════════════════════

function NewProjectDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: TechProject) => void }) {
  const [project, setProject] = useState<TechProject>(createEmptyProject());
  const inputCls = 'w-full h-8 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-xs text-gray-300 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50';
  const labelCls = 'text-[10px] text-gray-500 uppercase tracking-wider mb-1 block';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">New Tech Project</h2>
        <div><label className={labelCls}>Name *</label>
          <input value={project.name} onChange={e => setProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" className={inputCls} /></div>
        <div><label className={labelCls}>Description</label>
          <textarea value={project.description} onChange={e => setProject(p => ({ ...p, description: e.target.value }))}
            placeholder="Brief description..." rows={2} className={cn(inputCls, 'h-auto py-2')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Category</label>
            <select value={project.category} onChange={e => setProject(p => ({ ...p, category: e.target.value as ProjectCategory }))} className={inputCls}>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select></div>
          <div><label className={labelCls}>Priority</label>
            <select value={project.priority} onChange={e => setProject(p => ({ ...p, priority: e.target.value as ProjectPriority }))} className={inputCls}>
              {ALL_PRIORITIES.map(pp => <option key={pp} value={pp}>{PRIORITY_LABELS[pp]}</option>)}
            </select></div>
        </div>
        <div><label className={labelCls}>Owner</label>
          <input value={project.owner} onChange={e => setProject(p => ({ ...p, owner: e.target.value }))} placeholder="Project owner" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Start Date</label>
            <input type="date" value={project.startDate} onChange={e => setProject(p => ({ ...p, startDate: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Target Date</label>
            <input type="date" value={project.targetDate} onChange={e => setProject(p => ({ ...p, targetDate: e.target.value }))} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Tags (comma-separated)</label>
          <input value={project.tags.join(', ')}
            onChange={e => setProject(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
            placeholder="e.g. litify, migration, phase-1" className={inputCls} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="h-8 px-4 rounded-md border border-[#2a2a2a] text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={() => { if (project.name.trim()) onSubmit(project); }} disabled={!project.name.trim()}
            className="h-8 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-xs text-white font-medium transition-colors">
            Create
          </button>
        </div>
      </div>
    </>
  );
}
