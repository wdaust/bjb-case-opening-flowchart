import { useState, useEffect, useRef, useCallback } from 'react';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { cn } from '../utils/cn.ts';
import {
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Target,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricDef {
  responsible: string;
  metric: string;
  kpi: string;
  isRock?: boolean;
  isSection?: boolean;
}

interface MeetingTab {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  metrics: MetricDef[];
}

// Weekly values keyed by `${meetingId}:${metricIndex}:${weekKey}`
type WeeklyData = Record<string, string>;

type SyncStatus = '' | 'saving' | 'saved' | 'error';

// ─── Week helpers ────────────────────────────────────────────────────────────

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getWeekLabel(weekKey: string): string {
  const mon = new Date(weekKey + 'T00:00:00');
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)} - ${fmt(fri)}`;
}

function generateWeeks(count: number): string[] {
  const now = new Date();
  const currentWeek = getWeekKey(now);
  const weeks: string[] = [];
  const mon = new Date(currentWeek + 'T00:00:00');
  // Start 4 weeks back
  mon.setDate(mon.getDate() - 4 * 7);
  for (let i = 0; i < count; i++) {
    weeks.push(getWeekKey(mon));
    mon.setDate(mon.getDate() + 7);
  }
  return weeks;
}

const WEEKS = generateWeeks(17);
const CURRENT_WEEK = getWeekKey(new Date());

// ─── Meeting data from KPI Scorecard ─────────────────────────────────────────

const MEETINGS: MeetingTab[] = [
  {
    id: 'johns-mtg',
    label: "John's Meeting",
    title: 'Executive Weekly Scorecard',
    subtitle: 'Personal Injury / Claims / Marketing / Intake',
    metrics: [
      { responsible: '', metric: 'Personal Injury: Pre-LIT / LIT / Medical Records', kpi: '', isSection: true },
      { responsible: 'Marc Borden', metric: 'Attorney Unit Settlements ($)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Settlements % to Goal', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Settlement Value ($)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg TOD', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Assignment → Complaint Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: '% Filed ≤ 30 Days of Assignment', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Filed → Service Completed', kpi: '' },
      { responsible: 'Marc Borden', metric: '% Service Completed ≤ 30 Days of Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: 'All Answers Filed % (with all responsive defendants)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Defaults Entered Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Plaintiff Discovery Served Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Defense Discovery Received Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: '10-Day Letter Sent When Past Due %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Motions to Compel Filed When Required %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Avg Days: Past-Due → Motion Filed', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Motions Granted %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'DED Extensions (#)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Depos Completed ≤ 1 Year of Answer %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Deps Outstanding 180+ Days (#)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Expert Reports Served Timely %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Mediation Scheduled When Eligible %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Trial-Ready Checklist Completion %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Data Completeness Score %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Client Service Score', kpi: '' },
      { responsible: 'Marc Borden', metric: 'SDS Completion %', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with Active Settlement Offers', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with No Activity (30+ Days)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Outstanding Discovery Deficiencies', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Active Litigation Cases', kpi: '' },
      { responsible: 'Marc Borden', metric: 'New Cases Entering Litigation (Weekly)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases Resolved in Litigation (Weekly)', kpi: '25' },
      { responsible: 'Marc Borden', metric: 'Litigation Settlement Dollars Generated', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Average Litigation Case Age (Days)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Days Qualified Cases Awaiting Complaint Filing', kpi: '62' },
      { responsible: 'Marc Borden', metric: 'Cases Moved to RFD', kpi: '40' },
      { responsible: 'Marc Borden', metric: 'Reduction of cases with no negotiation activity', kpi: '20' },
      { responsible: 'Marc Borden', metric: 'Number reduction of days to DED (goal: 263)', kpi: '4.6' },
      { responsible: 'Marc Borden', metric: 'Decrease of backlog — Form A past due', kpi: '10%' },
      { responsible: 'Marc Borden', metric: 'Qualified Complaints Filed (Weekly)', kpi: '70%' },
      { responsible: 'Marc Borden', metric: 'Depositions Scheduled', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Depositions Completed (Weekly)', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Mediations / Arbitrations Scheduled', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Cases with Grade A Treatment', kpi: 'Brittany' },
      { responsible: 'Marc Borden', metric: 'Active Treatment Rate', kpi: '' },
      { responsible: 'Marc Borden', metric: 'Treatment Gap Rate (14+ Day Gap)', kpi: '< 15%' },
    ],
  },
  {
    id: 'marcs-mtg',
    label: "Marc's Meeting",
    title: 'Personal Injury: Director Weekly Scorecard',
    subtitle: 'Pre-LIT / LIT Paralegal / Medical Records',
    metrics: [
      { responsible: '', metric: 'Brittany Hale — Pre-LIT / Treatment', kpi: '', isSection: true },
      { responsible: 'Brittany Hale', metric: 'Treatment Gap Rate (14+ Day Gap ÷ Active Cases)', kpi: '< 15%' },
      { responsible: 'Brittany Hale', metric: 'Cases in Med Management > 90 Days', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Cases in Med Management > 6 Months', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Total Platinum Cases', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Total Gold Cases', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Total Silver Cases', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Total Bronze Cases', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Total Flag Cases', kpi: '' },
      { responsible: 'Brittany Hale', metric: '% Treatment Follow-Ups Completed (Qualified Cases)', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'ROCK: Avg Settlement Score Per Case', kpi: '', isRock: true },
      { responsible: 'Brittany Hale', metric: 'Total Cases in Pre-LIT', kpi: '3,803' },
      { responsible: 'Brittany Hale', metric: 'Qualified Cases Not Yet in Treatment', kpi: '' },
      { responsible: 'Brittany Hale', metric: 'Active Treatment Rate (Active ÷ Total Pre-LIT)', kpi: '76%' },
      { responsible: 'Brittany Hale', metric: 'Cases Becoming Demand-Ready (Weekly)', kpi: '63' },
      { responsible: 'Brittany Hale', metric: 'Net Promoter Score', kpi: '7' },
      { responsible: 'Brittany Hale', metric: 'Avg Outbound Dials per CM', kpi: 'TBD' },
      { responsible: 'Brittany Hale', metric: 'Avg Time in Call (min)', kpi: 'TBD' },
      { responsible: 'Brittany Hale', metric: 'ROCK 1: 750 Cases to RFD', kpi: '', isRock: true },
      { responsible: 'Brittany Hale', metric: 'ROCK 2: Case Quality Score (5% Plat / 10% Gold / 20% Silver / 40% Bronze / 25% Flag)', kpi: '', isRock: true },
      { responsible: 'Brittany Hale', metric: 'ROCK 3: Estimated Settlement Value', kpi: '', isRock: true },
      { responsible: '', metric: 'Kennia Delgado — LIT Paralegal', kpi: '', isSection: true },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Treatment Touches — All Units', kpi: '< 5' },
      { responsible: 'Kennia Delgado', metric: 'Overdue Qualified Complaint Filings', kpi: '< 55 days' },
      { responsible: 'Kennia Delgado', metric: 'Service Pending > 35 Days', kpi: '< 40 cases' },
      { responsible: 'Kennia Delgado', metric: 'Total Pending Service', kpi: '< 160 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Plaintiff Discovery', kpi: '< 40 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Defendant Discovery', kpi: '< 60 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Answers Filed', kpi: '< 30 cases' },
      { responsible: 'Kennia Delgado', metric: 'Outstanding Policy Limits', kpi: '< 25 cases' },
      { responsible: 'Kennia Delgado', metric: '10 Day Letters Timely', kpi: '> 80%' },
      { responsible: 'Kennia Delgado', metric: 'ROCK 1: Qualified Complaints Filed Timely (30 days)', kpi: '> 65%', isRock: true },
      { responsible: 'Kennia Delgado', metric: 'ROCK 2: Service Filed Timely (30 days)', kpi: '> 70%', isRock: true },
      { responsible: 'Kennia Delgado', metric: 'ROCK 3: Plaintiff Discovery Completed Timely (30 days)', kpi: '> 60%', isRock: true },
    ],
  },
  {
    id: 'ryans-mtg',
    label: "Ryan's Meeting",
    title: 'Executive Weekly Scorecard',
    subtitle: 'Medical Marketing / Law Firm Marketing / PIP Arbs / Workers Comp / Employment / Finance',
    metrics: [
      { responsible: '', metric: 'Medical Marketing', kpi: '', isSection: true },
      { responsible: 'Amy Estrada', metric: 'Number of Outbound Calls', kpi: '250' },
      { responsible: 'Amy Estrada', metric: 'Appointments Set', kpi: '25' },
      { responsible: 'Amy Estrada', metric: 'Appointments Completed', kpi: '20' },
      { responsible: 'Amy Estrada', metric: 'Number of Inbound Leads', kpi: '25' },
      { responsible: 'Amy Estrada', metric: 'Conversion of Leads to Matters', kpi: '> 50%' },
      { responsible: 'Amy Estrada', metric: 'New Providers: Open to Active', kpi: '2' },
      { responsible: 'Amy Estrada', metric: 'ROCK 1: Total Appointments Set: 300', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 2: Appt to Lead Conversion — Avg 10%', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 3: Lead to Matter Conversion — Avg 50%', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 4: Total New Clients: 180', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 5: Total Active Providers: 150', kpi: '', isRock: true },
      { responsible: 'Amy Estrada', metric: 'ROCK 6: ≥ 20% New Appts from Expansion States', kpi: '', isRock: true },
      { responsible: '', metric: 'Law Firm Marketing', kpi: '', isSection: true },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Small Firm Touch Points/Calls', kpi: '> 200' },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Large Firm Touch Points/Calls', kpi: '> 50' },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Large Firm New Agreements', kpi: '> 3' },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Small Firm New Agreements', kpi: '> 10' },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Total Leads Received (Annual)', kpi: '135' },
      { responsible: 'Kevin Maleike', metric: 'Inbound — Total Leads Signed by Intake (Annual)', kpi: '18' },
      { responsible: 'Kevin Maleike', metric: 'Outbound — Total Leads Sent (Annual)', kpi: '150' },
      { responsible: 'Kevin Maleike', metric: 'Outbound — Total Leads Signed (Annual)', kpi: '18' },
      { responsible: 'Kevin Maleike', metric: 'Outbound — Partner Non-Compliant % of Monthly Volume', kpi: '10%' },
      { responsible: 'Kevin Maleike', metric: 'Outbound — Declined/Rejected Referrals Not Closed', kpi: '0' },
      { responsible: 'Kevin Maleike', metric: 'Marketing — Ad Hoc Emails Sent', kpi: '1' },
      { responsible: 'Kevin Maleike', metric: 'ROCK 1: Outbound RFR + TNS Fee Collection = $725K', kpi: '', isRock: true },
      { responsible: 'Kevin Maleike', metric: 'ROCK 2: Outbound RFR Sign Ups = 250', kpi: '', isRock: true },
      { responsible: 'Kevin Maleike', metric: 'ROCK 3: Inbound Sign Ups = 262', kpi: '', isRock: true },
      { responsible: '', metric: 'Workers Comp', kpi: '', isSection: true },
      { responsible: 'Ken Thayer', metric: 'Outstanding 30-Day Client Calls', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Demands Sent Volume (Monthly Goal: 30)', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Treatment Trackers — Follow-Up Intervals', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Medical Records Gathering — Request to Receipt', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Perm Exams — Scheduled to Report Receipt', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Settlement Paperwork — Resolution to Judge Order', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Liens — Request to Final/Dispute', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'AR Report Close Out — Fee/Cost Receipt to File Close', kpi: '' },
      { responsible: 'Ken Thayer', metric: 'Medical Records: % Aged > 30 Days', kpi: '< 15%' },
      { responsible: '', metric: 'Employment Law', kpi: '', isSection: true },
      { responsible: 'Mike Fortunato', metric: 'Cases with No Activity (30+ Days)', kpi: '' },
      { responsible: 'Mike Fortunato', metric: 'Employment Lawsuits Filed (Weekly)', kpi: '' },
      { responsible: 'Mike Fortunato', metric: 'Service Pending > 35 Days', kpi: '' },
      { responsible: 'Mike Fortunato', metric: 'Outstanding Plaintiff Discovery', kpi: '' },
      { responsible: 'Mike Fortunato', metric: 'Outstanding Defendant Discovery', kpi: '' },
      { responsible: '', metric: 'Finance', kpi: '', isSection: true },
      { responsible: 'Frank / Mike', metric: 'SDS Cash Received Forecast (Next 30-60 Days)', kpi: '' },
    ],
  },
];


// ─── Debounced save ──────────────────────────────────────────────────────────

function useDebouncedSave(sectionId: string, data: WeeklyData, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [status, setStatus] = useState<SyncStatus>('');

  useEffect(() => {
    if (!enabled) return;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ok = await saveGenericSection(sectionId, data);
      setStatus(ok ? 'saved' : 'error');
      if (ok) setTimeout(() => setStatus(''), 2000);
    }, 1200);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), sectionId, enabled]);

  return status;
}

// ─── Scorecard table ─────────────────────────────────────────────────────────

function ScorecardTable({
  meeting,
  weeklyData,
  onCellChange,
}: {
  meeting: MeetingTab;
  weeklyData: WeeklyData;
  onCellChange: (key: string, value: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Determine which section each metric belongs to for collapsing
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
                <tr key={idx} className="bg-primary/5 border-b border-border">
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

            const cellKey = (w: string) => `${meeting.id}:${idx}:${w}`;

            return (
              <tr
                key={idx}
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

function MeetingSummary({ meeting, weeklyData }: { meeting: MeetingTab; weeklyData: WeeklyData }) {
  // Count how many cells are filled for current week
  let filledThisWeek = 0;
  let totalMetrics = 0;
  const responsibleSet = new Set<string>();

  meeting.metrics.forEach((m, idx) => {
    if (m.isSection) return;
    totalMetrics++;
    if (m.responsible) responsibleSet.add(m.responsible);
    const key = `${meeting.id}:${idx}:${CURRENT_WEEK}`;
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
  const [activeTab, setActiveTab] = useState(MEETINGS[0].id);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({});
  const [loaded, setLoaded] = useState(false);
  const syncStatus = useDebouncedSave('mos-kpi-scorecard', weeklyData, loaded);

  // Init DB & load
  useEffect(() => {
    (async () => {
      await initDb();
      const saved = await loadGenericSection<WeeklyData>('mos-kpi-scorecard');
      if (saved) setWeeklyData(saved);
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    setWeeklyData(prev => ({ ...prev, [key]: value }));
  }, []);

  const activeMeeting = MEETINGS.find(m => m.id === activeTab);

  return (
    <div className="p-6 max-w-full mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Weekly MOS Meeting"
          subtitle="KPI Scorecard — Update metrics weekly for each meeting"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {syncStatus === 'saving' && <><Loader2 size={14} className="animate-spin" /> Saving...</>}
          {syncStatus === 'saved' && <><CheckCircle size={14} className="text-green-500" /> Saved</>}
          {syncStatus === 'error' && <><AlertCircle size={14} className="text-red-400" /> Save failed</>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {MEETINGS.map(m => (
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
    </div>
  );
}
