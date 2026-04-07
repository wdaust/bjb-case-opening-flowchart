import { useState, useEffect, useRef, useCallback } from 'react';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { ensureMosMigration } from '../utils/mosMigration.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../utils/cn.ts';
import type { MeetingDef } from '../types/mos.ts';
import { MEETINGS as FALLBACK_MEETINGS } from '../data/mosMeetings.ts';
import {
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Target, Settings, Users,
} from 'lucide-react';
import { MetricEditor } from '../components/mos/MetricEditor.tsx';
import { ContributorManager } from '../components/mos/ContributorManager.tsx';

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
        // Load current DB state, merge only changed keys
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

// ─── Scorecard table ─────────────────────────────────────────────────────────

export function ScorecardTable({
  meeting,
  weeklyData,
  onCellChange,
}: {
  meeting: MeetingDef;
  weeklyData: WeeklyData;
  onCellChange: (key: string, value: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  let currentSection = '';
  const metricSections: string[] = meeting.metrics.map(m => {
    if (m.isSection) currentSection = m.metric;
    return currentSection;
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="text-xs w-full" style={{ minWidth: WEEKS.length * 80 + 400 }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-20 min-w-[120px]">Responsible</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky left-[120px] bg-muted/50 z-20 min-w-[240px]">Metric</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">KPI</th>
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
        <tbody>
          {meeting.metrics.map((m, idx) => {
            if (m.isSection) {
              const isCollapsed = collapsed[m.metric] ?? false;
              return (
                <tr key={m.uid} className="bg-primary/5 border-b border-border">
                  <td
                    colSpan={3 + WEEKS.length}
                    className="py-2.5 px-3 font-semibold text-primary text-xs cursor-pointer select-none"
                    onClick={() => setCollapsed(prev => ({ ...prev, [m.metric]: !prev[m.metric] }))}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      {m.metric}
                    </span>
                  </td>
                </tr>
              );
            }

            const section = metricSections[idx];
            if (section && collapsed[section]) return null;

            const cellKey = (w: string) => `${meeting.id}:${m.uid}:${w}`;

            return (
              <tr
                key={m.uid}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  m.isRock ? "bg-amber-500/5" : idx % 2 === 0 ? "bg-card" : "bg-table-stripe",
                )}
              >
                <td className="py-1.5 px-3 text-muted-foreground whitespace-nowrap sticky left-0 bg-inherit z-10 min-w-[120px]">
                  {m.responsible}
                </td>
                <td className={cn("py-1.5 px-3 whitespace-nowrap sticky left-[120px] bg-inherit z-10 min-w-[240px]", m.isRock && "font-semibold text-amber-400")}>
                  {m.isRock && <Target size={11} className="inline mr-1 -mt-0.5" />}
                  {m.metric}
                </td>
                <td className="py-1.5 px-3 text-center text-muted-foreground whitespace-nowrap">{m.kpi}</td>
                {WEEKS.map(w => (
                  <td key={w} className={cn("py-0.5 px-0.5", w === CURRENT_WEEK && "bg-primary/5")}>
                    <input
                      type="text"
                      value={weeklyData[cellKey(w)] ?? ''}
                      onChange={e => onCellChange(cellKey(w), e.target.value)}
                      className={cn(
                        "w-full text-center text-xs py-1 px-1 rounded bg-transparent border border-transparent",
                        "focus:border-primary/40 focus:bg-primary/5 focus:outline-none transition-colors",
                        "hover:border-border",
                      )}
                      placeholder="—"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
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
  const [metricEditorOpen, setMetricEditorOpen] = useState(false);
  const [contributorManagerOpen, setContributorManagerOpen] = useState(false);
  const changedKeysRef = useRef<Set<string>>(new Set());
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
        // Convert fallback to MeetingDef with generated UIDs
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
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    changedKeysRef.current.add(key);
    setWeeklyData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleMeetingsUpdated = useCallback((updated: MeetingDef[]) => {
    setMeetings(updated);
  }, []);

  const activeMeeting = meetings.find(m => m.id === activeTab);

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
                onClick={() => setContributorManagerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Users size={14} />
                Contributors
              </button>
              <button
                onClick={() => setMetricEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Settings size={14} />
                Edit Metrics
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
          />
        </div>
      ) : null}

      {/* Admin modals */}
      {isAdmin && activeMeeting && (
        <MetricEditor
          open={metricEditorOpen}
          onOpenChange={setMetricEditorOpen}
          meetings={meetings}
          activeMeetingId={activeTab}
          onMeetingsUpdated={handleMeetingsUpdated}
        />
      )}
      {isAdmin && (
        <ContributorManager
          open={contributorManagerOpen}
          onOpenChange={setContributorManagerOpen}
        />
      )}
    </div>
  );
}
