import { useMemo } from 'react';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { cn } from '../utils/cn';
import { fmt$, fmtNum } from '../utils/sfHelpers';
import { Loader2, RefreshCw } from 'lucide-react';
import type { ReportSummaryResponse } from '../types/salesforce';
import {
  OPEN_LIT_ID, RESOLUTIONS_ID,
  UNIT_GOALS_ID, PAST_DUE_SERVICE_ID, MISSING_ANS_SERVED_ID,
  FORM_C_10DAY_ID, NEED_FORM_C_MOTION_ID, ARB_MED_60_ID,
} from '../data/sfReportIds';

// ─── KPI definitions ────────────────────────────────────────────────────────

interface KpiDef {
  key: string;
  label: string;
  format: 'number' | 'currency' | 'pct' | 'days' | 'count';
  /** higher is better (true) or lower is better (false) */
  higherBetter: boolean;
  /** [green threshold, amber threshold] — values compared with higherBetter logic */
  thresholds?: [number, number];
  status: 'green' | 'yellow' | 'red';
}

const SCORECARD_KPIS: KpiDef[] = [
  { key: 'active-cases', label: 'Total Active Cases', format: 'count', higherBetter: true, status: 'green' },
  { key: 'settlements', label: 'Attorney Unit Settlements ($)', format: 'currency', higherBetter: true, status: 'green' },
  { key: 'settlements-pct-goal', label: 'Settlements % to Goal', format: 'pct', higherBetter: true, thresholds: [80, 50], status: 'green' },
  { key: 'avg-settlement', label: 'Avg Settlement Value ($)', format: 'currency', higherBetter: true, status: 'green' },
  { key: 'tod-days', label: 'TOD (Assigned → Resolution) Days', format: 'days', higherBetter: false, thresholds: [365, 730], status: 'yellow' },
  { key: 'days-to-complaint', label: 'Avg Days: Assignment → Complaint Filed', format: 'days', higherBetter: false, thresholds: [30, 60], status: 'green' },
  { key: 'filed-30-days', label: '% Filed ≤ 30 Days of Assignment', format: 'pct', higherBetter: true, thresholds: [80, 50], status: 'green' },
  { key: 'days-to-service', label: 'Avg Days: Filed → Service Completed', format: 'days', higherBetter: false, thresholds: [30, 60], status: 'red' },
  { key: 'service-30-days', label: '% Service Completed ≤ 30 Days of Filed', format: 'pct', higherBetter: true, thresholds: [80, 50], status: 'red' },
  { key: 'answers-missing', label: 'Missing Answers (#)', format: 'count', higherBetter: false, thresholds: [3, 8], status: 'green' },
  { key: 'defaults-timely', label: 'Defaults Entered Timely %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'plaintiff-disc', label: 'Plaintiff Discovery Served Timely %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'defense-disc', label: 'Defense Discovery Received Timely %', format: 'pct', higherBetter: true, status: 'red' },
  { key: '10day-letter', label: '10-Day Letters Needed (#)', format: 'count', higherBetter: false, thresholds: [3, 8], status: 'green' },
  { key: 'motions-compel', label: 'Motions to Compel Filed (#)', format: 'count', higherBetter: true, status: 'green' },
  { key: 'days-to-motion', label: 'Avg Days: Past-Due → Motion Filed', format: 'days', higherBetter: false, thresholds: [30, 60], status: 'yellow' },
  { key: 'past-due-svc', label: 'Past Due Service (#)', format: 'count', higherBetter: false, thresholds: [3, 8], status: 'green' },
  { key: 'ded-extensions', label: 'DED Extensions (#)', format: 'count', higherBetter: false, status: 'red' },
  { key: 'depos-1yr', label: 'Client Depos Completed ≤ 1 Year of Answer %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'depos-180', label: 'Client Deps Outstanding 180+ Days (#)', format: 'count', higherBetter: false, status: 'red' },
  { key: 'expert-reports', label: 'Expert Reports Served Timely %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'mediation', label: 'Arb/Med Scheduled (#)', format: 'count', higherBetter: true, status: 'green' },
  { key: 'trial-ready', label: 'Trial-Ready Checklist Completion %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'data-completeness', label: 'Data Completeness Score %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'client-service', label: 'Client Service Score', format: 'number', higherBetter: true, status: 'red' },
  { key: 'sds-completion', label: 'SDS Completion %', format: 'pct', higherBetter: true, status: 'red' },
  { key: 'overall-kpi', label: 'Overall KPI Score (0-100)', format: 'number', higherBetter: true, status: 'red' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(s: unknown): Date | null {
  if (typeof s !== 'string' || s === '-' || !s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Extract top-level attorney name from grouped label like "Lisa Lehrer > Litigation" */
function topAttorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  return label.split(' > ')[0].trim();
}

/** Extract level-2 attorney from "Team > Attorney > Matter" */
function level2Attorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  const parts = label.split(' > ');
  return parts.length >= 2 ? parts[1].trim() : parts[0].trim();
}

function getAgg(grouping: { aggregates: { label: string; value: number | null }[] } | undefined, search: string): number | null {
  if (!grouping) return null;
  const agg = grouping.aggregates.find(a => a.label.includes(search));
  return agg?.value ?? null;
}

// ─── KPI computation ────────────────────────────────────────────────────────

type KpiValues = Record<string, number | null>;

interface ReportBundle {
  openLit: ReportSummaryResponse | null;
  unitGoals: ReportSummaryResponse | null;
  missingAns: ReportSummaryResponse | null;
  pastDue: ReportSummaryResponse | null;
  formC10Day: ReportSummaryResponse | null;
  motionReport: ReportSummaryResponse | null;
  arbMed: ReportSummaryResponse | null;
  resolutions: ReportSummaryResponse | null;
}

function buildAttorneyList(bundle: ReportBundle): string[] {
  const set = new Set<string>();
  bundle.unitGoals?.groupings.forEach(g => set.add(g.label));
  bundle.openLit?.groupings.forEach(g => { if (g.label) set.add(g.label); });
  return Array.from(set).sort();
}

function computeKpisForAttorney(attorney: string, b: ReportBundle): KpiValues {
  const kpis: KpiValues = {};

  // ── Total Active Cases ──
  const openLitG = b.openLit?.groupings.find(g => g.label === attorney);
  kpis['active-cases'] = getAgg(openLitG, 'Record Count');

  // ── Settlements from Unit Goals ──
  const goalsG = b.unitGoals?.groupings.find(g => g.label === attorney);
  const settlements = getAgg(goalsG, 'Annual Gross Settlements');
  kpis['settlements'] = settlements;

  const pctGoal = getAgg(goalsG, 'Toward Annual');
  kpis['settlements-pct-goal'] = pctGoal;

  const caseCount = getAgg(goalsG, 'Cases Settled');
  kpis['avg-settlement'] = settlements && caseCount ? Math.round(settlements / caseCount) : null;

  // ── Date-based KPIs from Open Lit detail rows ──
  const openLitRows = (b.openLit?.detailRows ?? []).filter(
    r => topAttorney(r._groupingLabel) === attorney,
  );

  // Avg Days Assignment → Complaint
  const daysToComplaint: number[] = [];
  let filedWithin30 = 0;
  let filedTotal = 0;
  for (const row of openLitRows) {
    const assigned = parseDate(row['Date Assigned To Litigation Unit']);
    const filed = parseDate(row['Complaint Filed Date']);
    if (assigned && filed) {
      const days = daysBetween(assigned, filed);
      if (days >= 0) {
        daysToComplaint.push(days);
        filedTotal++;
        if (days <= 30) filedWithin30++;
      }
    }
  }
  kpis['days-to-complaint'] = daysToComplaint.length
    ? Math.round(daysToComplaint.reduce((a, b) => a + b, 0) / daysToComplaint.length)
    : null;
  kpis['filed-30-days'] = filedTotal > 0
    ? Math.round((filedWithin30 / filedTotal) * 100)
    : null;

  // ── TOD Days from Resolutions detail rows ──
  const resRows = (b.resolutions?.detailRows ?? []).filter(
    r => topAttorney(r._groupingLabel) === attorney,
  );
  const todDays: number[] = [];
  for (const row of resRows) {
    const assigned = parseDate(row['Matter: Date Assigned To Litigation Unit']);
    const resolved = parseDate(row['Resolution Date']);
    if (assigned && resolved) {
      const days = daysBetween(assigned, resolved);
      if (days >= 0) todDays.push(days);
    }
  }
  kpis['tod-days'] = todDays.length
    ? Math.round(todDays.reduce((a, b) => a + b, 0) / todDays.length)
    : null;

  // ── Missing Answers count per attorney ──
  // Missing Ans (Served Dt) report is grouped by attorney — use directly
  const missingG = b.missingAns?.groupings.find(g => g.label === attorney);
  kpis['answers-missing'] = getAgg(missingG, 'Record Count') ?? 0;

  // days-to-service and service-30-days require data not available → null
  kpis['days-to-service'] = null;
  kpis['service-30-days'] = null;

  // ── 10-Day Letters Needed count per attorney ──
  // Form C 10 Day report: grouped Team > Attorney > Matter (3 levels)
  // Extract attorney from level 2 of _groupingLabel
  const fc10Rows = (b.formC10Day?.detailRows ?? []).filter(r => {
    const atty = level2Attorney(r._groupingLabel);
    return atty === attorney;
  });
  kpis['10day-letter'] = fc10Rows.length > 0 ? fc10Rows.length : 0;

  // ── Motions to Compel filed count per attorney ──
  // Need Form C Motion report: grouped Team > Attorney (2 levels)
  const motionRows = (b.motionReport?.detailRows ?? []).filter(r => {
    const atty = level2Attorney(r._groupingLabel);
    return atty === attorney;
  });
  kpis['motions-compel'] = motionRows.length > 0 ? motionRows.length : 0;

  // Avg days past-due → motion filed
  const motionDays: number[] = [];
  for (const row of motionRows) {
    const letterSent = parseDate(row['10 Day Letter Sent']);
    const motionDate = parseDate(row['Date Motion Filed']);
    if (letterSent && motionDate) {
      const days = daysBetween(letterSent, motionDate);
      if (days >= 0) motionDays.push(days);
    }
  }
  kpis['days-to-motion'] = motionDays.length
    ? Math.round(motionDays.reduce((a, b) => a + b, 0) / motionDays.length)
    : null;

  // ── Past Due Service count per attorney ──
  const pastDueG = b.pastDue?.groupings.find(g => g.label === attorney);
  kpis['past-due-svc'] = getAgg(pastDueG, 'Record Count') ?? 0;

  // ── Mediation / Arb scheduled ──
  const arbMedG = b.arbMed?.groupings.find(g => g.label === attorney);
  kpis['mediation'] = getAgg(arbMedG, 'Record Count') ?? 0;

  // ── DED Extensions (no count metric available in SF dashboards) ──
  kpis['ded-extensions'] = null;

  // ── Red KPIs (no data available) ──
  kpis['defaults-timely'] = null;
  kpis['plaintiff-disc'] = null;
  kpis['defense-disc'] = null;
  kpis['depos-1yr'] = null;
  kpis['depos-180'] = null;
  kpis['expert-reports'] = null;
  kpis['trial-ready'] = null;
  kpis['data-completeness'] = null;
  kpis['client-service'] = null;
  kpis['sds-completion'] = null;
  kpis['overall-kpi'] = null;

  return kpis;
}

// ─── Cell formatting ────────────────────────────────────────────────────────

function formatValue(_key: string, value: number | null, kpi: KpiDef): string {
  if (value === null || value === undefined) return '—';
  switch (kpi.format) {
    case 'currency': return fmt$(value);
    case 'pct': return `${value}%`;
    case 'days': return `${fmtNum(value)}d`;
    case 'count': return fmtNum(value);
    case 'number': return fmtNum(value);
    default: return String(value);
  }
}

function cellColorClass(kpi: KpiDef, value: number | null): string {
  if (value === null || !kpi.thresholds) return '';
  const [good, mid] = kpi.thresholds;
  if (kpi.higherBetter) {
    if (value >= good) return 'bg-green-500/15 text-green-400';
    if (value >= mid) return 'bg-amber-500/15 text-amber-400';
    return 'bg-red-500/15 text-red-400';
  } else {
    // Lower is better (days)
    if (value <= good) return 'bg-green-500/15 text-green-400';
    if (value <= mid) return 'bg-amber-500/15 text-amber-400';
    return 'bg-red-500/15 text-red-400';
  }
}

function statusBadge(status: 'green' | 'yellow' | 'red') {
  if (status === 'green') return 'bg-green-500/20 text-green-400';
  if (status === 'yellow') return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

// ─── Summary cards ──────────────────────────────────────────────────────────

function ScorecardSummary({
  attorneyCount,
  kpiCount,
  populatedPct,
}: {
  attorneyCount: number;
  kpiCount: number;
  populatedPct: number;
}) {
  return (
    <DashboardGrid cols={3} className="mb-6">
      <StatCard label="Total Attorneys" value={attorneyCount} variant="glass" />
      <StatCard label="KPIs Tracked" value={kpiCount} variant="glass" />
      <StatCard
        label="Data Populated"
        value={`${populatedPct}%`}
        delta={populatedPct >= 50 ? 'Good coverage' : 'Limited data'}
        deltaType={populatedPct >= 50 ? 'positive' : 'negative'}
        variant="glass"
      />
    </DashboardGrid>
  );
}

// ─── Scorecard table ────────────────────────────────────────────────────────

function ScorecardTable({
  attorneys,
  kpiData,
}: {
  attorneys: string[];
  kpiData: Map<string, KpiValues>;
}) {
  return (
    <div className="overflow-auto rounded-lg border border-border scorecard-scroll h-full">
      <table className="text-xs w-full" style={{ minWidth: SCORECARD_KPIS.length * 120 + 200 }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/80 backdrop-blur z-20 min-w-[200px] border-r border-border">
              Attorney
            </th>
            {SCORECARD_KPIS.map(kpi => (
              <th
                key={kpi.key}
                className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[120px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider', statusBadge(kpi.status))}>
                    {kpi.status === 'green' ? 'Live' : kpi.status === 'yellow' ? 'Partial' : 'N/A'}
                  </span>
                  <span className="text-[10px] leading-tight max-w-[110px] whitespace-normal text-center">
                    {kpi.label}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attorneys.map((attorney, aIdx) => {
            const kpis = kpiData.get(attorney) ?? {};
            return (
              <tr
                key={attorney}
                className={cn(
                  'border-b border-border last:border-0 transition-colors hover:bg-primary/5',
                  aIdx % 2 === 0 ? 'bg-card' : 'bg-table-stripe',
                )}
              >
                <td className="py-2 px-3 font-medium whitespace-nowrap sticky left-0 bg-inherit z-10 min-w-[200px] border-r border-border">
                  {attorney}
                </td>
                {SCORECARD_KPIS.map(kpi => {
                  const value = kpis[kpi.key] ?? null;
                  const colorCls = cellColorClass(kpi, value);
                  return (
                    <td
                      key={kpi.key}
                      className={cn(
                        'text-center py-2 px-2 tabular-nums',
                        colorCls,
                        !colorCls && value === null && 'text-muted-foreground/40',
                      )}
                    >
                      {formatValue(kpi.key, value, kpi)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function LitScorecard() {
  // ── Load reports ──
  const { data: openLitData, loading: l1, refresh: r1 } =
    useSalesforceReport<ReportSummaryResponse>({ id: OPEN_LIT_ID, type: 'report', mode: 'full' });
  const { data: unitGoalsData, loading: l2, refresh: r2 } =
    useSalesforceReport<ReportSummaryResponse>({ id: UNIT_GOALS_ID, type: 'report' });
  const { data: missingAnsData, loading: l4 } =
    useSalesforceReport<ReportSummaryResponse>({ id: MISSING_ANS_SERVED_ID, type: 'report' });
  const { data: pastDueData, loading: l5 } =
    useSalesforceReport<ReportSummaryResponse>({ id: PAST_DUE_SERVICE_ID, type: 'report' });
  const { data: formC10Data, loading: l6 } =
    useSalesforceReport<ReportSummaryResponse>({ id: FORM_C_10DAY_ID, type: 'report', mode: 'full' });
  const { data: motionData, loading: l7 } =
    useSalesforceReport<ReportSummaryResponse>({ id: NEED_FORM_C_MOTION_ID, type: 'report', mode: 'full' });
  const { data: arbMedData, loading: l8 } =
    useSalesforceReport<ReportSummaryResponse>({ id: ARB_MED_60_ID, type: 'report' });
  const { data: resData, loading: l9 } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report', mode: 'full' });

  const loading = l1 || l2 || l4 || l5 || l6 || l7 || l8 || l9;

  const bundle: ReportBundle = useMemo(() => ({
    openLit: openLitData,
    unitGoals: unitGoalsData,
    missingAns: missingAnsData,
    pastDue: pastDueData,
    formC10Day: formC10Data,
    motionReport: motionData,
    arbMed: arbMedData,
    resolutions: resData,
  }), [openLitData, unitGoalsData, missingAnsData, pastDueData, formC10Data, motionData, arbMedData, resData]);

  const attorneys = useMemo(() => buildAttorneyList(bundle), [bundle]);

  const kpiData = useMemo(() => {
    const map = new Map<string, KpiValues>();
    for (const attorney of attorneys) {
      map.set(attorney, computeKpisForAttorney(attorney, bundle));
    }
    return map;
  }, [attorneys, bundle]);

  // Summary stats
  const populatedPct = useMemo(() => {
    if (attorneys.length === 0) return 0;
    let filled = 0;
    let total = 0;
    for (const kpis of kpiData.values()) {
      for (const kpi of SCORECARD_KPIS) {
        total++;
        if (kpis[kpi.key] !== null && kpis[kpi.key] !== undefined) filled++;
      }
    }
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [kpiData, attorneys]);

  const handleRefresh = () => { r1(); r2(); };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="LIT Attorney Scorecard"
          subtitle={`${attorneys.length} attorneys × ${SCORECARD_KPIS.length} KPIs — powered by Salesforce report data`}
        />
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && attorneys.length === 0 ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading scorecard data from Salesforce...
        </div>
      ) : (
        <>
          <ScorecardSummary
            attorneyCount={attorneys.length}
            kpiCount={SCORECARD_KPIS.length}
            populatedPct={populatedPct}
          />

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500/50" /> Live — data from SF reports
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500/50" /> Partial — limited data
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500/50" /> N/A — not yet trackable
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ScorecardTable
              attorneys={attorneys}
              kpiData={kpiData}
            />
          </div>
        </>
      )}
    </div>
  );
}
