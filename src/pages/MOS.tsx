import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { ensureMosMigration } from '../utils/mosMigration.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../utils/cn.ts';
import type { MeetingDef, MetricDef, MosMetricDefsData, MosContributorsData } from '../types/mos.ts';
import { MEETINGS as FALLBACK_MEETINGS } from '../data/mosMeetings.ts';
import {
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Target, Users, Plus, GripVertical, Trash2, X, Layers, Settings,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover.tsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../components/ui/dialog.tsx';
import { ContributorManager } from '../components/mos/ContributorManager.tsx';
import { InlineEdit } from '../components/mos/InlineEdit.tsx';
import { ResponsibleDropdown } from '../components/mos/ResponsibleDropdown.tsx';
import { KpiPopover, evaluateKpi } from '../components/mos/KpiPopover.tsx';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Types ───────────────────────────────────────────────────────────────────

type WeeklyData = Record<string, string>;
type SyncStatus = '' | 'saving' | 'saved' | 'error';
type ConfirmDialog = {
  title: string;
  description: string;
  details?: string[];
  onConfirm: () => void;
} | null;

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

const CURRENT_WEEK = getWeekKey(new Date());
const DEFAULT_WEEK_COUNT = 17;

type WeekConfig = { weekCount: number; hiddenWeeks: string[] };

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
  onDeleteSection,
  weeks,
  hiddenWeeks,
  onUnhideWeek,
  onRequestConfirm,
}: {
  meeting: MeetingDef;
  weeklyData: WeeklyData;
  onCellChange: (key: string, value: string) => void;
  isAdmin: boolean;
  onMetricUpdate: (uid: string, field: keyof MetricDef, value: string | boolean | number | undefined) => void;
  onDeleteMetric: (uid: string) => void;
  allResponsibles: string[];
  onReorder: (activeId: string, overId: string) => void;
  onDeleteSection: (uid: string) => void;
  weeks: string[];
  hiddenWeeks: Set<string>;
  onUnhideWeek?: (weekKey: string) => void;
  onRequestConfirm?: (dialog: NonNullable<ConfirmDialog>) => void;
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
      <table className="text-xs w-full" style={{ minWidth: weeks.filter(w => !hiddenWeeks.has(w)).length * 80 + hiddenWeeks.size * 12 + 400 + (isAdmin ? 24 : 0) }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
            {isAdmin && <th className="w-6 sticky left-0 bg-muted/50 z-20" />}
            <th className={cn("text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky bg-muted/50 z-20 min-w-[120px]", stickyLeftOffset)}>Responsible</th>
            <th className={cn("text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky bg-muted/50 z-20 min-w-[240px]", stickyLeftOffset2)}>Metric</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">KPI</th>
            {isAdmin && <th className="w-8" />}
            {weeks.map(w => hiddenWeeks.has(w) ? (
              <th
                key={w}
                className="w-[12px] max-w-[12px] px-0 bg-muted/30 cursor-pointer group"
                title={`Show ${getWeekLabel(w)}`}
                onClick={() => onUnhideWeek?.(w)}
              >
                <div className="w-1 h-3 mx-auto rounded-full bg-muted-foreground/20 group-hover:bg-primary/50 transition-colors" />
              </th>
            ) : (
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
                        colSpan={3 + weeks.length + (isAdmin ? 1 : 0)}
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
                          {isAdmin && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const sectionIdx = meeting.metrics.findIndex(x => x.uid === m.uid);
                                const childMetrics: string[] = [];
                                for (let i = sectionIdx + 1; i < meeting.metrics.length; i++) {
                                  if (meeting.metrics[i].isSection) break;
                                  childMetrics.push(meeting.metrics[i].metric || '(unnamed)');
                                }
                                if (onRequestConfirm) {
                                  onRequestConfirm({
                                    title: `Delete "${m.metric}"?`,
                                    description: childMetrics.length
                                      ? `This will permanently delete the section and ${childMetrics.length} metric${childMetrics.length > 1 ? 's' : ''} under it:`
                                      : 'This will permanently delete this empty section.',
                                    details: childMetrics.length ? childMetrics : undefined,
                                    onConfirm: () => onDeleteSection(m.uid),
                                  });
                                }
                              }}
                              className="text-muted-foreground/40 hover:text-red-400 transition-colors ml-2"
                              title="Delete section and its metrics"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
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
                    <td className={cn("py-1.5 px-3 whitespace-nowrap sticky bg-inherit z-10 min-w-[240px]", stickyLeftOffset2, m.isRock && "font-semibold text-amber-400", section && "pl-6")}>
                      {m.isRock && <Target size={11} className="inline mr-1 -mt-0.5" />}
                      {isAdmin ? (
                        <InlineEdit
                          value={m.metric}
                          onSave={v => onMetricUpdate(m.uid, 'metric', v)}
                        />
                      ) : m.metric}
                    </td>
                    <td className="py-1.5 px-3 text-center whitespace-nowrap">
                      {m.isRock ? (
                        <select
                          value={m.kpi || ''}
                          onChange={e => onMetricUpdate(m.uid, 'kpi', e.target.value)}
                          className={cn(
                            "text-xs py-1 px-1.5 rounded bg-transparent border border-transparent",
                            "focus:border-primary/40 focus:outline-none transition-colors",
                            "hover:border-border cursor-pointer appearance-none",
                            m.kpi === 'On Track' && "text-green-400",
                            m.kpi === 'Off Track' && "text-red-400",
                            !m.kpi && "text-muted-foreground/40",
                          )}
                        >
                          <option value="">—</option>
                          <option value="On Track">On Track</option>
                          <option value="Off Track">Off Track</option>
                        </select>
                      ) : (
                        <KpiPopover
                          kpi={m.kpi}
                          kpiType={m.kpiType}
                          kpiDirection={m.kpiDirection}
                          onKpiChange={v => onMetricUpdate(m.uid, 'kpi', v)}
                          onTypeChange={v => onMetricUpdate(m.uid, 'kpiType', v)}
                          onDirectionChange={v => onMetricUpdate(m.uid, 'kpiDirection', v)}
                          isAdmin={isAdmin}
                        />
                      )}
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
                            if (onRequestConfirm) {
                              onRequestConfirm({
                                title: `Delete "${label}"?`,
                                description: 'This metric and all its weekly data will be permanently deleted.',
                                onConfirm: () => onDeleteMetric(m.uid),
                              });
                            }
                          }}
                          className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                          title="Delete metric"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                    {weeks.map(w => {
                      if (hiddenWeeks.has(w)) {
                        return <td key={w} className="w-[12px] max-w-[12px] px-0 bg-muted/20" />;
                      }
                      const val = weeklyData[cellKey(w)] ?? '';
                      const evaluation = evaluateKpi(val, m.kpi, m.kpiType, m.kpiDirection, m.isRock);
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
                          {m.isRock ? (
                            <select
                              value={val}
                              onChange={e => onCellChange(cellKey(w), e.target.value)}
                              className={cn(
                                "w-full text-center text-xs py-1 px-0.5 rounded bg-transparent border border-transparent",
                                "focus:border-primary/40 focus:bg-primary/5 focus:outline-none transition-colors",
                                "hover:border-border cursor-pointer appearance-none",
                                evaluation === 'green' && "text-green-400",
                                evaluation === 'red' && "text-red-400",
                                !val && "text-muted-foreground/40",
                              )}
                            >
                              <option value="">—</option>
                              <option value="On Track">On Track</option>
                              <option value="Off Track">Off Track</option>
                            </select>
                          ) : (
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
                          )}
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

// ─── Sortable Tab ────────────────────────────────────────────────────────────

function SortableTab({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
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
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
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
  const [weekCount, setWeekCount] = useState(DEFAULT_WEEK_COUNT);
  const [hiddenWeeks, setHiddenWeeks] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const changedKeysRef = useRef<Set<string>>(new Set());
  const metricSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const weekConfigSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const syncStatus = useMergeOnSave('mos-kpi-scorecard', weeklyData, changedKeysRef, loaded);

  const weeks = useMemo(() => generateWeeks(weekCount), [weekCount]);

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
      const weekConfig = await loadGenericSection<WeekConfig>('mos-week-config');
      if (weekConfig) {
        if (weekConfig.weekCount >= 4 && weekConfig.weekCount <= 52) setWeekCount(weekConfig.weekCount);
        if (weekConfig.hiddenWeeks?.length) setHiddenWeeks(new Set(weekConfig.hiddenWeeks));
      }
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    changedKeysRef.current.add(key);
    setWeeklyData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Debounced save for week config changes
  const saveWeekConfig = useCallback((wc: number, hw: Set<string>) => {
    clearTimeout(weekConfigSaveTimerRef.current);
    weekConfigSaveTimerRef.current = setTimeout(async () => {
      await saveGenericSection<WeekConfig>('mos-week-config', {
        weekCount: wc,
        hiddenWeeks: Array.from(hw),
      });
    }, 800);
  }, []);

  const handleWeekCountChange = useCallback((val: number) => {
    const clamped = Math.max(4, Math.min(52, val));
    setWeekCount(clamped);
    setHiddenWeeks(prev => {
      // Remove hidden weeks that no longer exist in the new range
      const newWeeks = new Set(generateWeeks(clamped));
      const next = new Set([...prev].filter(w => newWeeks.has(w)));
      saveWeekConfig(clamped, next);
      return next;
    });
  }, [saveWeekConfig]);

  const handleToggleWeekVisibility = useCallback((weekKey: string) => {
    setHiddenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      saveWeekConfig(weekCount, next);
      return next;
    });
  }, [weekCount, saveWeekConfig]);

  const handleUnhideWeek = useCallback((weekKey: string) => {
    setHiddenWeeks(prev => {
      const next = new Set(prev);
      next.delete(weekKey);
      saveWeekConfig(weekCount, next);
      return next;
    });
  }, [weekCount, saveWeekConfig]);

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

  const handleAddSection = useCallback(() => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        const newSection: MetricDef = {
          uid: crypto.randomUUID(),
          responsible: '',
          metric: 'New Section',
          kpi: '',
          isSection: true,
          order: 0,
        };
        const reindexed = m.metrics.map(x => ({ ...x, order: x.order + 1 }));
        return { ...m, metrics: [newSection, ...reindexed] };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const handleDeleteSection = useCallback((sectionUid: string) => {
    setMeetings(prev => {
      const updated = prev.map(m => {
        if (m.id !== activeTab) return m;
        const sectionIdx = m.metrics.findIndex(x => x.uid === sectionUid);
        if (sectionIdx === -1) return m;
        // Find the next section (or end of list)
        let endIdx = m.metrics.length;
        for (let i = sectionIdx + 1; i < m.metrics.length; i++) {
          if (m.metrics[i].isSection) { endIdx = i; break; }
        }
        const filtered = m.metrics.filter((_, i) => i < sectionIdx || i >= endIdx);
        return { ...m, metrics: filtered.map((x, i) => ({ ...x, order: i })) };
      });
      saveMetricDefs(updated);
      return updated;
    });
  }, [activeTab, saveMetricDefs]);

  const handleAddTab = useCallback(() => {
    setMeetings(prev => {
      const newId = crypto.randomUUID();
      const newMeeting: MeetingDef = {
        id: newId,
        label: 'New Meeting',
        title: 'New Meeting',
        subtitle: '',
        metrics: [],
      };
      const updated = [...prev, newMeeting];
      setActiveTab(newId);
      saveMetricDefs(updated);
      return updated;
    });
  }, [saveMetricDefs]);

  const handleRenameTab = useCallback((meetingId: string, newLabel: string) => {
    setMeetings(prev => {
      const updated = prev.map(m =>
        m.id === meetingId ? { ...m, label: newLabel, title: newLabel } : m
      );
      saveMetricDefs(updated);
      return updated;
    });
  }, [saveMetricDefs]);

  const handleDeleteTab = useCallback((meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting || meetings.length <= 1) return;
    const metricCount = meeting.metrics.filter(m => !m.isSection).length;
    setConfirmDialog({
      title: `Delete "${meeting.label}"?`,
      description: `All ${metricCount} metric${metricCount !== 1 ? 's' : ''} and scorecard data for this meeting will be permanently lost.`,
      onConfirm: () => {
        setMeetings(prev => {
          const updated = prev.filter(m => m.id !== meetingId);
          if (activeTab === meetingId) setActiveTab(updated[0]?.id ?? '');
          saveMetricDefs(updated);
          return updated;
        });
      },
    });
  }, [meetings, activeTab, saveMetricDefs]);

  const handleTabReorder = useCallback((activeId: string, overId: string) => {
    setMeetings(prev => {
      const oldIdx = prev.findIndex(m => m.id === activeId);
      const newIdx = prev.findIndex(m => m.id === overId);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const updated = arrayMove(prev, oldIdx, newIdx);
      saveMetricDefs(updated);
      return updated;
    });
  }, [saveMetricDefs]);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');

  const tabSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

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
                onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Layers size={14} />
                Section
              </button>
              <button
                onClick={() => setContributorManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Users size={14} />
                Contributors
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Week settings"
                  >
                    <Settings size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Week Count</label>
                    <input
                      type="number"
                      min={4}
                      max={52}
                      value={weekCount}
                      onChange={e => handleWeekCountChange(parseInt(e.target.value) || DEFAULT_WEEK_COUNT)}
                      className="w-full text-sm px-2 py-1.5 rounded-md bg-muted/50 border border-border focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Week Visibility</label>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                      {weeks.map(w => (
                        <label key={w} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={!hiddenWeeks.has(w)}
                            onChange={() => handleToggleWeekVisibility(w)}
                            className="rounded border-border"
                          />
                          <span className={cn(
                            w === CURRENT_WEEK && "text-primary font-medium",
                          )}>
                            {getWeekLabel(w)}
                            {w === CURRENT_WEEK && " (current)"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
      <div className="flex gap-1 border-b border-border items-end">
        <DndContext sensors={tabSensors} collisionDetection={closestCenter} onDragEnd={e => {
          const { active, over } = e;
          if (over && active.id !== over.id) handleTabReorder(active.id as string, over.id as string);
        }}>
          <SortableContext items={meetings.map(m => m.id)} strategy={horizontalListSortingStrategy}>
            {meetings.map(m => (
              <SortableTab key={m.id} id={m.id} disabled={!isAdmin}>
                <div
                  className={cn(
                    "group px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 cursor-pointer select-none",
                    activeTab === m.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setActiveTab(m.id)}
                  onDoubleClick={() => {
                    if (!isAdmin) return;
                    setEditingTabId(m.id);
                    setEditingTabValue(m.label);
                  }}
                >
                  {editingTabId === m.id ? (
                    <input
                      autoFocus
                      value={editingTabValue}
                      onChange={e => setEditingTabValue(e.target.value)}
                      onBlur={() => {
                        if (editingTabValue.trim()) handleRenameTab(m.id, editingTabValue.trim());
                        setEditingTabId(null);
                      }}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          if (editingTabValue.trim()) handleRenameTab(m.id, editingTabValue.trim());
                          setEditingTabId(null);
                        } else if (e.key === 'Escape') {
                          setEditingTabId(null);
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                      className="bg-transparent border border-primary/40 rounded px-1 py-0 text-sm font-medium outline-none w-28"
                    />
                  ) : (
                    m.label
                  )}
                  {isAdmin && meetings.length > 1 && editingTabId !== m.id && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteTab(m.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-400 transition-all"
                      title="Delete meeting"
                    >
                      <X size={12} />
                    </button>
                  )}
                  {activeTab === m.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                  )}
                </div>
              </SortableTab>
            ))}
          </SortableContext>
        </DndContext>
        {isAdmin && (
          <button
            onClick={handleAddTab}
            className="px-3 py-2.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Add meeting tab"
          >
            <Plus size={16} />
          </button>
        )}
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

          <ScorecardTable
            meeting={activeMeeting}
            weeklyData={weeklyData}
            onCellChange={handleCellChange}
            isAdmin={isAdmin}
            onMetricUpdate={handleMetricUpdate}
            onDeleteMetric={handleDeleteMetric}
            allResponsibles={allResponsibles}
            onReorder={handleReorder}
            onDeleteSection={handleDeleteSection}
            weeks={weeks}
            hiddenWeeks={hiddenWeeks}
            onUnhideWeek={isAdmin ? handleUnhideWeek : undefined}
            onRequestConfirm={isAdmin ? setConfirmDialog : undefined}
          />
        </div>
      ) : null}

      {isAdmin && (
        <ContributorManager
          open={contributorManagerOpen}
          onOpenChange={setContributorManagerOpen}
        />
      )}

      <Dialog open={!!confirmDialog} onOpenChange={open => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          {confirmDialog?.details && (
            <ul className="text-xs text-muted-foreground space-y-0.5 max-h-40 overflow-y-auto pl-4 list-disc">
              {confirmDialog.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setConfirmDialog(null)}
              className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
              className="px-4 py-2 text-sm rounded-md bg-red-500/90 text-white hover:bg-red-500 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
