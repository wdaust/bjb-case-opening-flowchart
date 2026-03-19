// ── Claims Department Page Configs ────────────────────────────────────────
// Claims cross-cuts all stages; filterCases returns all cases for each page.

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

const DEPT_ID = 'claims';
const DEPT_LABEL = 'Claims';
const ACCENT = '#f59e0b';

// ── Shared helpers ───────────────────────────────────────────────────────

const CARRIERS = [
  'State Farm',
  'Allstate',
  'Progressive',
  'GEICO',
  'Liberty Mutual',
  'Hartford',
  'Travelers',
  'Nationwide',
];

const CLAIM_TYPES = ['BI', 'UM/UIM', 'PIP', 'Premises'];

/** Deterministic bucket from case index so counts are stable across renders. */
function claimTypeSeed(c: LitCase): number {
  // Use the numeric portion of the id for a stable assignment
  const num = parseInt(c.id.replace(/\D+/g, ''), 10) || 0;
  return num;
}

function assignClaimType(c: LitCase): string {
  return CLAIM_TYPES[claimTypeSeed(c) % CLAIM_TYPES.length];
}

function assignCarrier(c: LitCase): string {
  return CARRIERS[claimTypeSeed(c) % CARRIERS.length];
}

/** Format a dollar value as compact currency. */
function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtMoneyExact(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

// Months used for filed/resolved and settlement trend charts
const MONTHS = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'];

// ── Page 1: Dashboard ────────────────────────────────────────────────────

const dashboardPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'dashboard',
  title: 'Claims Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Active Claims',
      compute: (cases) => cases.filter((c) => c.status === 'active').length,
      computeDelta: (cases) => {
        const active = cases.filter((c) => c.status === 'active').length;
        const prev = Math.round(active * 0.96);
        const pct = (((active - prev) / prev) * 100).toFixed(1);
        return { value: `+${pct}% vs last month`, type: 'neutral' };
      },
      sparkline: (cases) => {
        const base = cases.filter((c) => c.status === 'active').length;
        return [
          Math.round(base * 0.90),
          Math.round(base * 0.92),
          Math.round(base * 0.94),
          Math.round(base * 0.96),
          Math.round(base * 0.98),
          base,
        ];
      },
    },
    {
      label: 'UM/UIM Claims',
      compute: (cases) =>
        cases.filter(
          (c) => c.status === 'active' && assignClaimType(c) === 'UM/UIM',
        ).length,
      computeDelta: (cases) => {
        const n = cases.filter(
          (c) => c.status === 'active' && assignClaimType(c) === 'UM/UIM',
        ).length;
        return { value: `${n} of active`, type: 'neutral' };
      },
    },
    {
      label: 'Filed MTD',
      compute: (cases) => {
        // Synthetic: ~2% of active cases filed this month
        const active = cases.filter((c) => c.status === 'active').length;
        return Math.round(active * 0.022);
      },
      computeDelta: () => ({ value: '+8 vs last month', type: 'positive' }),
      sparkline: (_cases) => [98, 104, 110, 118, 122, 130],
    },
    {
      label: 'Denied MTD',
      compute: (cases) => {
        const active = cases.filter((c) => c.status === 'active').length;
        return Math.round(active * 0.004);
      },
      computeDelta: () => ({ value: '-3 vs last month', type: 'positive' }),
    },
    {
      label: 'Pipeline Value',
      compute: (cases) => {
        const total = cases
          .filter((c) => c.status === 'active')
          .reduce((sum, c) => sum + c.expectedValue, 0);
        return fmtMoney(total);
      },
      computeDelta: (cases) => {
        const total = cases
          .filter((c) => c.status === 'active')
          .reduce((sum, c) => sum + c.expectedValue, 0);
        const prev = Math.round(total * 0.97);
        const diff = total - prev;
        return {
          value: `+${fmtMoney(diff)} vs last month`,
          type: 'positive',
        };
      },
      sparkline: (_cases) => [810, 830, 845, 860, 878, 892],
    },
  ],

  charts: [
    {
      title: 'Claims by Type',
      subtitle: 'Active claims distributed by claim category',
      type: 'pie',
      getData: (cases) => {
        const active = cases.filter((c) => c.status === 'active');
        const counts: Record<string, number> = { BI: 0, 'UM/UIM': 0, PIP: 0, Premises: 0 };
        for (const c of active) {
          const t = assignClaimType(c);
          counts[t] = (counts[t] || 0) + 1;
        }
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      },
      series: [
        { dataKey: 'value', color: '#f59e0b', name: 'BI' },
        { dataKey: 'value', color: '#ef4444', name: 'UM/UIM' },
        { dataKey: 'value', color: '#3b82f6', name: 'PIP' },
        { dataKey: 'value', color: '#10b981', name: 'Premises' },
      ],
      xAxisKey: 'name',
    },
    {
      title: 'Filed vs Resolved — Monthly',
      subtitle: 'Claims filed and resolved over the last 6 months',
      type: 'line',
      getData: (cases) => {
        const base = Math.round(cases.filter((c) => c.status === 'active').length / 50);
        return MONTHS.map((month, i) => ({
          month,
          Filed: base + [12, 8, -5, 15, 10, 18][i],
          Resolved: base - 5 + [8, 10, 6, 12, 14, 16][i],
        }));
      },
      series: [
        { dataKey: 'Filed', color: '#f59e0b', name: 'Filed' },
        { dataKey: 'Resolved', color: '#10b981', name: 'Resolved' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Claims Overview',
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case', sortable: true },
      { key: 'claimType', label: 'Type', sortable: true },
      { key: 'carrier', label: 'Carrier', sortable: true },
      { key: 'attorney', label: 'Attorney', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'expectedValue', label: 'Expected Value', sortable: true },
      { key: 'nextActionDue', label: 'Next Action Due', sortable: true },
    ],
    getData: (cases) =>
      cases
        .filter((c) => c.status === 'active')
        .slice(0, 50)
        .map((c) => ({
          id: c.id,
          title: c.title,
          claimType: assignClaimType(c),
          carrier: assignCarrier(c),
          attorney: c.attorney,
          status: c.status,
          expectedValue: fmtMoneyExact(c.expectedValue),
          nextActionDue: c.nextActionDue,
        })),
    keyField: 'id',
    maxRows: 50,
  },
};

// ── Page 2: Active Claims ────────────────────────────────────────────────

const activeClaimsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'active-claims',
  title: 'Active Claims',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter((c) => c.status === 'active'),

  statCards: [
    {
      label: 'Total Active',
      compute: (cases) => cases.length,
      computeDelta: (cases) => ({
        value: `${cases.length} open files`,
        type: 'neutral',
      }),
      sparkline: (cases) => {
        const n = cases.length;
        return [
          Math.round(n * 0.90),
          Math.round(n * 0.93),
          Math.round(n * 0.95),
          Math.round(n * 0.97),
          Math.round(n * 0.99),
          n,
        ];
      },
    },
    {
      label: 'BI Claims',
      compute: (cases) =>
        cases.filter((c) => assignClaimType(c) === 'BI').length,
    },
    {
      label: 'UM/UIM Claims',
      compute: (cases) =>
        cases.filter((c) => assignClaimType(c) === 'UM/UIM').length,
      computeDelta: (cases) => {
        const n = cases.filter((c) => assignClaimType(c) === 'UM/UIM').length;
        const pct = cases.length > 0 ? ((n / cases.length) * 100).toFixed(0) : '0';
        return { value: `${pct}% of active`, type: 'neutral' };
      },
    },
    {
      label: 'PIP Claims',
      compute: (cases) =>
        cases.filter((c) => assignClaimType(c) === 'PIP').length,
    },
    {
      label: 'Premises Claims',
      compute: (cases) =>
        cases.filter((c) => assignClaimType(c) === 'Premises').length,
    },
    {
      label: 'Avg Policy Limit',
      compute: (cases) => {
        if (cases.length === 0) return '$0';
        const avg =
          cases.reduce((sum, c) => sum + c.exposureAmount, 0) / cases.length;
        return fmtMoney(Math.round(avg));
      },
      computeDelta: () => ({ value: 'per open claim', type: 'neutral' }),
    },
  ],

  charts: [
    {
      title: 'Active Claims by Type & Stage',
      subtitle: 'Distribution of claim types across litigation stages',
      type: 'stacked-bar',
      getData: (cases) => {
        const stageLabels: Record<string, string> = {
          intake: 'Intake',
          'pre-lit': 'Pre-Lit',
          lit: 'Litigation',
        };
        const stages = ['intake', 'pre-lit', 'lit'];
        return stages.map((ps) => {
          const stageCases = cases.filter((c) => c.parentStage === ps);
          const row: Record<string, any> = { stage: stageLabels[ps] || ps };
          for (const t of CLAIM_TYPES) {
            row[t] = stageCases.filter((c) => assignClaimType(c) === t).length;
          }
          return row;
        });
      },
      series: [
        { dataKey: 'BI', color: '#f59e0b', name: 'BI' },
        { dataKey: 'UM/UIM', color: '#ef4444', name: 'UM/UIM' },
        { dataKey: 'PIP', color: '#3b82f6', name: 'PIP' },
        { dataKey: 'Premises', color: '#10b981', name: 'Premises' },
      ],
      xAxisKey: 'stage',
    },
    {
      title: 'Claims by Carrier',
      subtitle: 'Active open claims per insurance carrier',
      type: 'bar',
      getData: (cases) => {
        const counts: Record<string, number> = {};
        for (const carrier of CARRIERS) counts[carrier] = 0;
        for (const c of cases) {
          const carrier = assignCarrier(c);
          counts[carrier] = (counts[carrier] || 0) + 1;
        }
        return Object.entries(counts)
          .map(([carrier, count]) => ({ carrier, count }))
          .sort((a, b) => b.count - a.count);
      },
      series: [{ dataKey: 'count', color: '#f59e0b', name: 'Claims' }],
      xAxisKey: 'carrier',
    },
  ],

  table: {
    title: 'Active Claims List',
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case', sortable: true },
      { key: 'claimType', label: 'Type', sortable: true },
      { key: 'carrier', label: 'Carrier', sortable: true },
      { key: 'stage', label: 'Stage', sortable: true },
      { key: 'attorney', label: 'Attorney', sortable: true },
      { key: 'exposureAmount', label: 'Policy Limit', sortable: true },
      { key: 'expectedValue', label: 'EV', sortable: true },
      { key: 'riskFlags', label: 'Flags', sortable: false },
    ],
    getData: (cases) =>
      cases.slice(0, 75).map((c) => ({
        id: c.id,
        title: c.title,
        claimType: assignClaimType(c),
        carrier: assignCarrier(c),
        stage: c.parentStage,
        attorney: c.attorney,
        exposureAmount: fmtMoneyExact(c.exposureAmount),
        expectedValue: fmtMoneyExact(c.expectedValue),
        riskFlags: c.riskFlags.join(', ') || '—',
      })),
    keyField: 'id',
    maxRows: 75,
  },
};

// ── Page 3: Settlements ──────────────────────────────────────────────────

const settlementsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'settlements',
  title: 'Settlements',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Settled MTD',
      compute: (cases) => {
        // Synthetic: ~0.5% of total as settled this month
        return Math.round(cases.length * 0.005);
      },
      computeDelta: () => ({ value: '+4 vs last month', type: 'positive' }),
      sparkline: (_cases) => [28, 31, 27, 33, 30, 35],
    },
    {
      label: 'Total Settlement Value',
      compute: (cases) => {
        const settled = cases.filter((c) => c.status === 'settled');
        const total = settled.reduce((sum, c) => sum + c.expectedValue, 0);
        // If no settled cases in mock data, use synthetic fallback
        const synthetic = Math.round(cases.length * 42_000);
        return fmtMoney(total > 0 ? total : synthetic);
      },
      computeDelta: () => ({ value: '+12% YTD vs prior year', type: 'positive' }),
      sparkline: (_cases) => [520, 560, 590, 620, 645, 680],
    },
    {
      label: 'Avg Settlement',
      compute: (cases) => {
        const settled = cases.filter((c) => c.status === 'settled');
        if (settled.length === 0) {
          // Synthetic fallback: median-ish expected value
          const evs = cases
            .map((c) => c.expectedValue)
            .sort((a, b) => a - b);
          const mid = evs[Math.floor(evs.length / 2)] ?? 0;
          return fmtMoney(Math.round(mid * 0.85));
        }
        const avg =
          settled.reduce((sum, c) => sum + c.expectedValue, 0) /
          settled.length;
        return fmtMoney(Math.round(avg));
      },
    },
    {
      label: 'Median Settlement',
      compute: (cases) => {
        const evs = cases
          .map((c) => c.expectedValue)
          .sort((a, b) => a - b);
        const mid = evs[Math.floor(evs.length / 2)] ?? 0;
        return fmtMoney(Math.round(mid));
      },
    },
    {
      label: 'At Policy Limits',
      compute: (cases) => {
        // Cases where expectedValue >= 90% of exposureAmount
        const atLimits = cases.filter(
          (c) => c.expectedValue >= c.exposureAmount * 0.9,
        ).length;
        return atLimits;
      },
      computeDelta: (cases) => {
        const atLimits = cases.filter(
          (c) => c.expectedValue >= c.exposureAmount * 0.9,
        ).length;
        const pct =
          cases.length > 0
            ? ((atLimits / cases.length) * 100).toFixed(1)
            : '0';
        return { value: `${pct}% of cases`, type: 'neutral' };
      },
    },
  ],

  charts: [
    {
      title: 'Settlements by Amount Bucket',
      subtitle: 'Distribution of settlement values',
      type: 'bar',
      getData: (_cases) => {
        // Synthetic distribution matching realistic PI firm profile
        return [
          { bucket: '<$25K', count: 82 },
          { bucket: '$25–50K', count: 134 },
          { bucket: '$50–100K', count: 98 },
          { bucket: '$100–250K', count: 61 },
          { bucket: '$250–500K', count: 28 },
          { bucket: '$500K–1M', count: 12 },
          { bucket: '>$1M', count: 5 },
        ];
      },
      series: [{ dataKey: 'count', color: '#f59e0b', name: 'Settlements' }],
      xAxisKey: 'bucket',
    },
    {
      title: 'Monthly Settlement Revenue',
      subtitle: 'Gross settlement revenue collected over last 6 months',
      type: 'line',
      getData: (cases) => {
        const base =
          cases.reduce((sum, c) => sum + c.expectedValue, 0) / 1_000_000 / 6;
        return MONTHS.map((month, i) => ({
          month,
          revenue: parseFloat(
            (base * [0.85, 0.9, 0.88, 0.95, 1.0, 1.08][i]).toFixed(2),
          ),
        }));
      },
      series: [
        {
          dataKey: 'revenue',
          color: '#10b981',
          name: 'Revenue ($M)',
        },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Recent Settlements',
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case', sortable: true },
      { key: 'claimType', label: 'Type', sortable: true },
      { key: 'carrier', label: 'Carrier', sortable: true },
      { key: 'attorney', label: 'Attorney', sortable: true },
      { key: 'exposureAmount', label: 'Policy Limit', sortable: true },
      { key: 'settlementValue', label: 'Settlement Value', sortable: true },
      { key: 'atLimits', label: 'At Limits', sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 40).map((c) => {
        const settlementValue = Math.round(
          c.expectedValue * (0.75 + (claimTypeSeed(c) % 25) / 100),
        );
        const atLimits = settlementValue >= c.exposureAmount * 0.9 ? 'Yes' : 'No';
        return {
          id: c.id,
          title: c.title,
          claimType: assignClaimType(c),
          carrier: assignCarrier(c),
          attorney: c.attorney,
          exposureAmount: fmtMoneyExact(c.exposureAmount),
          settlementValue: fmtMoneyExact(settlementValue),
          atLimits,
        };
      }),
    keyField: 'id',
    maxRows: 40,
  },
};

// ── Page 4: Billing ──────────────────────────────────────────────────────

const LIEN_TYPES = ['Medicare', 'Medicaid', 'Health Insurance', 'Workers Comp', 'ERISA', 'Provider Lien'];

const billingPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'billing',
  title: 'Claims Billing',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Receivables Outstanding',
      compute: (cases) => {
        const total = cases
          .filter((c) => c.status === 'active')
          .reduce((sum, c) => sum + c.hardCostsRemaining, 0);
        return fmtMoney(total);
      },
      computeDelta: () => ({ value: '+$48K vs last month', type: 'negative' }),
      sparkline: (_cases) => [1100, 1150, 1180, 1210, 1240, 1280],
    },
    {
      label: 'Disbursements Pending',
      compute: (cases) => {
        // Synthetic: ~3% of active cases have disbursements pending
        const active = cases.filter((c) => c.status === 'active').length;
        return Math.round(active * 0.031);
      },
      computeDelta: () => ({ value: '14 new this week', type: 'neutral' }),
    },
    {
      label: 'Avg Days to Disburse',
      compute: (_cases) => 18,
      computeDelta: () => ({ value: '-2d vs last quarter', type: 'positive' }),
      sparkline: (_cases) => [24, 22, 21, 20, 19, 18],
    },
    {
      label: 'Outstanding Liens',
      compute: (cases) => {
        // Cases with a lien dispute flag or synthetic count
        const lienCases = cases.filter((c) =>
          c.riskFlags.includes('Lien dispute'),
        ).length;
        return lienCases > 0 ? lienCases : Math.round(cases.length * 0.028);
      },
      computeDelta: (cases) => {
        const n = cases.filter((c) =>
          c.riskFlags.includes('Lien dispute'),
        ).length || Math.round(cases.length * 0.028);
        return {
          value: `$${(n * 14_500).toLocaleString('en-US')} total`,
          type: 'negative',
        };
      },
    },
  ],

  charts: [
    {
      title: 'Monthly Disbursements',
      subtitle: 'Total disbursements processed per month',
      type: 'bar',
      getData: (cases) => {
        const base =
          Math.round(
            cases
              .filter((c) => c.status === 'active')
              .reduce((sum, c) => sum + c.hardCostsRemaining, 0) / 6 / 1_000,
          );
        return MONTHS.map((month, i) => ({
          month,
          disbursements: base + [-40, 20, -15, 35, 10, 50][i],
        }));
      },
      series: [
        {
          dataKey: 'disbursements',
          color: '#f59e0b',
          name: 'Disbursements ($K)',
        },
      ],
      xAxisKey: 'month',
    },
    {
      title: 'Lien Types',
      subtitle: 'Outstanding liens by category',
      type: 'pie',
      getData: (cases) => {
        const total = cases.length;
        // Synthetic proportional distribution
        const weights = [0.28, 0.22, 0.20, 0.12, 0.10, 0.08];
        return LIEN_TYPES.map((name, i) => ({
          name,
          value: Math.round(total * weights[i]),
        }));
      },
      series: [
        { dataKey: 'value', color: '#f59e0b', name: 'Medicare' },
        { dataKey: 'value', color: '#ef4444', name: 'Medicaid' },
        { dataKey: 'value', color: '#3b82f6', name: 'Health Insurance' },
        { dataKey: 'value', color: '#10b981', name: 'Workers Comp' },
        { dataKey: 'value', color: '#8b5cf6', name: 'ERISA' },
        { dataKey: 'value', color: '#64748b', name: 'Provider Lien' },
      ],
      xAxisKey: 'name',
    },
  ],

  table: {
    title: 'Billing Items',
    columns: [
      { key: 'id', label: 'Case ID', sortable: true },
      { key: 'title', label: 'Case', sortable: true },
      { key: 'attorney', label: 'Attorney', sortable: true },
      { key: 'hardCostsRemaining', label: 'Hard Costs Remaining', sortable: true },
      { key: 'lienType', label: 'Lien Type', sortable: true },
      { key: 'lienAmount', label: 'Lien Amount', sortable: true },
      { key: 'disbursementStatus', label: 'Disbursement Status', sortable: true },
      { key: 'nextActionDue', label: 'Due Date', sortable: true },
    ],
    getData: (cases) =>
      cases.slice(0, 50).map((c, i) => {
        const lienType = LIEN_TYPES[claimTypeSeed(c) % LIEN_TYPES.length];
        const lienAmount = 5_000 + ((claimTypeSeed(c) * 37) % 45_000);
        const disbursementStatuses = ['Pending', 'Processing', 'Cleared', 'On Hold'];
        const disbursementStatus =
          disbursementStatuses[i % disbursementStatuses.length];
        return {
          id: c.id,
          title: c.title,
          attorney: c.attorney,
          hardCostsRemaining: fmtMoneyExact(c.hardCostsRemaining),
          lienType,
          lienAmount: fmtMoneyExact(lienAmount),
          disbursementStatus,
          nextActionDue: c.nextActionDue,
        };
      }),
    keyField: 'id',
    maxRows: 50,
  },
};

// ── Export ───────────────────────────────────────────────────────────────

export const claimsPages: DeptPageConfig[] = [
  dashboardPage,
  activeClaimsPage,
  settlementsPage,
  billingPage,
];
