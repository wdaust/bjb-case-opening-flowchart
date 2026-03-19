// ── Pre-Lit Department Page Configs ──────────────────────────────────────
// 5 pages: Dashboard, Treatment Monitoring, Value Development,
//          Demand Readiness, Negotiation

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

const DEPT_ID = 'pre-lit';
const DEPT_LABEL = 'Pre-Lit';
const ACCENT = '#22c55e';

const fmt$ = (n: number) =>
  '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${Math.round(n)}%`;

const daysSince = (d: string) =>
  Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

// ── Shared base filter ────────────────────────────────────────────────────
const isPreLit = (c: LitCase) => c.parentStage === 'pre-lit';

// ── Palette helpers ───────────────────────────────────────────────────────
const GREEN  = '#22c55e';
const TEAL   = '#14b8a6';
const BLUE   = '#3b82f6';
const INDIGO = '#6366f1';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';
const SLATE  = '#64748b';
const PURPLE = '#a855f7';

// ─────────────────────────────────────────────────────────────────────────
// PAGE 1 · Dashboard
// ─────────────────────────────────────────────────────────────────────────
const dashboardPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'dashboard',
  title: 'Pre-Lit Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(isPreLit),

  statCards: [
    {
      label: 'Active Cases',
      compute: (cases) => cases.length,
      computeDelta: (cases) => ({
        value: `+${Math.round(cases.length * 0.04)} this month`,
        type: 'positive',
      }),
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.9);
        return [base, base + 12, base + 8, base + 20, base + 15, cases.length];
      },
    },
    {
      label: 'Treatment Complete',
      compute: (cases) => {
        const past = cases.filter(
          (c) =>
            c.subStage === 'pre-value-development' ||
            c.subStage === 'pre-demand-readiness' ||
            c.subStage === 'pre-negotiation' ||
            c.subStage === 'pre-resolution-pending',
        );
        return past.length;
      },
      computeDelta: (cases) => {
        const past = cases.filter(
          (c) =>
            c.subStage === 'pre-value-development' ||
            c.subStage === 'pre-demand-readiness' ||
            c.subStage === 'pre-negotiation' ||
            c.subStage === 'pre-resolution-pending',
        );
        return {
          value: fmtPct((past.length / Math.max(cases.length, 1)) * 100) + ' of portfolio',
          type: 'neutral',
        };
      },
    },
    {
      label: 'Demands Sent',
      compute: (cases) => {
        return cases.filter(
          (c) =>
            c.subStage === 'pre-negotiation' ||
            c.subStage === 'pre-resolution-pending',
        ).length;
      },
      computeDelta: (_cases) => ({ value: '+18 MTD', type: 'positive' }),
      sparkline: (_cases) => [12, 15, 10, 18, 22, 18],
    },
    {
      label: 'Avg Case Age (days)',
      compute: (cases) => {
        if (!cases.length) return 0;
        const total = cases.reduce((sum, c) => sum + daysSince(c.openDate), 0);
        return Math.round(total / cases.length);
      },
      computeDelta: (cases) => {
        if (!cases.length) return { value: '—', type: 'neutral' };
        const avg = Math.round(
          cases.reduce((sum, c) => sum + daysSince(c.openDate), 0) / cases.length,
        );
        return { value: avg > 365 ? 'Over 1 yr avg' : 'Within target', type: avg > 365 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Settlements MTD',
      compute: (_cases) => 14,
      computeDelta: (_cases) => ({ value: '+2 vs last month', type: 'positive' }),
      sparkline: (_cases) => [8, 10, 7, 12, 11, 14],
    },
  ],

  charts: [
    {
      title: 'Cases by Sub-Stage',
      subtitle: 'Current distribution across pre-lit pipeline',
      type: 'pie',
      getData: (cases) => {
        const labels: Record<string, string> = {
          'pre-account-opening':   'Account Opening',
          'pre-treatment-monitoring': 'Treatment',
          'pre-value-development': 'Value Dev',
          'pre-demand-readiness':  'Demand Ready',
          'pre-negotiation':       'Negotiation',
          'pre-resolution-pending':'Resolution',
        };
        const counts: Record<string, number> = {};
        for (const c of cases) {
          const key = c.subStage ?? 'unknown';
          counts[key] = (counts[key] ?? 0) + 1;
        }
        return Object.entries(counts).map(([stage, value]) => ({
          name: labels[stage] ?? stage,
          value,
        }));
      },
      series: [
        { dataKey: 'value', color: GREEN,  name: 'Account Opening' },
        { dataKey: 'value', color: TEAL,   name: 'Treatment' },
        { dataKey: 'value', color: BLUE,   name: 'Value Dev' },
        { dataKey: 'value', color: INDIGO, name: 'Demand Ready' },
        { dataKey: 'value', color: AMBER,  name: 'Negotiation' },
        { dataKey: 'value', color: RED,    name: 'Resolution' },
      ],
      xAxisKey: 'name',
    },
    {
      title: 'Monthly Demands Sent vs Settlements',
      subtitle: 'Rolling 6-month trend',
      type: 'line',
      getData: (_cases) => [
        { month: 'Oct', demands: 42, settlements: 8 },
        { month: 'Nov', demands: 38, settlements: 10 },
        { month: 'Dec', demands: 31, settlements: 7 },
        { month: 'Jan', demands: 47, settlements: 12 },
        { month: 'Feb', demands: 52, settlements: 11 },
        { month: 'Mar', demands: 55, settlements: 14 },
      ],
      series: [
        { dataKey: 'demands',     color: BLUE,  name: 'Demands Sent' },
        { dataKey: 'settlements', color: GREEN, name: 'Settlements' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Pre-Lit Case Overview',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',            label: 'Case ID',        sortable: true  },
      { key: 'title',         label: 'Client',         sortable: true  },
      { key: 'caseType',      label: 'Type',           sortable: true  },
      { key: 'subStageLabel', label: 'Sub-Stage',      sortable: true  },
      { key: 'attorney',      label: 'Attorney',       sortable: true  },
      { key: 'caseAge',       label: 'Case Age (d)',   sortable: true  },
      { key: 'expectedValue', label: 'Exp. Value',     sortable: true  },
      { key: 'nextAction',    label: 'Next Action',    sortable: false },
      { key: 'nextActionDue', label: 'Due',            sortable: true  },
      { key: 'status',        label: 'Status',         sortable: true  },
    ],
    getData: (cases) => {
      const labels: Record<string, string> = {
        'pre-account-opening':      'Account Opening',
        'pre-treatment-monitoring': 'Treatment',
        'pre-value-development':    'Value Dev',
        'pre-demand-readiness':     'Demand Ready',
        'pre-negotiation':          'Negotiation',
        'pre-resolution-pending':   'Resolution',
      };
      return cases.map((c) => ({
        id:            c.id,
        title:         c.title,
        caseType:      c.caseType,
        subStageLabel: labels[c.subStage ?? ''] ?? '—',
        attorney:      c.attorney,
        caseAge:       daysSince(c.openDate),
        expectedValue: fmt$(c.expectedValue),
        nextAction:    c.nextAction,
        nextActionDue: c.nextActionDue,
        status:        c.status,
      }));
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────
// PAGE 2 · Treatment Monitoring
// ─────────────────────────────────────────────────────────────────────────
const treatmentPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'treatment-monitoring',
  title: 'Treatment Monitoring',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) =>
    cases.filter((c) => c.parentStage === 'pre-lit' && c.subStage === 'pre-treatment-monitoring'),

  statCards: [
    {
      label: 'Active Treatment',
      compute: (cases) => cases.length,
      computeDelta: (cases) => ({
        value: `${cases.length} in monitoring`,
        type: 'neutral',
      }),
      sparkline: (cases) => {
        const b = Math.round(cases.length * 0.88);
        return [b, b + 4, b + 2, b + 7, b + 5, cases.length];
      },
    },
    {
      label: 'No Activity 30d+',
      compute: (cases) =>
        cases.filter((c) => daysSince(c.lastActivityDate) >= 30).length,
      computeDelta: (cases) => {
        const stale = cases.filter((c) => daysSince(c.lastActivityDate) >= 30).length;
        return {
          value: fmtPct((stale / Math.max(cases.length, 1)) * 100) + ' of treatment',
          type: stale > 0 ? 'negative' : 'positive',
        };
      },
    },
    {
      label: 'Avg Duration (days)',
      compute: (cases) => {
        if (!cases.length) return 0;
        return Math.round(
          cases.reduce((sum, c) => sum + daysSince(c.stageEntryDate), 0) / cases.length,
        );
      },
      computeDelta: (_cases) => ({ value: 'Target: 90d', type: 'neutral' }),
    },
    {
      label: 'Approaching Max Medical',
      compute: (cases) =>
        cases.filter((c) => daysSince(c.stageEntryDate) >= 75).length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => daysSince(c.stageEntryDate) >= 75).length;
        return { value: n > 5 ? 'Review needed' : 'Under control', type: n > 5 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Avg Specials (Medical)',
      compute: (cases) => {
        if (!cases.length) return fmt$(0);
        const avg =
          cases.reduce((sum, c) => sum + c.hardCostsRemaining, 0) / cases.length;
        return fmt$(avg);
      },
      computeDelta: (_cases) => ({ value: '+8% vs prior quarter', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Cases by Treatment Type',
      subtitle: 'Breakdown by case type currently in treatment',
      type: 'horizontal-bar',
      getData: (cases) => {
        const counts: Record<string, number> = {};
        for (const c of cases) {
          counts[c.caseType] = (counts[c.caseType] ?? 0) + 1;
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([type, count]) => ({ type, count }));
      },
      series: [{ dataKey: 'count', color: TEAL, name: 'Cases' }],
      xAxisKey: 'type',
    },
    {
      title: 'Treatment Duration Breakdown',
      subtitle: 'Distribution by weeks in treatment',
      type: 'bar',
      getData: (cases) => {
        const buckets: Record<string, number> = {
          '0-4 wks': 0, '4-8 wks': 0, '8-12 wks': 0, '12-16 wks': 0, '16+ wks': 0,
        };
        for (const c of cases) {
          const weeks = Math.floor(daysSince(c.stageEntryDate) / 7);
          if      (weeks < 4)  buckets['0-4 wks']++;
          else if (weeks < 8)  buckets['4-8 wks']++;
          else if (weeks < 12) buckets['8-12 wks']++;
          else if (weeks < 16) buckets['12-16 wks']++;
          else                 buckets['16+ wks']++;
        }
        return Object.entries(buckets).map(([range, count]) => ({ range, count }));
      },
      series: [{ dataKey: 'count', color: GREEN, name: 'Cases' }],
      xAxisKey: 'range',
    },
  ],

  table: {
    title: 'Treatment Monitoring Cases',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',              label: 'Case ID',          sortable: true  },
      { key: 'title',           label: 'Client',           sortable: true  },
      { key: 'caseType',        label: 'Type',             sortable: true  },
      { key: 'attorney',        label: 'Attorney',         sortable: true  },
      { key: 'durationDays',    label: 'Duration (d)',     sortable: true  },
      { key: 'lastActivity',    label: 'Last Activity',    sortable: true  },
      { key: 'hardCosts',       label: 'Specials ($)',     sortable: true  },
      { key: 'nextAction',      label: 'Next Action',      sortable: false },
      { key: 'nextActionDue',   label: 'Due',              sortable: true  },
      { key: 'riskCount',       label: 'Risk Flags',       sortable: true  },
    ],
    getData: (cases) =>
      cases.map((c) => ({
        id:            c.id,
        title:         c.title,
        caseType:      c.caseType,
        attorney:      c.attorney,
        durationDays:  daysSince(c.stageEntryDate),
        lastActivity:  c.lastActivityDate,
        hardCosts:     fmt$(c.hardCostsRemaining),
        nextAction:    c.nextAction,
        nextActionDue: c.nextActionDue,
        riskCount:     c.riskFlags.length,
      })),
  },
};

// ─────────────────────────────────────────────────────────────────────────
// PAGE 3 · Value Development
// ─────────────────────────────────────────────────────────────────────────
const valueDevelopmentPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'value-development',
  title: 'Value Development',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) =>
    cases.filter((c) => c.parentStage === 'pre-lit' && c.subStage === 'pre-value-development'),

  statCards: [
    {
      label: 'Avg Case Value',
      compute: (cases) => {
        if (!cases.length) return fmt$(0);
        return fmt$(cases.reduce((s, c) => s + c.expectedValue, 0) / cases.length);
      },
      computeDelta: (_cases) => ({ value: '+12% vs Q4', type: 'positive' }),
      sparkline: (_cases) => [28000, 29500, 31000, 30200, 33000, 34500],
    },
    {
      label: 'Under $10K',
      compute: (cases) => cases.filter((c) => c.expectedValue < 10_000).length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => c.expectedValue < 10_000).length;
        return {
          value: fmtPct((n / Math.max(cases.length, 1)) * 100) + ' of portfolio',
          type: n / Math.max(cases.length, 1) > 0.3 ? 'negative' : 'neutral',
        };
      },
    },
    {
      label: '$10K – $50K',
      compute: (cases) =>
        cases.filter((c) => c.expectedValue >= 10_000 && c.expectedValue < 50_000).length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => c.expectedValue >= 10_000 && c.expectedValue < 50_000).length;
        return { value: fmtPct((n / Math.max(cases.length, 1)) * 100) + ' of portfolio', type: 'neutral' };
      },
    },
    {
      label: '$50K+',
      compute: (cases) => cases.filter((c) => c.expectedValue >= 50_000).length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => c.expectedValue >= 50_000).length;
        return { value: fmtPct((n / Math.max(cases.length, 1)) * 100) + ' of portfolio', type: 'positive' };
      },
    },
    {
      label: 'Avg EV Confidence',
      compute: (cases) => {
        if (!cases.length) return '0%';
        const avg = cases.reduce((s, c) => s + c.evConfidence, 0) / cases.length;
        return fmtPct(avg * 100);
      },
      computeDelta: (cases) => {
        if (!cases.length) return { value: '—', type: 'neutral' };
        const avg = cases.reduce((s, c) => s + c.evConfidence, 0) / cases.length;
        return { value: avg >= 0.7 ? 'Good confidence' : 'Needs review', type: avg >= 0.7 ? 'positive' : 'negative' };
      },
    },
  ],

  charts: [
    {
      title: 'Value Distribution',
      subtitle: 'Cases bucketed by expected value',
      type: 'bar',
      getData: (cases) => {
        const buckets: Record<string, number> = {
          '<$10K': 0, '$10K-$25K': 0, '$25K-$50K': 0, '$50K-$100K': 0, '$100K+': 0,
        };
        for (const c of cases) {
          const v = c.expectedValue;
          if      (v < 10_000)  buckets['<$10K']++;
          else if (v < 25_000)  buckets['$10K-$25K']++;
          else if (v < 50_000)  buckets['$25K-$50K']++;
          else if (v < 100_000) buckets['$50K-$100K']++;
          else                  buckets['$100K+']++;
        }
        return Object.entries(buckets).map(([range, count]) => ({ range, count }));
      },
      series: [{ dataKey: 'count', color: INDIGO, name: 'Cases' }],
      xAxisKey: 'range',
    },
    {
      title: 'Avg Expected Value by Case Type',
      subtitle: 'Top case types in value development',
      type: 'bar',
      getData: (cases) => {
        const sums: Record<string, { total: number; count: number }> = {};
        for (const c of cases) {
          if (!sums[c.caseType]) sums[c.caseType] = { total: 0, count: 0 };
          sums[c.caseType].total += c.expectedValue;
          sums[c.caseType].count++;
        }
        return Object.entries(sums)
          .map(([type, { total, count }]) => ({ type, avgValue: Math.round(total / count) }))
          .sort((a, b) => b.avgValue - a.avgValue)
          .slice(0, 7);
      },
      series: [{ dataKey: 'avgValue', color: PURPLE, name: 'Avg Value ($)' }],
      xAxisKey: 'type',
    },
  ],

  table: {
    title: 'Cases in Value Development',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',            label: 'Case ID',        sortable: true  },
      { key: 'title',         label: 'Client',         sortable: true  },
      { key: 'caseType',      label: 'Type',           sortable: true  },
      { key: 'attorney',      label: 'Attorney',       sortable: true  },
      { key: 'exposure',      label: 'Exposure',       sortable: true  },
      { key: 'expectedValue', label: 'Exp. Value',     sortable: true  },
      { key: 'evConfidence',  label: 'EV Conf.',       sortable: true  },
      { key: 'caseAge',       label: 'Case Age (d)',   sortable: true  },
      { key: 'riskFlags',     label: 'Risks',          sortable: false },
      { key: 'nextAction',    label: 'Next Action',    sortable: false },
    ],
    getData: (cases) =>
      cases.map((c) => ({
        id:            c.id,
        title:         c.title,
        caseType:      c.caseType,
        attorney:      c.attorney,
        exposure:      fmt$(c.exposureAmount),
        expectedValue: fmt$(c.expectedValue),
        evConfidence:  fmtPct(c.evConfidence * 100),
        caseAge:       daysSince(c.openDate),
        riskFlags:     c.riskFlags.join(', ') || '—',
        nextAction:    c.nextAction,
      })),
  },
};

// ─────────────────────────────────────────────────────────────────────────
// PAGE 4 · Demand Readiness
// ─────────────────────────────────────────────────────────────────────────
const demandReadinessPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'demand-readiness',
  title: 'Demand Readiness',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) =>
    cases.filter((c) => c.parentStage === 'pre-lit' && c.subStage === 'pre-demand-readiness'),

  statCards: [
    {
      label: 'Ready for Demand',
      compute: (cases) => {
        return cases.filter((c) => {
          const total = c.gateChecklist.length;
          if (total === 0) return false;
          const done = c.gateChecklist.filter((g) => g.completed).length;
          return done / total >= 0.9;
        }).length;
      },
      computeDelta: (cases) => {
        const ready = cases.filter((c) => {
          const total = c.gateChecklist.length;
          if (total === 0) return false;
          return c.gateChecklist.filter((g) => g.completed).length / total >= 0.9;
        }).length;
        return { value: fmtPct((ready / Math.max(cases.length, 1)) * 100) + ' ready', type: 'positive' };
      },
      sparkline: (_cases) => [8, 10, 12, 9, 14, 16],
    },
    {
      label: 'In Draft / Incomplete',
      compute: (cases) => {
        return cases.filter((c) => {
          const total = c.gateChecklist.length;
          if (total === 0) return true;
          return c.gateChecklist.filter((g) => g.completed).length / total < 0.9;
        }).length;
      },
      computeDelta: (cases) => {
        const n = cases.filter((c) => {
          const total = c.gateChecklist.length;
          if (total === 0) return true;
          return c.gateChecklist.filter((g) => g.completed).length / total < 0.9;
        }).length;
        return { value: n > 10 ? 'Backlog building' : 'Manageable', type: n > 10 ? 'negative' : 'neutral' };
      },
    },
    {
      label: 'Avg Days to Demand',
      compute: (cases) => {
        if (!cases.length) return 0;
        return Math.round(
          cases.reduce((s, c) => s + daysSince(c.stageEntryDate), 0) / cases.length,
        );
      },
      computeDelta: (_cases) => ({ value: 'Target: ≤30d', type: 'neutral' }),
    },
    {
      label: 'Overdue Demands',
      compute: (cases) =>
        cases.filter(
          (c) => c.nextActionDue && daysSince(c.nextActionDue) > 0,
        ).length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => c.nextActionDue && daysSince(c.nextActionDue) > 0).length;
        return { value: n > 5 ? 'Action required' : 'On track', type: n > 5 ? 'negative' : 'positive' };
      },
    },
  ],

  charts: [
    {
      title: 'Gate Checklist Completion',
      subtitle: 'By checklist item across demand-ready cases',
      type: 'stacked-bar',
      getData: (cases) => {
        // Aggregate checklist item completion across all cases
        const itemTotals: Record<string, { done: number; pending: number }> = {};
        for (const c of cases) {
          for (const g of c.gateChecklist) {
            if (!itemTotals[g.name]) itemTotals[g.name] = { done: 0, pending: 0 };
            if (g.completed) itemTotals[g.name].done++;
            else             itemTotals[g.name].pending++;
          }
        }
        return Object.entries(itemTotals)
          .slice(0, 8)
          .map(([name, { done, pending }]) => ({ item: name, done, pending }));
      },
      series: [
        { dataKey: 'done',    color: GREEN, name: 'Complete' },
        { dataKey: 'pending', color: AMBER, name: 'Pending'  },
      ],
      xAxisKey: 'item',
    },
    {
      title: 'Demand Backlog by Paralegal / Owner',
      subtitle: 'Cases in demand readiness by next action owner',
      type: 'bar',
      getData: (cases) => {
        const counts: Record<string, number> = {};
        for (const c of cases) {
          const owner = c.nextActionOwner || 'Unassigned';
          counts[owner] = (counts[owner] ?? 0) + 1;
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([owner, count]) => ({ owner, count }));
      },
      series: [{ dataKey: 'count', color: BLUE, name: 'Cases' }],
      xAxisKey: 'owner',
    },
  ],

  table: {
    title: 'Demand Pipeline',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',            label: 'Case ID',       sortable: true  },
      { key: 'title',         label: 'Client',        sortable: true  },
      { key: 'caseType',      label: 'Type',          sortable: true  },
      { key: 'attorney',      label: 'Attorney',      sortable: true  },
      { key: 'gateComplete',  label: 'Gate %',        sortable: true  },
      { key: 'daysInStage',   label: 'Days in Stage', sortable: true  },
      { key: 'nextAction',    label: 'Next Action',   sortable: false },
      { key: 'nextActionDue', label: 'Due',           sortable: true  },
      { key: 'owner',         label: 'Owner',         sortable: true  },
      { key: 'expectedValue', label: 'Exp. Value',    sortable: true  },
    ],
    getData: (cases) =>
      cases.map((c) => {
        const total = c.gateChecklist.length;
        const done  = c.gateChecklist.filter((g) => g.completed).length;
        return {
          id:            c.id,
          title:         c.title,
          caseType:      c.caseType,
          attorney:      c.attorney,
          gateComplete:  total ? fmtPct((done / total) * 100) : '—',
          daysInStage:   daysSince(c.stageEntryDate),
          nextAction:    c.nextAction,
          nextActionDue: c.nextActionDue,
          owner:         c.nextActionOwner || 'Unassigned',
          expectedValue: fmt$(c.expectedValue),
        };
      }),
  },
};

// ─────────────────────────────────────────────────────────────────────────
// PAGE 5 · Negotiation
// ─────────────────────────────────────────────────────────────────────────
const negotiationPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'negotiation',
  title: 'Negotiation',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) =>
    cases.filter((c) => c.parentStage === 'pre-lit' && c.subStage === 'pre-negotiation'),

  statCards: [
    {
      label: 'Active Negotiations',
      compute: (cases) => cases.length,
      computeDelta: (cases) => ({
        value: `${cases.length} open files`,
        type: 'neutral',
      }),
      sparkline: (cases) => {
        const b = Math.max(cases.length - 8, 1);
        return [b, b + 2, b + 1, b + 4, b + 3, cases.length];
      },
    },
    {
      label: 'Offers Received',
      compute: (cases) =>
        cases.filter((c) => c.riskFlags.includes('offer-received') || c.status === 'offer-received').length,
      computeDelta: (_cases) => ({ value: '+6 this week', type: 'positive' }),
    },
    {
      label: 'Avg Offer vs Demand',
      compute: (_cases) => '62%',
      computeDelta: (_cases) => ({ value: 'Target: ≥70%', type: 'negative' }),
      sparkline: (_cases) => [55, 58, 60, 57, 63, 62],
    },
    {
      label: 'Settled MTD',
      compute: (_cases) => 14,
      computeDelta: (_cases) => ({ value: '+2 vs last month', type: 'positive' }),
      sparkline: (_cases) => [8, 10, 7, 12, 11, 14],
    },
    {
      label: 'Sent to Lit',
      compute: (_cases) => 3,
      computeDelta: (_cases) => ({ value: 'Escalations MTD', type: 'negative' }),
    },
  ],

  charts: [
    {
      title: 'Monthly Settlements Closed',
      subtitle: 'Pre-lit settlements over rolling 6 months',
      type: 'line',
      getData: (_cases) => [
        { month: 'Oct', settled: 8,  avgAmount: 28500 },
        { month: 'Nov', settled: 10, avgAmount: 31200 },
        { month: 'Dec', settled: 7,  avgAmount: 27000 },
        { month: 'Jan', settled: 12, avgAmount: 33400 },
        { month: 'Feb', settled: 11, avgAmount: 30800 },
        { month: 'Mar', settled: 14, avgAmount: 35100 },
      ],
      series: [
        { dataKey: 'settled',   color: GREEN, name: 'Cases Settled' },
        { dataKey: 'avgAmount', color: BLUE,  name: 'Avg Settlement ($)' },
      ],
      xAxisKey: 'month',
    },
    {
      title: 'Settlements by Insurance Carrier',
      subtitle: 'MTD resolution by carrier',
      type: 'bar',
      getData: (_cases) => [
        { carrier: 'State Farm',  count: 4, avgSettlement: 32000 },
        { carrier: 'GEICO',       count: 3, avgSettlement: 27500 },
        { carrier: 'Allstate',    count: 2, avgSettlement: 41000 },
        { carrier: 'Progressive', count: 2, avgSettlement: 29000 },
        { carrier: 'USAA',        count: 1, avgSettlement: 55000 },
        { carrier: 'Farmers',     count: 1, avgSettlement: 23500 },
        { carrier: 'Other',       count: 1, avgSettlement: 18000 },
      ],
      series: [
        { dataKey: 'count',         color: GREEN, name: 'Settlements'      },
        { dataKey: 'avgSettlement', color: SLATE, name: 'Avg Settlement ($)' },
      ],
      xAxisKey: 'carrier',
    },
  ],

  table: {
    title: 'Active Negotiations',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',            label: 'Case ID',        sortable: true  },
      { key: 'title',         label: 'Client',         sortable: true  },
      { key: 'caseType',      label: 'Type',           sortable: true  },
      { key: 'attorney',      label: 'Attorney',       sortable: true  },
      { key: 'exposure',      label: 'Exposure',       sortable: true  },
      { key: 'expectedValue', label: 'Exp. Value',     sortable: true  },
      { key: 'daysInStage',   label: 'Days in Neg.',   sortable: true  },
      { key: 'riskFlags',     label: 'Risk Flags',     sortable: false },
      { key: 'nextAction',    label: 'Next Action',    sortable: false },
      { key: 'nextActionDue', label: 'Due',            sortable: true  },
    ],
    getData: (cases) =>
      cases.map((c) => ({
        id:            c.id,
        title:         c.title,
        caseType:      c.caseType,
        attorney:      c.attorney,
        exposure:      fmt$(c.exposureAmount),
        expectedValue: fmt$(c.expectedValue),
        daysInStage:   daysSince(c.stageEntryDate),
        riskFlags:     c.riskFlags.join(', ') || '—',
        nextAction:    c.nextAction,
        nextActionDue: c.nextActionDue,
      })),
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────
export const preLitPages: DeptPageConfig[] = [
  dashboardPage,
  treatmentPage,
  valueDevelopmentPage,
  demandReadinessPage,
  negotiationPage,
];
