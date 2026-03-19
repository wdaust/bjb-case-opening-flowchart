// ── Med Records Department Page Configs ──────────────────────────────────
// Cross-cuts all cases — medical records are needed at every stage.
// Synthetic data is derived deterministically from cases.length to keep
// numbers consistent across renders without a real records data source.

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const PROVIDER_NAMES = [
  'HCA Florida',
  'AdventHealth',
  'BayCare Health',
  'Tampa General',
  'Moffitt Cancer Ctr',
  'St. Joseph\'s Hospital',
  'Morton Plant',
  'Sarasota Memorial',
  'NCH Healthcare',
  'Lee Health',
];

const PROVIDER_TYPES = [
  'Hospital',
  'Urgent Care',
  'Primary Care',
  'Specialist',
  'Imaging Center',
  'Physical Therapy',
  'Chiropractic',
  'Pain Management',
];

const REQUEST_METHODS = ['Portal', 'Fax', 'Mail', 'In-Person'];

const STATUS_OPTIONS = [
  'Received',
  'Pending',
  'Overdue',
  'Awaiting Auth',
  'In Review',
];

// Seeded pseudo-random for deterministic data based on index
function seeded(index: number, mod: number, offset = 0): number {
  return ((index * 7919 + offset * 1009) % mod) + 1;
}

// ---------------------------------------------------------------------------
// Page 1 — Dashboard
// ---------------------------------------------------------------------------
const dashboardPage: DeptPageConfig = {
  deptId: 'med-records',
  pageId: 'dashboard',
  title: 'Med Records — Dashboard',
  deptLabel: 'Med Records',
  accentColor: '#0ea5e9',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Outstanding Requests',
      compute: (cases) => Math.round(cases.length * 0.28),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.03);
        return { value: `+${val} vs last month`, type: 'negative' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.25);
        return [base - 40, base - 20, base + 10, base - 5, base + 30, base + 20, Math.round(cases.length * 0.28)];
      },
    },
    {
      label: 'Received MTD',
      compute: (cases) => Math.round(cases.length * 0.12),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.015);
        return { value: `+${val} vs last month`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.1);
        return [base, base + 20, base + 35, base + 50, base + 60, base + 70, Math.round(cases.length * 0.12)];
      },
    },
    {
      label: 'Avg Turnaround (days)',
      compute: (cases) => {
        const base = 18 + Math.round((cases.length % 100) / 20);
        return base;
      },
      computeDelta: (cases) => {
        const base = 18 + Math.round((cases.length % 100) / 20);
        const prev = base + 2;
        return { value: `-${prev - base}d vs last month`, type: 'positive' };
      },
      sparkline: () => [24, 23, 21, 20, 19, 19, 18],
    },
    {
      label: 'Overdue',
      compute: (cases) => Math.round(cases.length * 0.07),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.01);
        return { value: `-${val} vs last month`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.09);
        return [base, base - 5, base - 8, base - 6, base - 10, base - 12, Math.round(cases.length * 0.07)];
      },
    },
    {
      label: 'Completion Rate',
      compute: (cases) => {
        const pct = 72 + Math.round((cases.length % 50) / 10);
        return `${pct}%`;
      },
      computeDelta: () => ({ value: '+3% vs last month', type: 'positive' }),
      sparkline: () => [66, 68, 69, 70, 71, 72, 74],
    },
  ],

  charts: [
    {
      title: 'Records Received per Week',
      subtitle: 'Last 8 weeks',
      type: 'line',
      getData: (cases) => {
        const weekly = Math.round(cases.length * 0.015);
        return Array.from({ length: 8 }, (_, i) => ({
          week: `Wk ${i + 1}`,
          received: weekly + seeded(i, 30, 1) - 15,
          requested: weekly + seeded(i, 25, 2) + 5,
        }));
      },
      series: [
        { dataKey: 'received', color: '#0ea5e9', name: 'Received' },
        { dataKey: 'requested', color: '#f59e0b', name: 'Requested' },
      ],
      xAxisKey: 'week',
    },
    {
      title: 'Request Status Breakdown',
      type: 'pie',
      getData: (cases) => {
        const total = cases.length;
        return [
          { name: 'Received',      value: Math.round(total * 0.38) },
          { name: 'Pending',       value: Math.round(total * 0.28) },
          { name: 'Overdue',       value: Math.round(total * 0.07) },
          { name: 'Awaiting Auth', value: Math.round(total * 0.15) },
          { name: 'In Review',     value: Math.round(total * 0.12) },
        ];
      },
      series: [
        { dataKey: 'value', color: '#0ea5e9', name: 'Received' },
        { dataKey: 'value', color: '#f59e0b', name: 'Pending' },
        { dataKey: 'value', color: '#ef4444', name: 'Overdue' },
        { dataKey: 'value', color: '#8b5cf6', name: 'Awaiting Auth' },
        { dataKey: 'value', color: '#22c55e', name: 'In Review' },
      ],
    },
  ],

  table: {
    title: 'Recent Records Activity',
    keyField: 'id',
    maxRows: 20,
    columns: [
      { key: 'caseId',      label: 'Case ID',      sortable: true },
      { key: 'caseTitle',   label: 'Case',         sortable: true },
      { key: 'provider',    label: 'Provider',     sortable: true },
      { key: 'status',      label: 'Status',       sortable: true },
      { key: 'requested',   label: 'Requested',    sortable: true },
      { key: 'received',    label: 'Received',     sortable: true },
      { key: 'turnaround',  label: 'Turnaround',   sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 20).map((c, i) => ({
        id: `mr-${c.id}-${i}`,
        caseId: c.id,
        caseTitle: c.title,
        provider: PROVIDER_NAMES[i % PROVIDER_NAMES.length],
        status: STATUS_OPTIONS[seeded(i, STATUS_OPTIONS.length, 3) - 1],
        requested: `2026-0${(seeded(i, 3, 4))}-${String(seeded(i, 28, 5)).padStart(2, '0')}`,
        received:
          seeded(i, STATUS_OPTIONS.length, 3) === 1
            ? `2026-0${(seeded(i, 3, 4))}-${String(seeded(i, 28, 5) + 14).padStart(2, '0')}`
            : '—',
        turnaround:
          seeded(i, STATUS_OPTIONS.length, 3) === 1
            ? `${seeded(i, 20, 6) + 5}d`
            : '—',
      })),
  },
};

// ---------------------------------------------------------------------------
// Page 2 — Records Requests
// ---------------------------------------------------------------------------
const recordsRequestsPage: DeptPageConfig = {
  deptId: 'med-records',
  pageId: 'records-requests',
  title: 'Med Records — Records Requests',
  deptLabel: 'Med Records',
  accentColor: '#0ea5e9',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'New Requests MTD',
      compute: (cases) => Math.round(cases.length * 0.09),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.008);
        return { value: `+${val} vs last month`, type: 'positive' };
      },
    },
    {
      label: 'Hospital Requests %',
      compute: (cases) => {
        const pct = 38 + Math.round((cases.length % 30) / 10);
        return `${pct}%`;
      },
      computeDelta: () => ({ value: '+2% vs last month', type: 'neutral' }),
    },
    {
      label: 'Via Portal %',
      compute: (cases) => {
        const pct = 44 + Math.round((cases.length % 20) / 5);
        return `${pct}%`;
      },
      computeDelta: () => ({ value: '+5% vs last month', type: 'positive' }),
    },
    {
      label: 'Avg Cost per Request',
      compute: (cases) => {
        const base = 42 + Math.round((cases.length % 40) / 8);
        return `$${base}`;
      },
      computeDelta: () => ({ value: '-$3 vs last month', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Requests by Provider Type',
      subtitle: 'Current month',
      type: 'bar',
      getData: (cases) =>
        PROVIDER_TYPES.map((type, i) => ({
          type,
          requests: Math.round(cases.length * 0.015) + seeded(i, 40, 7) - 20,
        })),
      series: [{ dataKey: 'requests', color: '#0ea5e9', name: 'Requests' }],
      xAxisKey: 'type',
    },
    {
      title: 'Request Method',
      type: 'pie',
      getData: (cases) => {
        const total = Math.round(cases.length * 0.09);
        return [
          { name: 'Portal',     value: Math.round(total * 0.46) },
          { name: 'Fax',        value: Math.round(total * 0.31) },
          { name: 'Mail',       value: Math.round(total * 0.14) },
          { name: 'In-Person',  value: Math.round(total * 0.09) },
        ];
      },
      series: [
        { dataKey: 'value', color: '#0ea5e9',  name: 'Portal' },
        { dataKey: 'value', color: '#22c55e',  name: 'Fax' },
        { dataKey: 'value', color: '#f59e0b',  name: 'Mail' },
        { dataKey: 'value', color: '#8b5cf6',  name: 'In-Person' },
      ],
    },
  ],

  table: {
    title: 'Request Log',
    keyField: 'requestId',
    maxRows: 25,
    columns: [
      { key: 'requestId',    label: 'Req #',         sortable: true },
      { key: 'caseTitle',    label: 'Case',          sortable: true },
      { key: 'provider',     label: 'Provider',      sortable: true },
      { key: 'providerType', label: 'Provider Type', sortable: true },
      { key: 'method',       label: 'Method',        sortable: true },
      { key: 'requestDate',  label: 'Requested',     sortable: true },
      { key: 'cost',         label: 'Est. Cost',     sortable: true },
      { key: 'status',       label: 'Status',        sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 25).map((c, i) => ({
        requestId: `RR-${2026}${String(i + 1).padStart(4, '0')}`,
        caseTitle: c.title,
        provider: PROVIDER_NAMES[i % PROVIDER_NAMES.length],
        providerType: PROVIDER_TYPES[seeded(i, PROVIDER_TYPES.length, 8) - 1],
        method: REQUEST_METHODS[seeded(i, REQUEST_METHODS.length, 9) - 1],
        requestDate: `2026-0${seeded(i, 3, 10)}-${String(seeded(i, 28, 11)).padStart(2, '0')}`,
        cost: `$${35 + seeded(i, 60, 12)}`,
        status: STATUS_OPTIONS[seeded(i, STATUS_OPTIONS.length, 13) - 1],
      })),
  },
};

// ---------------------------------------------------------------------------
// Page 3 — Pending Records
// ---------------------------------------------------------------------------
const pendingRecordsPage: DeptPageConfig = {
  deptId: 'med-records',
  pageId: 'pending-records',
  title: 'Med Records — Pending Records',
  deptLabel: 'Med Records',
  accentColor: '#0ea5e9',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Total Pending',
      compute: (cases) => Math.round(cases.length * 0.28),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.02);
        return { value: `-${val} vs last week`, type: 'positive' };
      },
    },
    {
      label: '0 – 15 Days',
      compute: (cases) => Math.round(cases.length * 0.11),
      computeDelta: () => ({ value: 'On track', type: 'neutral' }),
    },
    {
      label: '16 – 30 Days',
      compute: (cases) => Math.round(cases.length * 0.09),
      computeDelta: () => ({ value: 'Monitor', type: 'neutral' }),
    },
    {
      label: '31 – 45 Days',
      compute: (cases) => Math.round(cases.length * 0.05),
      computeDelta: () => ({ value: 'Follow up needed', type: 'negative' }),
    },
    {
      label: '45+ Days',
      compute: (cases) => Math.round(cases.length * 0.03),
      computeDelta: () => ({ value: 'Escalate', type: 'negative' }),
    },
  ],

  charts: [
    {
      title: 'Pending Aging Buckets',
      subtitle: 'Number of open requests by age',
      type: 'horizontal-bar',
      getData: (cases) => [
        { bucket: '0–15d',  count: Math.round(cases.length * 0.11) },
        { bucket: '16–30d', count: Math.round(cases.length * 0.09) },
        { bucket: '31–45d', count: Math.round(cases.length * 0.05) },
        { bucket: '45+d',   count: Math.round(cases.length * 0.03) },
      ],
      series: [{ dataKey: 'count', color: '#0ea5e9', name: 'Requests' }],
      xAxisKey: 'bucket',
    },
    {
      title: 'Slowest Providers (Avg Days)',
      subtitle: 'Average turnaround for still-pending requests',
      type: 'bar',
      getData: (_cases) =>
        PROVIDER_NAMES.slice(0, 8).map((name, i) => ({
          provider: name,
          avgDays: 15 + seeded(i, 35, 14),
          target: 21,
        })),
      series: [
        { dataKey: 'avgDays', color: '#f59e0b', name: 'Avg Days Pending' },
        { dataKey: 'target',  color: '#0ea5e9', name: 'Target (21d)' },
      ],
      xAxisKey: 'provider',
    },
  ],

  table: {
    title: 'Pending Records List',
    keyField: 'requestId',
    maxRows: 30,
    columns: [
      { key: 'requestId',   label: 'Req #',       sortable: true },
      { key: 'caseTitle',   label: 'Case',         sortable: true },
      { key: 'attorney',    label: 'Attorney',     sortable: true },
      { key: 'provider',    label: 'Provider',     sortable: true },
      { key: 'requestDate', label: 'Requested',    sortable: true },
      { key: 'ageDays',     label: 'Age (Days)',   sortable: true },
      { key: 'ageBucket',   label: 'Bucket',       sortable: true },
      { key: 'followUps',   label: 'Follow-Ups',   sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 30).map((c, i) => {
        const ageDays = seeded(i, 55, 15) + 1;
        let ageBucket: string;
        if (ageDays <= 15)       ageBucket = '0–15d';
        else if (ageDays <= 30)  ageBucket = '16–30d';
        else if (ageDays <= 45)  ageBucket = '31–45d';
        else                     ageBucket = '45+d';
        return {
          requestId: `PR-${2026}${String(i + 1).padStart(4, '0')}`,
          caseTitle: c.title,
          attorney: c.attorney,
          provider: PROVIDER_NAMES[i % PROVIDER_NAMES.length],
          requestDate: `2026-0${seeded(i, 3, 16)}-${String(seeded(i, 28, 17)).padStart(2, '0')}`,
          ageDays,
          ageBucket,
          followUps: seeded(i, 4, 18) - 1,
        };
      }),
  },
};

// ---------------------------------------------------------------------------
// Page 4 — Completion Rate
// ---------------------------------------------------------------------------
const completionRatePage: DeptPageConfig = {
  deptId: 'med-records',
  pageId: 'completion-rate',
  title: 'Med Records — Completion Rate',
  deptLabel: 'Med Records',
  accentColor: '#0ea5e9',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Overall Completion %',
      compute: (cases) => {
        const pct = 72 + Math.round((cases.length % 50) / 10);
        return `${pct}%`;
      },
      computeDelta: () => ({ value: '+3% vs last month', type: 'positive' }),
      sparkline: () => [66, 67, 69, 70, 71, 72, 74],
    },
    {
      label: 'Cases 100% Complete',
      compute: (cases) => Math.round(cases.length * 0.42),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.03);
        return { value: `+${val} vs last month`, type: 'positive' };
      },
    },
    {
      label: 'Missing Critical Records',
      compute: (cases) => Math.round(cases.length * 0.11),
      computeDelta: (cases) => {
        const val = Math.round(cases.length * 0.008);
        return { value: `-${val} vs last month`, type: 'positive' };
      },
    },
    {
      label: 'Avg Records / Case',
      compute: (cases) => {
        const base = 3.4 + (cases.length % 10) / 10;
        return base.toFixed(1);
      },
      computeDelta: () => ({ value: '+0.2 vs last month', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Completion Rate by Case Age',
      subtitle: 'Cases grouped by months since open date',
      type: 'bar',
      getData: (cases) => {
        const buckets = [
          { label: '< 3 mo',   completePct: 45, incompletePct: 55 },
          { label: '3–6 mo',   completePct: 62, incompletePct: 38 },
          { label: '6–12 mo',  completePct: 74, incompletePct: 26 },
          { label: '12–24 mo', completePct: 83, incompletePct: 17 },
          { label: '24+ mo',   completePct: 91, incompletePct: 9  },
        ];
        // Scale by case count so the y-axis feels real
        const scale = Math.round(cases.length / 50);
        return buckets.map((b) => ({
          ageGroup:    b.label,
          complete:    Math.round(b.completePct * scale),
          incomplete:  Math.round(b.incompletePct * scale),
        }));
      },
      series: [
        { dataKey: 'complete',   color: '#22c55e', name: 'Complete' },
        { dataKey: 'incomplete', color: '#f59e0b', name: 'Incomplete' },
      ],
      xAxisKey: 'ageGroup',
    },
    {
      title: 'Completion % by Attorney',
      subtitle: 'Records fully received vs outstanding per attorney',
      type: 'horizontal-bar',
      getData: (cases) => {
        const attorneys = [...new Set(cases.map((c) => c.attorney))].slice(0, 10);
        return attorneys.map((atty, i) => ({
          attorney: atty,
          completionPct: 55 + seeded(i, 40, 19),
        }));
      },
      series: [{ dataKey: 'completionPct', color: '#0ea5e9', name: 'Completion %' }],
      xAxisKey: 'attorney',
    },
  ],

  table: {
    title: 'Completion by Case',
    keyField: 'caseId',
    maxRows: 25,
    columns: [
      { key: 'caseId',        label: 'Case ID',          sortable: true },
      { key: 'caseTitle',     label: 'Case',             sortable: true },
      { key: 'attorney',      label: 'Attorney',         sortable: true },
      { key: 'stage',         label: 'Stage',            sortable: true },
      { key: 'totalRecords',  label: 'Total Recs',       sortable: true },
      { key: 'received',      label: 'Received',         sortable: true },
      { key: 'pending',       label: 'Pending',          sortable: true },
      { key: 'completionPct', label: 'Completion %',     sortable: true },
      { key: 'missingCrit',   label: 'Missing Critical', sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 25).map((c, i) => {
        const total    = seeded(i, 8, 20) + 1;
        const received = Math.min(total, seeded(i, total + 1, 21));
        const pending  = total - received;
        const pct      = Math.round((received / total) * 100);
        return {
          caseId:        c.id,
          caseTitle:     c.title,
          attorney:      c.attorney,
          stage:         c.parentStage,
          totalRecords:  total,
          received,
          pending,
          completionPct: `${pct}%`,
          missingCrit:   pct < 60 ? 'Yes' : 'No',
        };
      }),
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const medRecordsPages: DeptPageConfig[] = [
  dashboardPage,
  recordsRequestsPage,
  pendingRecordsPage,
  completionRatePage,
];
