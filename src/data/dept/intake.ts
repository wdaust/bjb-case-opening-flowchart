// ── Intake Department Page Configs ───────────────────────────────────────
// 4 pages: Dashboard, New Leads, Pipeline, Conversion Metrics

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

// ── Shared constants ────────────────────────────────────────────────────
const DEPT_ID = 'intake';
const DEPT_LABEL = 'Intake';
const ACCENT = '#6366f1';

const TODAY = new Date('2026-03-18');

// ── Shared helpers ───────────────────────────────────────────────────────
function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((TODAY.getTime() - d.getTime()) / 86_400_000));
}

function isToday(dateStr: string): boolean {
  return daysSince(dateStr) === 0;
}

function isThisWeek(dateStr: string): boolean {
  return daysSince(dateStr) <= 7;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === TODAY.getFullYear() && d.getMonth() === TODAY.getMonth();
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

// Filter all intake cases
function intakeCases(cases: LitCase[]): LitCase[] {
  return cases.filter((c) => c.parentStage === 'intake');
}

// ── Seed-stable deterministic pseudo-random ──────────────────────────────
// Used to derive synthetic fields (lead source, hours, reps) from case IDs
// without adding unmapped fields to LitCase.
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const LEAD_SOURCES = ['Web Form', 'Referral', 'TV Ad', 'Google Ad', 'Social Media', 'Walk-in', 'Phone'] as const;
type LeadSource = (typeof LEAD_SOURCES)[number];

function leadSource(c: LitCase): LeadSource {
  return LEAD_SOURCES[hashCode(c.id) % LEAD_SOURCES.length];
}

const INTAKE_REPS = [
  'Sofia Ramirez',
  'Derrick Lane',
  'Aisha Booth',
  'Marco Delaney',
  'Priya Singh',
  'Kevin Tran',
] as const;
type IntakeRep = (typeof INTAKE_REPS)[number];

function intakeRep(c: LitCase): IntakeRep {
  return INTAKE_REPS[hashCode(c.id + 'rep') % INTAKE_REPS.length];
}

// Synthetic intake sub-status derived from nextAction field content
type IntakeStatus = 'New' | 'Contacted' | 'Awaiting Callback' | 'Awaiting Docs' | 'Signed' | 'Rejected';

function intakeStatus(c: LitCase): IntakeStatus {
  const h = hashCode(c.id + 'status') % 100;
  if (h < 12) return 'New';
  if (h < 28) return 'Contacted';
  if (h < 46) return 'Awaiting Callback';
  if (h < 62) return 'Awaiting Docs';
  if (h < 88) return 'Signed';
  return 'Rejected';
}

// Synthetic lead intake hour (0-23) derived from case ID
function intakeHour(c: LitCase): number {
  return hashCode(c.id + 'hour') % 24;
}

// Days to sign from openDate (0 if not signed)
function daysToSign(c: LitCase): number {
  const st = intakeStatus(c);
  if (st !== 'Signed') return 0;
  return (hashCode(c.id + 'sign') % 14) + 1;
}

// ── Synthetic sparkline helpers ──────────────────────────────────────────
function dailyCountsLast30(cases: LitCase[], predicate: (c: LitCase) => boolean): number[] {
  const counts = Array(30).fill(0) as number[];
  for (const c of cases) {
    const age = daysSince(c.openDate);
    if (age >= 0 && age < 30 && predicate(c)) {
      counts[29 - age]++;
    }
  }
  return counts;
}

// ── PAGE 1: DASHBOARD ────────────────────────────────────────────────────
const dashboardPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'dashboard',
  title: 'Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: intakeCases,

  statCards: [
    {
      label: 'New Leads Today',
      compute: (cases) => {
        const ic = intakeCases(cases);
        return ic.filter((c) => isToday(c.openDate)).length;
      },
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const today = ic.filter((c) => isToday(c.openDate)).length;
        const yesterday = ic.filter((c) => daysSince(c.openDate) === 1).length;
        const diff = today - yesterday;
        const sign = diff >= 0 ? '+' : '';
        return {
          value: `${sign}${diff} vs yesterday`,
          type: diff >= 0 ? 'positive' : 'negative',
        };
      },
      sparkline: (cases) =>
        dailyCountsLast30(intakeCases(cases), () => true),
    },
    {
      label: 'Sign Rate (MTD)',
      compute: (cases) => {
        const ic = intakeCases(cases).filter((c) => isThisMonth(c.openDate));
        if (!ic.length) return '0.0%';
        const signed = ic.filter((c) => intakeStatus(c) === 'Signed').length;
        return fmtPct(signed / ic.length);
      },
      computeDelta: (cases) => {
        // Compare to last month
        const lastMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
        const ic = intakeCases(cases);
        const thisM = ic.filter((c) => isThisMonth(c.openDate));
        const lastM = ic.filter((c) => {
          const d = new Date(c.openDate);
          return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
        });
        const rateThis = thisM.length ? thisM.filter((c) => intakeStatus(c) === 'Signed').length / thisM.length : 0;
        const rateLast = lastM.length ? lastM.filter((c) => intakeStatus(c) === 'Signed').length / lastM.length : 0;
        const diff = ((rateThis - rateLast) * 100).toFixed(1);
        const sign = rateThis >= rateLast ? '+' : '';
        return {
          value: `${sign}${diff}pp vs last month`,
          type: rateThis >= rateLast ? 'positive' : 'negative',
        };
      },
      sparkline: (cases) => {
        // MTD sign rate by day
        const ic = intakeCases(cases);
        const days = TODAY.getDate(); // days elapsed in month
        return Array.from({ length: days }, (_, i) => {
          const dayOfMonth = i + 1;
          const slice = ic.filter((c) => {
            const d = new Date(c.openDate);
            return isThisMonth(c.openDate) && d.getDate() <= dayOfMonth;
          });
          if (!slice.length) return 0;
          return Math.round((slice.filter((c) => intakeStatus(c) === 'Signed').length / slice.length) * 100);
        });
      },
    },
    {
      label: 'Avg Response Time',
      compute: (cases) => {
        // Proxy: avg days since openDate for cases still in "Contacted" or "New" status
        const ic = intakeCases(cases).filter(
          (c) => intakeStatus(c) === 'New' || intakeStatus(c) === 'Contacted',
        );
        if (!ic.length) return '—';
        const avgHrs = (ic.reduce((s, c) => s + daysSince(c.openDate) * 24, 0) / ic.length).toFixed(1);
        return `${avgHrs} hrs`;
      },
      computeDelta: (cases) => {
        const ic = intakeCases(cases).filter(
          (c) => intakeStatus(c) === 'New' || intakeStatus(c) === 'Contacted',
        );
        // Simulate a slight improvement vs target of 4 hrs
        const avg = ic.length
          ? ic.reduce((s, c) => s + daysSince(c.openDate) * 24, 0) / ic.length
          : 0;
        const target = 4;
        const diff = (avg - target).toFixed(1);
        const over = avg > target;
        return {
          value: over ? `+${diff} hrs over target` : `${diff} hrs under target`,
          type: over ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Pending Follow-Up',
      compute: (cases) => {
        return intakeCases(cases).filter(
          (c) =>
            intakeStatus(c) === 'Awaiting Callback' || intakeStatus(c) === 'Awaiting Docs',
        ).length;
      },
      computeDelta: (cases) => {
        const pending = intakeCases(cases).filter(
          (c) =>
            intakeStatus(c) === 'Awaiting Callback' || intakeStatus(c) === 'Awaiting Docs',
        );
        const overdue = pending.filter((c) => daysSince(c.nextActionDue) > 0).length;
        return {
          value: `${overdue} overdue`,
          type: overdue > 0 ? 'negative' : 'positive',
        };
      },
      sparkline: (cases) =>
        dailyCountsLast30(
          intakeCases(cases),
          (c) => intakeStatus(c) === 'Awaiting Callback' || intakeStatus(c) === 'Awaiting Docs',
        ),
    },
  ],

  charts: [
    {
      title: 'Daily Leads vs Signed (Last 30 Days)',
      subtitle: 'New intake cases opened vs signed per day',
      type: 'line',
      xAxisKey: 'date',
      series: [
        { dataKey: 'leads', color: ACCENT, name: 'New Leads' },
        { dataKey: 'signed', color: '#10b981', name: 'Signed' },
      ],
      getData: (cases) => {
        const ic = intakeCases(cases);
        return Array.from({ length: 30 }, (_, i) => {
          const daysBack = 29 - i;
          const targetDate = new Date(TODAY);
          targetDate.setDate(TODAY.getDate() - daysBack);
          const label = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
          const dayLeads = ic.filter((c) => daysSince(c.openDate) === daysBack).length;
          const daySigned = ic.filter(
            (c) => daysSince(c.openDate) === daysBack && intakeStatus(c) === 'Signed',
          ).length;
          return { date: label, leads: dayLeads, signed: daySigned };
        });
      },
    },
    {
      title: 'Lead Source Distribution',
      subtitle: 'All intake cases by origination channel',
      type: 'pie',
      series: LEAD_SOURCES.map((src, i) => ({
        dataKey: 'value',
        name: src,
        color: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#f59e0b', '#ef4444'][i % 7],
      })),
      getData: (cases) => {
        const ic = intakeCases(cases);
        const counts: Record<string, number> = {};
        for (const src of LEAD_SOURCES) counts[src] = 0;
        for (const c of ic) counts[leadSource(c)]++;
        return LEAD_SOURCES.map((src) => ({ name: src, value: counts[src] }));
      },
    },
  ],

  table: {
    title: 'Recent Intake Cases',
    keyField: 'id',
    maxRows: 20,
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case Name', sortable: true },
      { key: 'caseType', label: 'Type', sortable: true },
      { key: 'openDate', label: 'Opened', sortable: true },
      { key: 'leadSrc', label: 'Lead Source', sortable: true },
      { key: 'rep', label: 'Intake Rep', sortable: true },
      { key: 'statusLabel', label: 'Status', sortable: true },
      { key: 'daysOpen', label: 'Days Open', sortable: true },
      { key: 'nextAction', label: 'Next Action', sortable: false },
    ],
    getData: (cases) =>
      intakeCases(cases)
        .sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime())
        .slice(0, 20)
        .map((c) => ({
          id: c.id,
          title: c.title,
          caseType: c.caseType,
          openDate: c.openDate,
          leadSrc: leadSource(c),
          rep: intakeRep(c),
          statusLabel: intakeStatus(c),
          daysOpen: daysSince(c.openDate),
          nextAction: c.nextAction,
        })),
  },
};

// ── PAGE 2: NEW LEADS ────────────────────────────────────────────────────
const newLeadsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'new-leads',
  title: 'New Leads',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: intakeCases,

  statCards: [
    {
      label: 'New Today',
      compute: (cases) => intakeCases(cases).filter((c) => isToday(c.openDate)).length,
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const today = ic.filter((c) => isToday(c.openDate)).length;
        const yesterday = ic.filter((c) => daysSince(c.openDate) === 1).length;
        const diff = today - yesterday;
        return {
          value: diff >= 0 ? `+${diff} vs yesterday` : `${diff} vs yesterday`,
          type: diff >= 0 ? 'positive' : 'negative',
        };
      },
    },
    {
      label: 'This Week',
      compute: (cases) => intakeCases(cases).filter((c) => isThisWeek(c.openDate)).length,
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const thisWk = ic.filter((c) => isThisWeek(c.openDate)).length;
        const lastWk = ic.filter((c) => {
          const age = daysSince(c.openDate);
          return age > 7 && age <= 14;
        }).length;
        const diff = thisWk - lastWk;
        return {
          value: diff >= 0 ? `+${diff} vs last week` : `${diff} vs last week`,
          type: diff >= 0 ? 'positive' : 'negative',
        };
      },
      sparkline: (cases) => {
        const ic = intakeCases(cases);
        return Array.from({ length: 7 }, (_, i) => {
          const age = 6 - i;
          return ic.filter((c) => daysSince(c.openDate) === age).length;
        });
      },
    },
    {
      label: 'Uncontacted',
      compute: (cases) =>
        intakeCases(cases).filter((c) => intakeStatus(c) === 'New').length,
      computeDelta: (cases) => {
        const uncontacted = intakeCases(cases).filter((c) => intakeStatus(c) === 'New');
        const urgent = uncontacted.filter((c) => daysSince(c.openDate) >= 1).length;
        return {
          value: `${urgent} older than 24 hrs`,
          type: urgent > 0 ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Rejected Today',
      compute: (cases) =>
        intakeCases(cases).filter(
          (c) => intakeStatus(c) === 'Rejected' && isToday(c.lastActivityDate),
        ).length,
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const rejToday = ic.filter(
          (c) => intakeStatus(c) === 'Rejected' && isToday(c.lastActivityDate),
        ).length;
        const rejYest = ic.filter(
          (c) => intakeStatus(c) === 'Rejected' && daysSince(c.lastActivityDate) === 1,
        ).length;
        const diff = rejToday - rejYest;
        return {
          value: diff >= 0 ? `+${diff} vs yesterday` : `${diff} vs yesterday`,
          type: diff <= 0 ? 'positive' : 'negative',
        };
      },
    },
  ],

  charts: [
    {
      title: 'Leads by Hour of Day',
      subtitle: 'Volume distribution across operating hours',
      type: 'bar',
      xAxisKey: 'hour',
      series: [{ dataKey: 'count', color: ACCENT, name: 'Leads' }],
      getData: (cases) => {
        const ic = intakeCases(cases);
        const counts = Array(24).fill(0) as number[];
        for (const c of ic) counts[intakeHour(c)]++;
        return counts.map((count, h) => ({
          hour: `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? 'am' : 'pm'}`,
          count,
        }));
      },
    },
    {
      title: 'Leads by Source Per Day (Last 7 Days)',
      subtitle: 'Stacked channel breakdown — trailing week',
      type: 'stacked-bar',
      xAxisKey: 'day',
      series: LEAD_SOURCES.map((src, i) => ({
        dataKey: src.replace(/\s+/g, '_'),
        color: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#f59e0b', '#ef4444'][i % 7],
        name: src,
      })),
      getData: (cases) => {
        const ic = intakeCases(cases);
        return Array.from({ length: 7 }, (_, i) => {
          const daysBack = 6 - i;
          const targetDate = new Date(TODAY);
          targetDate.setDate(TODAY.getDate() - daysBack);
          const label = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
          const daySlice = ic.filter((c) => daysSince(c.openDate) === daysBack);
          const row: Record<string, any> = { day: label };
          for (const src of LEAD_SOURCES) {
            row[src.replace(/\s+/g, '_')] = daySlice.filter((c) => leadSource(c) === src).length;
          }
          return row;
        });
      },
    },
  ],

  table: {
    title: 'New Leads — This Week',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Name', sortable: true },
      { key: 'caseType', label: 'Type', sortable: true },
      { key: 'openDate', label: 'Received', sortable: true },
      { key: 'leadSrc', label: 'Source', sortable: true },
      { key: 'rep', label: 'Assigned To', sortable: true },
      { key: 'statusLabel', label: 'Status', sortable: true },
      { key: 'hoursOld', label: 'Age (hrs)', sortable: true },
      { key: 'nextActionDue', label: 'Follow-Up Due', sortable: true },
    ],
    getData: (cases) =>
      intakeCases(cases)
        .filter((c) => isThisWeek(c.openDate))
        .sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime())
        .map((c) => ({
          id: c.id,
          title: c.title,
          caseType: c.caseType,
          openDate: c.openDate,
          leadSrc: leadSource(c),
          rep: intakeRep(c),
          statusLabel: intakeStatus(c),
          hoursOld: (daysSince(c.openDate) * 24).toFixed(0),
          nextActionDue: c.nextActionDue,
        })),
  },
};

// ── PAGE 3: PIPELINE ─────────────────────────────────────────────────────
const pipelinePage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'pipeline',
  title: 'Pipeline',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: intakeCases,

  statCards: [
    {
      label: 'Pipeline Total',
      compute: (cases) => {
        // Active cases — not rejected, not yet signed (still in intake)
        return intakeCases(cases).filter(
          (c) => intakeStatus(c) !== 'Rejected' && intakeStatus(c) !== 'Signed',
        ).length;
      },
      computeDelta: (cases) => {
        const active = intakeCases(cases).filter(
          (c) => intakeStatus(c) !== 'Rejected' && intakeStatus(c) !== 'Signed',
        );
        const overSla = active.filter((c) => daysSince(c.openDate) > c.slaTarget).length;
        return {
          value: `${overSla} over SLA`,
          type: overSla > 0 ? 'negative' : 'positive',
        };
      },
      sparkline: (cases) => {
        // Snapshot of active pipeline count over last 14 days (simulated from data)
        const ic = intakeCases(cases);
        return Array.from({ length: 14 }, (_, i) => {
          const daysBack = i;
          return ic.filter(
            (c) =>
              daysSince(c.openDate) >= daysBack &&
              intakeStatus(c) !== 'Rejected',
          ).length;
        }).reverse();
      },
    },
    {
      label: 'Awaiting Callback',
      compute: (cases) =>
        intakeCases(cases).filter((c) => intakeStatus(c) === 'Awaiting Callback').length,
      computeDelta: (cases) => {
        const awaiting = intakeCases(cases).filter((c) => intakeStatus(c) === 'Awaiting Callback');
        const stale = awaiting.filter((c) => daysSince(c.lastActivityDate) >= 3).length;
        return {
          value: `${stale} stale ≥3 days`,
          type: stale > 0 ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Awaiting Docs',
      compute: (cases) =>
        intakeCases(cases).filter((c) => intakeStatus(c) === 'Awaiting Docs').length,
      computeDelta: (cases) => {
        const awaiting = intakeCases(cases).filter((c) => intakeStatus(c) === 'Awaiting Docs');
        const stale = awaiting.filter((c) => daysSince(c.lastActivityDate) >= 5).length;
        return {
          value: `${stale} stale ≥5 days`,
          type: stale > 0 ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Avg Days in Pipeline',
      compute: (cases) => {
        const active = intakeCases(cases).filter(
          (c) => intakeStatus(c) !== 'Rejected' && intakeStatus(c) !== 'Signed',
        );
        if (!active.length) return '—';
        const avg = active.reduce((s, c) => s + daysSince(c.openDate), 0) / active.length;
        return avg.toFixed(1) + ' days';
      },
      computeDelta: (cases) => {
        const active = intakeCases(cases).filter(
          (c) => intakeStatus(c) !== 'Rejected' && intakeStatus(c) !== 'Signed',
        );
        const target = 7; // 7-day pipeline SLA
        const avg = active.length
          ? active.reduce((s, c) => s + daysSince(c.openDate), 0) / active.length
          : 0;
        const diff = (avg - target).toFixed(1);
        const over = avg > target;
        return {
          value: over ? `+${diff} days over target` : 'Within SLA target',
          type: over ? 'negative' : 'positive',
        };
      },
    },
  ],

  charts: [
    {
      title: 'Pipeline by Stage',
      subtitle: 'Active intake cases grouped by current status',
      type: 'bar',
      xAxisKey: 'stage',
      series: [
        { dataKey: 'count', color: ACCENT, name: 'Cases' },
        { dataKey: 'overdue', color: '#ef4444', name: 'Overdue' },
      ],
      getData: (cases) => {
        const ic = intakeCases(cases);
        const stages: IntakeStatus[] = ['New', 'Contacted', 'Awaiting Callback', 'Awaiting Docs'];
        return stages.map((st) => {
          const slice = ic.filter((c) => intakeStatus(c) === st);
          return {
            stage: st,
            count: slice.length,
            overdue: slice.filter((c) => daysSince(c.nextActionDue) > 0).length,
          };
        });
      },
    },
  ],

  table: {
    title: 'Active Pipeline Cases',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case Name', sortable: true },
      { key: 'caseType', label: 'Type', sortable: true },
      { key: 'statusLabel', label: 'Pipeline Stage', sortable: true },
      { key: 'rep', label: 'Rep', sortable: true },
      { key: 'leadSrc', label: 'Source', sortable: true },
      { key: 'daysOpen', label: 'Days Open', sortable: true },
      { key: 'lastActivity', label: 'Last Activity', sortable: true },
      { key: 'nextActionDue', label: 'Next Due', sortable: true },
      { key: 'nextAction', label: 'Next Action', sortable: false },
      { key: 'gateProgress', label: 'Gate %', sortable: true },
    ],
    getData: (cases) =>
      intakeCases(cases)
        .filter((c) => intakeStatus(c) !== 'Rejected' && intakeStatus(c) !== 'Signed')
        .sort((a, b) => daysSince(b.openDate) - daysSince(a.openDate))
        .map((c) => {
          const completed = c.gateChecklist.filter((g) => g.completed).length;
          const total = c.gateChecklist.length || 1;
          return {
            id: c.id,
            title: c.title,
            caseType: c.caseType,
            statusLabel: intakeStatus(c),
            rep: intakeRep(c),
            leadSrc: leadSource(c),
            daysOpen: daysSince(c.openDate),
            lastActivity: c.lastActivityDate,
            nextActionDue: c.nextActionDue,
            nextAction: c.nextAction,
            gateProgress: `${Math.round((completed / total) * 100)}%`,
          };
        }),
  },
};

// ── PAGE 4: CONVERSION METRICS ───────────────────────────────────────────
const conversionMetricsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'conversion-metrics',
  title: 'Conversion Metrics',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: intakeCases,

  statCards: [
    {
      label: 'Contact Rate',
      compute: (cases) => {
        const ic = intakeCases(cases);
        if (!ic.length) return '0.0%';
        const contacted = ic.filter((c) => intakeStatus(c) !== 'New').length;
        return fmtPct(contacted / ic.length);
      },
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const contacted = ic.filter((c) => intakeStatus(c) !== 'New').length;
        const rate = ic.length ? contacted / ic.length : 0;
        const target = 0.9;
        const diff = ((rate - target) * 100).toFixed(1);
        const over = rate >= target;
        return {
          value: over ? `+${diff}pp above 90% target` : `${diff}pp below 90% target`,
          type: over ? 'positive' : 'negative',
        };
      },
      sparkline: (cases) => {
        // Contact rate over last 7 days
        const ic = intakeCases(cases);
        return Array.from({ length: 7 }, (_, i) => {
          const daysBack = 6 - i;
          const slice = ic.filter((c) => daysSince(c.openDate) >= daysBack);
          if (!slice.length) return 0;
          return Math.round(
            (slice.filter((c) => intakeStatus(c) !== 'New').length / slice.length) * 100,
          );
        });
      },
    },
    {
      label: 'Sign Rate',
      compute: (cases) => {
        const ic = intakeCases(cases);
        if (!ic.length) return '0.0%';
        const signed = ic.filter((c) => intakeStatus(c) === 'Signed').length;
        return fmtPct(signed / ic.length);
      },
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const signed = ic.filter((c) => intakeStatus(c) === 'Signed').length;
        const rate = ic.length ? signed / ic.length : 0;
        const target = 0.65;
        const diff = ((rate - target) * 100).toFixed(1);
        const over = rate >= target;
        return {
          value: over ? `+${diff}pp above 65% target` : `${diff}pp below 65% target`,
          type: over ? 'positive' : 'negative',
        };
      },
      sparkline: (cases) => {
        const ic = intakeCases(cases);
        return Array.from({ length: 7 }, (_, i) => {
          const daysBack = 6 - i;
          const slice = ic.filter((c) => daysSince(c.openDate) >= daysBack);
          if (!slice.length) return 0;
          return Math.round(
            (slice.filter((c) => intakeStatus(c) === 'Signed').length / slice.length) * 100,
          );
        });
      },
    },
    {
      label: 'Avg Time to Sign',
      compute: (cases) => {
        const signed = intakeCases(cases).filter((c) => intakeStatus(c) === 'Signed');
        if (!signed.length) return '—';
        const avg = signed.reduce((s, c) => s + daysToSign(c), 0) / signed.length;
        return avg.toFixed(1) + ' days';
      },
      computeDelta: (cases) => {
        const signed = intakeCases(cases).filter((c) => intakeStatus(c) === 'Signed');
        const avg = signed.length
          ? signed.reduce((s, c) => s + daysToSign(c), 0) / signed.length
          : 0;
        const target = 3;
        const diff = (avg - target).toFixed(1);
        const over = avg > target;
        return {
          value: over ? `+${diff} days over ${target}-day target` : `Within ${target}-day target`,
          type: over ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Top Rep (Sign Rate)',
      compute: (cases) => {
        const ic = intakeCases(cases);
        const repStats: Record<string, { total: number; signed: number }> = {};
        for (const rep of INTAKE_REPS) repStats[rep] = { total: 0, signed: 0 };
        for (const c of ic) {
          const rep = intakeRep(c);
          repStats[rep].total++;
          if (intakeStatus(c) === 'Signed') repStats[rep].signed++;
        }
        let bestRep: string = INTAKE_REPS[0];
        let bestRate = 0;
        for (const [rep, stats] of Object.entries(repStats)) {
          const rate = stats.total ? stats.signed / stats.total : 0;
          if (rate > bestRate) {
            bestRate = rate;
            bestRep = rep;
          }
        }
        return `${bestRep.split(' ')[0]} — ${fmtPct(bestRate)}`;
      },
      computeDelta: (cases) => {
        const ic = intakeCases(cases);
        const repStats: Record<string, { total: number; signed: number }> = {};
        for (const rep of INTAKE_REPS) repStats[rep] = { total: 0, signed: 0 };
        for (const c of ic) {
          const rep = intakeRep(c);
          repStats[rep].total++;
          if (intakeStatus(c) === 'Signed') repStats[rep].signed++;
        }
        const rates = Object.entries(repStats).map(([rep, s]) => ({
          rep,
          rate: s.total ? s.signed / s.total : 0,
        }));
        rates.sort((a, b) => b.rate - a.rate);
        const spread = ((rates[0].rate - rates[rates.length - 1].rate) * 100).toFixed(1);
        return {
          value: `${spread}pp spread across team`,
          type: parseFloat(spread) < 20 ? 'positive' : 'negative',
        };
      },
    },
  ],

  charts: [
    {
      title: 'Conversion Rate by Rep',
      subtitle: 'Contact rate and sign rate per intake specialist',
      type: 'bar',
      xAxisKey: 'rep',
      series: [
        { dataKey: 'contactRate', color: '#8b5cf6', name: 'Contact Rate %' },
        { dataKey: 'signRate', color: '#10b981', name: 'Sign Rate %' },
        { dataKey: 'total', color: ACCENT, name: 'Total Leads' },
      ],
      getData: (cases) => {
        const ic = intakeCases(cases);
        return INTAKE_REPS.map((rep) => {
          const repCases = ic.filter((c) => intakeRep(c) === rep);
          const total = repCases.length;
          const contacted = repCases.filter((c) => intakeStatus(c) !== 'New').length;
          const signed = repCases.filter((c) => intakeStatus(c) === 'Signed').length;
          return {
            rep: rep.split(' ')[0], // first name for chart brevity
            total,
            contactRate: total ? parseFloat(((contacted / total) * 100).toFixed(1)) : 0,
            signRate: total ? parseFloat(((signed / total) * 100).toFixed(1)) : 0,
          };
        });
      },
    },
    {
      title: 'Monthly Sign Rate Trend',
      subtitle: 'Rolling 6-month sign rate — all intake',
      type: 'line',
      xAxisKey: 'month',
      series: [
        { dataKey: 'signRate', color: '#10b981', name: 'Sign Rate %' },
        { dataKey: 'contactRate', color: ACCENT, name: 'Contact Rate %' },
      ],
      getData: (cases) => {
        const ic = intakeCases(cases);
        return Array.from({ length: 6 }, (_, i) => {
          const mOffset = 5 - i; // 5 months ago → current
          const targetMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() - mOffset, 1);
          const label = targetMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          const slice = ic.filter((c) => {
            const d = new Date(c.openDate);
            return (
              d.getFullYear() === targetMonth.getFullYear() &&
              d.getMonth() === targetMonth.getMonth()
            );
          });
          const total = slice.length || 1;
          const contacted = slice.filter((c) => intakeStatus(c) !== 'New').length;
          const signed = slice.filter((c) => intakeStatus(c) === 'Signed').length;
          return {
            month: label,
            signRate: parseFloat(((signed / total) * 100).toFixed(1)),
            contactRate: parseFloat(((contacted / total) * 100).toFixed(1)),
          };
        });
      },
    },
  ],

  table: {
    title: 'Rep Performance — All Time',
    keyField: 'rep',
    columns: [
      { key: 'rep', label: 'Rep Name', sortable: true },
      { key: 'total', label: 'Total Leads', sortable: true },
      { key: 'contacted', label: 'Contacted', sortable: true },
      { key: 'contactRate', label: 'Contact Rate', sortable: true },
      { key: 'signed', label: 'Signed', sortable: true },
      { key: 'signRate', label: 'Sign Rate', sortable: true },
      { key: 'rejected', label: 'Rejected', sortable: true },
      { key: 'pending', label: 'Pending', sortable: true },
      { key: 'avgDaysToSign', label: 'Avg Days to Sign', sortable: true },
      { key: 'avgEV', label: 'Avg EV (Signed)', sortable: true },
    ],
    getData: (cases) => {
      const ic = intakeCases(cases);
      return INTAKE_REPS.map((rep) => {
        const repCases = ic.filter((c) => intakeRep(c) === rep);
        const total = repCases.length;
        const contacted = repCases.filter((c) => intakeStatus(c) !== 'New').length;
        const signed = repCases.filter((c) => intakeStatus(c) === 'Signed').length;
        const rejected = repCases.filter((c) => intakeStatus(c) === 'Rejected').length;
        const pending = repCases.filter(
          (c) => intakeStatus(c) !== 'Signed' && intakeStatus(c) !== 'Rejected',
        ).length;
        const signedCases = repCases.filter((c) => intakeStatus(c) === 'Signed');
        const avgDays =
          signedCases.length
            ? (signedCases.reduce((s, c) => s + daysToSign(c), 0) / signedCases.length).toFixed(1)
            : '—';
        const avgEV =
          signedCases.length
            ? fmtCurrency(
                Math.round(
                  signedCases.reduce((s, c) => s + c.expectedValue, 0) / signedCases.length,
                ),
              )
            : '—';

        return {
          rep,
          total,
          contacted,
          contactRate: total ? fmtPct(contacted / total) : '0.0%',
          signed,
          signRate: total ? fmtPct(signed / total) : '0.0%',
          rejected,
          pending,
          avgDaysToSign: avgDays,
          avgEV,
        };
      }).sort((a, b) => {
        // Sort by sign rate descending
        const aRate = a.total ? a.signed / a.total : 0;
        const bRate = b.total ? b.signed / b.total : 0;
        return bRate - aRate;
      });
    },
  },
};

// ── Export ───────────────────────────────────────────────────────────────
export const intakePages: DeptPageConfig[] = [
  dashboardPage,
  newLeadsPage,
  pipelinePage,
  conversionMetricsPage,
];
