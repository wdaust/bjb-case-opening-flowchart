import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { ensureMosMigration } from '../utils/mosMigration.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../utils/cn.ts';
import type { MeetingDef, MetricDef, MosMetricDefsData, MosContributorsData } from '../types/mos.ts';
import { MEETINGS as FALLBACK_MEETINGS } from '../data/mosMeetings.ts';
import {
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Target, Users, Plus, GripVertical, Trash2,
} from 'lucide-react';
import { ContributorManager } from '../components/mos/ContributorManager.tsx';
import { InlineEdit } from '../components/mos/InlineEdit.tsx';
import { ResponsibleDropdown } from '../components/mos/ResponsibleDropdown.tsx';
import { KpiPopover, evaluateKpi } from '../components/mos/KpiPopover.tsx';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Types ───────────────────────────────────────────────────────────────────

type WeeklyData = Record<string, string>;
type SyncStatus = '' | 'saving' | 'saved' | 'error';

// ─── Week helpers ────────────────────────────────────────────────────────────

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export function getWeekLabel(weekKey: string): string {
  const mon = new Date(weekKey + 'T00:00:00');
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)} - ${fmt(fri)}`;
}

export function generateWeeks(count: number): string[] {
  const now = new Date();
  const currentWeek = getWeekKey(now);
  const weeks: string[] = [];
  const mon = new Date(currentWeek + 'T00:00:00');
  mon.setDate(mon.getDate() - 4 * 7);
  for (let i = 0; i < count; i++) {
    weeks.push(getWeekKey(mon));
    mon.setDate(mon.getDate() + 7);
  }
  return weeks;
}

const WEEKS = generateWeeks(17);
const CURRENT_WEEK = getWeekKey(new Date());

// ─── Merge-on-save hook ─────────────────────────────────────────────────────

function useMergeOnSave(
  sectionId: string,
  data: WeeklyData,
  changedKeys: React.MutableRefObject<Set<string>>,
  enabled: boolean,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [status, setStatus] = useState<SyncStatus>('');

  useEffect(() => {
    if (!enabled || changedKeys.current.size === 0) return;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const keysToSave = new Set(changedKeys.current);
      changedKeys.current.clear();
      try {
        const current = await loadGenericSection<WeeklyData>(sectionId) ?? {};
        for (const key of keysToSave) {
          if (data[key] !== undefined) {
            current[key] = data[key];
          }
        }
        const ok = await saveGenericSection(sectionId, current);
        setStatus(ok ? 'saved' : 'error');
        if (ok) setTimeout(() => setStatus(''), 2000);
      } catch {
        setStatus('error');
      }
    }, 1200);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), sectionId, enabled]);

  return status;
}

// ─── Sortable row ───────────────────────────────────────────────────────────

function SortableRow({
  id,
  children,
  isAdmin,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.8 : undefined,
    boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.3)' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      {isAdmin && (
        <td className="py-1 px-1 w-6 sticky left-0 bg-inherit z-10">
          <button
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors',
              disabled && 'invisible',
            )}
            tabIndex={-1}
          >
            <GripVertical size={12} />
          </button>
        </td>
      )}
      {children}
    </tr>
  );
}

// ─── Scorecard table ─────────────────────────────────────────────────────────

export function ScorecardTable({
  meeting,
  weeklyData,
  onCellChange,
  isAdmin,
  onMetricUpdate,
  onDeleteMetric,
  allResponsibles,
  onReorder,
}: {
  meeting: MeetingDef;
  weeklyData: WeeklyData;
  onCellChange: (key: string, value: string) => void;
  isAdmin: boolean;
  onMetricUpdate: (uid: string, field: keyof MetricDef, value: string | boolean | number | undefined) => void;
  onDeleteMetric: (uid: string) => void;
  allResponsibles: string[];
  onReorder: (activeId: string, overId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  let currentSection = '';
  const metricSections: string[] = meeting.metrics.map(m => {
    if (m.isSection) currentSection = m.metric;
    return currentSection;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  const sortableIds = meeting.metrics.map(m => m.uid);
  const stickyLeftOffset = isAdmin ? 'left-[24px]' : 'left-0';
  const stickyLeftOffset2 = isAdmin ? 'left-[144px]' : 'left-[120px]';

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="text-xs w-full" style={{ minWidth: WEEKS.length * 80 + 400 + (isAdmin ? 24 : 0) }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
            {isAdmin && <th className="w-6 sticky left-0 bg-muted/50 z-20" />}
            <th className={cn("text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky bg-muted/50 z-20 min-w-[120px]", stickyLeftOffset)}>Responsible</th>
            <th className={cn("text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky bg-muted/50 z-20 min-w-[240px]", stickyLeftOffset2)}>Metric</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">KPI</th>
            {isAdmin && <th className="w-8" />}
            {WEEKS.map(w => (
              <th
                key={w}
                className={cn(
                  "text-center py-2 px-2 font-medium whitespace-nowrap min-w-[80px]",
                  w === CURRENT_WEEK ? "text-primary bg-primary/5" : "text-muted-foreground",
                )}
              >
                {getWeekLabel(w)}
              </th>
            ))}
          </tr>
        </thead>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <tbody>
              {meeting.metrics.map((m, idx) => {
                if (m.isSection) {
                  const isCollapsed = collapsed[m.metric] ?? false;
                  return (
                    <SortableRow key={m.uid} id={m.uid} isAdmin={isAdmin}>
                      <td
                        colSpan={3 + WEEKS.length + (isAdmin ? 1 : 0)}
                        className="py-2.5 px-3 font-semibold text-primary text-xs cursor-pointer select-none"
                        onClick={() => setCollapsed(prev => ({ ...prev, [m.metric]: !prev[m.metric] }))}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          {isAdmin ? (
                            <InlineEdit
                              value={m.metric}
                              onSave={v => onMetricUpdate(m.uid, 'metric', v)}
                            />
                          ) : m.metric}
                        </span>
                      </td>
                    </SortableRow>
                  );
                }

                const section = metricSections[idx];
                if (section && collapsed[section]) return null;

                const cellKey = (w: string) => `${meeting.id}:${m.uid}:${w}`;

                return (
                  <SortableRow
                    key={m.uid}
                    id={m.uid}
                    isAdmin={isAdmin}
                  >
                    <td className={cn("py-1.5 px-3 text-muted-foreground whitespace-nowrap sticky bg-inherit z-10 min-w-[120px]", stickyLeftOffset)}>
                      {isAdmin ? (
                        <ResponsibleDropdown
                          value={m.responsible}
                          options={allResponsibles}
                          onSave={v => onMetricUpdate(m.uid, 'responsible', v)}
                        />
                      ) : m.responsible}
                    </td>
                    <td className={cn("py-1.5 px-3 whitespace-nowrap sticky bg-inherit z-10 min-w-[240px]", stickyLeftOffset2, m.isRock && "font-semibold text-amber-400")}>
                      {m.isRock && <Target size={11} className="inline mr-1 -mt-0.5" />}
                      {isAdmin ? (
                        <InlineEdit
                          value={m.metric}
                          onSave={v => onMetricUpdate(m.uid, 'metric', v)}
                        />
                      ) : m.metric}
                    </td>
                    <td className="py-1.5 px-3 text-center whitespace-nowrap">
                      <KpiPopover
                        kpi={m.kpi}
                        kpiType={m.kpiType}
                        kpiDirection={m.kpiDirection}
                        onKpiChange={v => onMetricUpdate(m.uid, 'kpi', v)}
                        onTypeChange={v => onMetricUpdate(m.uid, 'kpiType', v)}
                        onDirectionChange={v => onMetricUpdate(m.uid, 'kpiDirection', v)}
                        isAdmin={isAdmin}
                      />
                    </td>
                    {isAdmin && (
                      <td className="py-1 px-1 text-center whitespace-nowrap">
                        <button
                          onClick={() => onMetricUpdate(m.uid, 'isRock', m.isRock ? undefined : true)}
                          className={cn(
                            "transition-colors mr-1",
                            m.isRock
                              ? "text-amber-400 hover:text-muted-foreground/60"
                              : "text-muted-foreground/30 hover:text-amber-400",
                          )}
                          title={m.isRock ? "Convert to KPI" : "Convert to Rock"}
                        >
                          <Target size={12} />
                        </button>
                        <button
                          onClick={() => {
                            const label = m.metric || 'this metric';
                            if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
                              onDeleteMetric(m.uid);
                            }
                          }}
                          className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                          title="Delete metric"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                    {WEEKS.map(w => {
                      const val = weeklyData[cellKey(w)] ?? '';
                      const evaluation = evaluateKpi(val, m.kpi, m.kpiType, m.kpiDirection);
                      return (
                        <td
                          key={w}
                          className={cn(
                            "py-0.5 px-0.5",
                            w === CURRENT_WEEK && "bg-primary/5",
                            evaluation === 'green' && "bg-green-500/10",
                            evaluation === 'red' && "bg-red-500/10",
                          )}
                        >
                          <input
                            type="text"
                            value={val}
                            onChange={e => onCellChange(cellKey(w), e.target.value)}
                            className={cn(
                              "w-full text-center text-xs py-1 px-1 rounded bg-transparent border border-transparent",
                              "focus:border-primary/40 focus:bg-primary/5 focus:outline-none transition-colors",
                              "hover:border-border",
                              evaluation === 'green' && "text-green-400",
                              evaluation === 'red' && "text-red-400",
                            )}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                  </SortableRow>
                );
              })}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
}

// ─── Summary KPIs for a meeting ──────────────────────────────────────────────

function MeetingSummary({ meeting, weeklyData }: { meeting: MeetingDef; weeklyData: WeeklyData }) {
  let filledThisWeek = 0;
  let totalMetrics = 0;
  const responsibleSet = new Set<string>();

  meeting.metrics.forEach((m) => {
    if (m.isSection) return;
    totalMetrics++;
    if (m.responsible) responsibleSet.add(m.responsible);
    const key = `${meeting.id}:${m.uid}:${CURRENT_WEEK}`;
    if (weeklyData[key]?.trim()) filledThisWeek++;
  });

  const rocks = meeting.metrics.filter(m => m.isRock).length;

  return (
    <DashboardGrid cols={4} className="mb-6">
      <StatCard label="Team Members" value={responsibleSet.size} variant="glass" />
      <StatCard label="Total Metrics" value={totalMetrics} variant="glass" />
      <StatCard label="Rocks" value={rocks} variant="glass" />
      <StatCard
        label="This Week Completion"
        value={`${filledThisWeek}/${totalMetrics}`}
        delta={totalMetrics > 0 ? `${Math.round((filledThisWeek / totalMetrics) * 100)}%` : '0%'}
        deltaType={filledThisWeek / totalMetrics > 0.7 ? 'positive' : 'negative'}
        variant="glass"
      />
    </DashboardGrid>
  );
}


// ─── Main page ───────────────────────────────────────────────────────────────

export default function MOS() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [meetings, setMeetings] = useState<MeetingDef[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({});
  const [loaded, setLoaded] = useState(false);
  const [contributorManagerOpen, setContributorManagerOpen] = useState(false);
  const [contributorNames, setContributorNames] = useState<string[]>([]);
  const changedKeysRef = useRef<Set<string>>(new Set());
  const metricSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const syncStatus = useMergeOnSave('mos-kpi-scorecard', weeklyData, changedKeysRef, loaded);

  useEffect(() => {
    (async () => {
      await initDb();
      try {
        const migrated = await ensureMosMigration();
        setMeetings(migrated);
        setActiveTab(migrated[0]?.id ?? '');
      } catch (err) {
        console.error('Migration failed, using fallback:', err);
        const fallback: MeetingDef[] = FALLBACK_MEETINGS.map(m => ({
          ...m,
          metrics: m.metrics.map((metric, idx) => ({
            ...metric,
            uid: `fallback-${m.id}-${idx}`,
            order: idx,
          })),
        }));
        setMeetings(fallback);
        setActiveTab(fallback[0]?.id ?? '');
      }
      const saved = await loadGenericSection<WeeklyData>('mos-kpi-scorecard');
      if (saved) setWeeklyData(saved);
      const contribData = await loadGenericSection<MosContributorsData>('mos-contributors');
      if (contribData?.contributors) {
        setContributorNames(contribData.contributors.filter(c => c.active).map(c => c.displayName));
      }
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    changedKeysRef.current.add(key);
    setWeeklyData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Debounced save for metric def changes
  const saveMetricDefs = useCallback((updated: MeetingDef[]) => {
    clearTimeout(metricSaveTimerRef.current);
    metricSaveTimerRef.current = setTimeout(async () => {
      await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
        meetings: updated,
        migrated: true,
      });
    }, 800);
  }, []);

  const handleMetricUpdate = useCallback((uid: string, field: keyof MetricDef, value: string | boolean | number | undefined) => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        return {
          ...m,
          metrics: m.metrics.map(metric =>
            metric.uid === uid ? { ...metric, [field]: value } : metric
          ),
        };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        const oldIdx = m.metrics.findIndex(x => x.uid === activeId);
        const newIdx = m.metrics.findIndex(x => x.uid === overId);
        if (oldIdx === -1 || newIdx === -1) return m;
        const reordered = arrayMove(m.metrics, oldIdx, newIdx).map((x, i) => ({ ...x, order: i }));
        return { ...m, metrics: reordered };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const handleDeleteMetric = useCallback((uid: string) => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        return { ...m, metrics: m.metrics.filter(x => x.uid !== uid).map((x, i) => ({ ...x, order: i })) };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const handleAddMetric = useCallback((asRock: boolean) => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        const newMetric: MetricDef = {
          uid: crypto.randomUUID(),
          responsible: '',
          metric: '',
          kpi: '',
          isRock: asRock || undefined,
          order: 0,
        };
        const reindexed = m.metrics.map(x => ({ ...x, order: x.order + 1 }));
        return { ...m, metrics: [newMetric, ...reindexed] };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const activeMeeting = meetings.find(m => m.id === activeTab);

  // Collect all unique responsible names across all meetings + contributors
  const allResponsibles = useMemo(() => {
    const names = new Set<string>();
    meetings.forEach(m => m.metrics.forEach(metric => {
      if (metric.responsible) names.add(metric.responsible);
    }));
    contributorNames.forEach(n => names.add(n));
    return Array.from(names).sort();
  }, [meetings, contributorNames]);

  return (
    <div className="p-6 max-w-full mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Weekly MOS Meeting"
          subtitle="KPI Scorecard — Update metrics weekly for each meeting"
        />
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={() => handleAddMetric(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus size={14} />
                KPI
              </button>
              <button
                onClick={() => handleAddMetric(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-amber-500/40 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Target size={14} />
                Rock
              </button>
              <button
                onClick={() => setContributorManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Users size={14} />
                Contributors
              </button>
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {syncStatus === 'saving' && <><Loader2 size={14} className="animate-spin" /> Saving...</>}
            {syncStatus === 'saved' && <><CheckCircle size={14} className="text-green-500" /> Saved</>}
            {syncStatus === 'error' && <><AlertCircle size={14} className="text-red-400" /> Save failed</>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {meetings.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveTab(m.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === m.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
            {activeTab === m.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Active meeting */}
      {!loaded ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading scorecard data...
        </div>
      ) : activeMeeting ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">{activeMeeting.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{activeMeeting.subtitle}</p>
          </div>

          <MeetingSummary meeting={activeMeeting} weeklyData={weeklyData} />

          <ScorecardTable
            meeting={activeMeeting}
            weeklyData={weeklyData}
            onCellChange={handleCellChange}
            isAdmin={isAdmin}
            onMetricUpdate={handleMetricUpdate}
            onDeleteMetric={handleDeleteMetric}
            allResponsibles={allResponsibles}
            onReorder={handleReorder}
          />
        </div>
      ) : null}

      {isAdmin && (
        <ContributorManager
          open={contributorManagerOpen}
          onOpenChange={setContributorManagerOpen}
        />
      )}
    </div>
  );
}
