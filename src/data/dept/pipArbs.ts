// ── PIP Arbs Department Dashboard Config ────────────────────────────────
// deptId: "pip-arbs"  |  accentColor: #8b5cf6 (violet)
// All filterCases pass through the full case set; stats/data are synthetic
// but scale with cases.length to remain coherent.

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

// ── Synthetic helpers ────────────────────────────────────────────────────

const CARRIERS = [
  'State Farm',
  'Allstate',
  'GEICO',
  'Progressive',
  'Liberty Mutual',
  'Hartford',
  'Travelers',
  'Nationwide',
] as const;

const DISPUTE_TYPES = [
  'Medical Necessity',
  'Fee Schedule',
  'Fraud / EUO',
  'Late Payment',
  'Policy Exhaustion',
] as const;

const MONTHS = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'] as const;

// Deterministic pseudo-random that stays stable across renders
function synth(seed: number, min: number, max: number): number {
  return min + Math.abs((seed * 1103515245 + 12345) & 0x7fffffff) % (max - min + 1);
}

// ── Page 1 — Dashboard ───────────────────────────────────────────────────

const dashboardPage: DeptPageConfig = {
  deptId: 'pip-arbs',
  pageId: 'dashboard',
  title: 'PIP Arbs — Dashboard',
  deptLabel: 'PIP Arbs',
  accentColor: '#8b5cf6',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Active Cases',
      compute: (cases) => Math.round(cases.length * 0.048),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.048);
        return { value: `+${Math.round(v * 0.06)} vs last month`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.048);
        return [
          Math.round(base * 0.88),
          Math.round(base * 0.91),
          Math.round(base * 0.93),
          Math.round(base * 0.96),
          Math.round(base * 0.98),
          base,
        ];
      },
    },
    {
      label: 'Hearings Next 30d',
      compute: (cases) => Math.round(cases.length * 0.011),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.011);
        return { value: `+${Math.round(v * 0.08)} scheduled`, type: 'positive' };
      },
    },
    {
      label: 'Awards MTD',
      compute: (cases) => Math.round(cases.length * 0.007),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.007);
        return { value: `${Math.round(v * 0.9)} same period LM`, type: 'neutral' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.007);
        return [
          Math.round(base * 0.80),
          Math.round(base * 0.85),
          Math.round(base * 0.90),
          Math.round(base * 0.95),
          Math.round(base * 0.98),
          base,
        ];
      },
    },
    {
      label: 'Avg Award',
      compute: (cases) => {
        const awards = Math.round(cases.length * 0.007);
        const totalAwarded = Math.round(cases.length * 0.007 * 4_200);
        return `$${(awards > 0 ? Math.round(totalAwarded / awards) : 0).toLocaleString()}`;
      },
      computeDelta: () => ({ value: '+$180 vs last month', type: 'positive' }),
    },
    {
      label: 'Win Rate',
      compute: (cases) => {
        const wins = Math.round(cases.length * 0.0044);
        const total = Math.round(cases.length * 0.007);
        const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
        return `${rate}%`;
      },
      computeDelta: () => ({ value: '+2 pts vs last month', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Cases by Status',
      type: 'pie',
      getData: (cases) => {
        const n = cases.length;
        return [
          { name: 'Pre-Hearing',       value: Math.round(n * 0.018) },
          { name: 'Demand Filed',      value: Math.round(n * 0.012) },
          { name: 'Hearing Scheduled', value: Math.round(n * 0.009) },
          { name: 'Awaiting Award',    value: Math.round(n * 0.005) },
          { name: 'Closed — Award',    value: Math.round(n * 0.003) },
          { name: 'Closed — Denied',   value: Math.round(n * 0.001) },
        ];
      },
      series: [
        { dataKey: 'value', color: '#8b5cf6', name: 'Cases' },
      ],
      xAxisKey: 'name',
    },
    {
      title: 'Monthly Awards',
      subtitle: 'Count of awards issued — last 6 months',
      type: 'line',
      getData: (cases) => {
        const base = Math.round(cases.length * 0.007);
        return MONTHS.map((month, i) => ({
          month,
          awards: Math.round(base * (0.75 + i * 0.05)),
          fullAward: Math.round(base * (0.45 + i * 0.03)),
          partial: Math.round(base * (0.20 + i * 0.01)),
        }));
      },
      series: [
        { dataKey: 'awards',    color: '#8b5cf6', name: 'Total Awards' },
        { dataKey: 'fullAward', color: '#6d28d9', name: 'Full Award' },
        { dataKey: 'partial',   color: '#a78bfa', name: 'Partial' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'PIP Arbs Overview',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'caseId',      label: 'Case #',         sortable: true  },
      { key: 'claimant',    label: 'Claimant',        sortable: true  },
      { key: 'carrier',     label: 'Carrier',         sortable: true  },
      { key: 'disputeType', label: 'Dispute Type',    sortable: true  },
      { key: 'status',      label: 'Status',          sortable: true  },
      { key: 'hearingDate', label: 'Hearing Date',    sortable: true  },
      { key: 'amountSought',label: 'Amount Sought',   sortable: true  },
      { key: 'result',      label: 'Result',          sortable: true  },
    ],
    getData: (cases) => {
      const pip = cases.slice(0, Math.round(cases.length * 0.048));
      const statuses = ['Pre-Hearing', 'Demand Filed', 'Hearing Scheduled', 'Awaiting Award', 'Closed — Award', 'Closed — Denied'];
      const results  = ['Pending', 'Pending', 'Pending', 'Pending', 'Full Award', 'Partial Award', 'Denied'];
      return pip.map((c, i) => ({
        id:           `pip-${i}`,
        caseId:       `PIP-${String(2026).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
        claimant:     c.title.split(' v. ')[0] ?? c.title,
        carrier:      CARRIERS[i % CARRIERS.length],
        disputeType:  DISPUTE_TYPES[i % DISPUTE_TYPES.length],
        status:       statuses[i % statuses.length],
        hearingDate:  c.nextActionDue,
        amountSought: `$${(2_500 + synth(i, 0, 12_000)).toLocaleString()}`,
        result:       results[i % results.length],
      }));
    },
  },
};

// ── Page 2 — Active Cases ────────────────────────────────────────────────

const activeCasesPage: DeptPageConfig = {
  deptId: 'pip-arbs',
  pageId: 'active-cases',
  title: 'PIP Arbs — Active Cases',
  deptLabel: 'PIP Arbs',
  accentColor: '#8b5cf6',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Total Active',
      compute: (cases) => Math.round(cases.length * 0.048),
    },
    {
      label: 'Pre-Hearing',
      compute: (cases) => Math.round(cases.length * 0.018),
      computeDelta: () => ({ value: 'Largest bucket', type: 'neutral' }),
    },
    {
      label: 'Demand Filed',
      compute: (cases) => Math.round(cases.length * 0.012),
    },
    {
      label: 'Awaiting Assignment',
      compute: (cases) => Math.round(cases.length * 0.006),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.006);
        return v > 20
          ? { value: 'Backlog building', type: 'negative' }
          : { value: 'Within target', type: 'positive' };
      },
    },
    {
      label: 'Overdue (No Activity 14d+)',
      compute: (cases) => Math.round(cases.length * 0.004),
      computeDelta: () => ({ value: '-3 vs last week', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Active Cases by Carrier',
      type: 'bar',
      getData: (cases) => {
        const base = Math.round(cases.length * 0.048);
        const weights = [0.22, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05];
        return CARRIERS.map((carrier, i) => ({
          carrier,
          cases: Math.round(base * weights[i]),
        }));
      },
      series: [{ dataKey: 'cases', color: '#8b5cf6', name: 'Active Cases' }],
      xAxisKey: 'carrier',
    },
    {
      title: 'Active Cases by Dispute Type',
      type: 'pie',
      getData: (cases) => {
        const base = Math.round(cases.length * 0.048);
        const weights = [0.35, 0.28, 0.18, 0.12, 0.07];
        return DISPUTE_TYPES.map((type, i) => ({
          name:  type,
          value: Math.round(base * weights[i]),
        }));
      },
      series: [
        { dataKey: 'value', color: '#8b5cf6', name: 'Cases' },
      ],
      xAxisKey: 'name',
    },
  ],

  table: {
    title: 'Active PIP Cases',
    keyField: 'id',
    maxRows: 100,
    columns: [
      { key: 'caseId',       label: 'Case #',         sortable: true },
      { key: 'claimant',     label: 'Claimant',        sortable: true },
      { key: 'carrier',      label: 'Carrier',         sortable: true },
      { key: 'disputeType',  label: 'Dispute Type',    sortable: true },
      { key: 'status',       label: 'Status',          sortable: true },
      { key: 'daysOpen',     label: 'Days Open',       sortable: true },
      { key: 'amountSought', label: 'Amount Sought',   sortable: true },
      { key: 'nextAction',   label: 'Next Action',     sortable: false },
      { key: 'nextDue',      label: 'Next Due',        sortable: true },
    ],
    getData: (cases) => {
      const pip    = cases.slice(0, Math.round(cases.length * 0.048));
      const active = ['Pre-Hearing', 'Demand Filed', 'Hearing Scheduled', 'Awaiting Assignment'];
      return pip.map((c, i) => {
        const open = new Date('2026-03-18');
        const start = new Date(c.openDate);
        const days = Math.floor((open.getTime() - start.getTime()) / 86_400_000);
        return {
          id:           `pac-${i}`,
          caseId:       `PIP-${String(2026).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
          claimant:     c.title.split(' v. ')[0] ?? c.title,
          carrier:      CARRIERS[i % CARRIERS.length],
          disputeType:  DISPUTE_TYPES[i % DISPUTE_TYPES.length],
          status:       active[i % active.length],
          daysOpen:     days,
          amountSought: `$${(2_500 + synth(i, 0, 12_000)).toLocaleString()}`,
          nextAction:   c.nextAction,
          nextDue:      c.nextActionDue,
        };
      });
    },
  },
};

// ── Page 3 — Hearings ────────────────────────────────────────────────────

const hearingsPage: DeptPageConfig = {
  deptId: 'pip-arbs',
  pageId: 'hearings',
  title: 'PIP Arbs — Hearings',
  deptLabel: 'PIP Arbs',
  accentColor: '#8b5cf6',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Hearings This Month',
      compute: (cases) => Math.round(cases.length * 0.009),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.009);
        return { value: `+${Math.round(v * 0.07)} vs last month`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.009);
        return [
          Math.round(base * 0.80),
          Math.round(base * 0.85),
          Math.round(base * 0.88),
          Math.round(base * 0.92),
          Math.round(base * 0.96),
          base,
        ];
      },
    },
    {
      label: 'Completed This Month',
      compute: (cases) => Math.round(cases.length * 0.006),
    },
    {
      label: 'Avg Hearing Duration (min)',
      compute: () => 47,
      computeDelta: () => ({ value: '-3 min vs avg', type: 'positive' }),
    },
    {
      label: 'Adjournments This Month',
      compute: (cases) => Math.round(cases.length * 0.0015),
      computeDelta: (cases) => {
        const adj = Math.round(cases.length * 0.0015);
        const total = Math.round(cases.length * 0.009);
        const pct = total > 0 ? Math.round((adj / total) * 100) : 0;
        return pct > 20
          ? { value: `${pct}% adjournment rate`, type: 'negative' }
          : { value: `${pct}% adjournment rate`, type: 'neutral' };
      },
    },
    {
      label: 'Pending Scheduling',
      compute: (cases) => Math.round(cases.length * 0.004),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.004);
        return v > 15
          ? { value: 'Schedule backlog', type: 'negative' }
          : { value: 'On track', type: 'positive' };
      },
    },
  ],

  charts: [
    {
      title: 'Hearings Per Week (Last 8 Weeks)',
      subtitle: 'Scheduled vs Completed',
      type: 'bar',
      getData: (cases) => {
        const base = Math.round(cases.length * 0.009);
        const weekBase = Math.round(base / 4);
        return Array.from({ length: 8 }, (_, w) => ({
          week:       `W${w + 1}`,
          scheduled:  weekBase + synth(w, -2, 3),
          completed:  Math.round((weekBase + synth(w, -2, 3)) * (0.78 + (w % 3) * 0.04)),
          adjourned:  1 + (w % 3),
        }));
      },
      series: [
        { dataKey: 'scheduled', color: '#8b5cf6', name: 'Scheduled'  },
        { dataKey: 'completed', color: '#6d28d9', name: 'Completed'  },
        { dataKey: 'adjourned', color: '#f59e0b', name: 'Adjourned'  },
      ],
      xAxisKey: 'week',
    },
  ],

  table: {
    title: 'Hearing Schedule',
    keyField: 'id',
    maxRows: 75,
    columns: [
      { key: 'caseId',       label: 'Case #',         sortable: true  },
      { key: 'claimant',     label: 'Claimant',        sortable: true  },
      { key: 'carrier',      label: 'Carrier',         sortable: true  },
      { key: 'hearingDate',  label: 'Hearing Date',    sortable: true  },
      { key: 'hearingTime',  label: 'Time',            sortable: false },
      { key: 'arbitrator',   label: 'Arbitrator',      sortable: true  },
      { key: 'amountSought', label: 'Amount Sought',   sortable: true  },
      { key: 'hearingStatus',label: 'Status',          sortable: true  },
    ],
    getData: (cases) => {
      const pip = cases.slice(0, Math.round(cases.length * 0.009));
      const times       = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'];
      const arbitrators = ['Hon. J. Williams', 'Hon. R. Patel', 'Hon. S. Lee', 'Hon. M. Torres', 'Hon. A. Brooks'];
      const hStatuses   = ['Scheduled', 'Scheduled', 'Scheduled', 'Completed', 'Adjourned'];
      return pip.map((c, i) => ({
        id:           `hrg-${i}`,
        caseId:       `PIP-${String(2026).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
        claimant:     c.title.split(' v. ')[0] ?? c.title,
        carrier:      CARRIERS[i % CARRIERS.length],
        hearingDate:  c.nextActionDue,
        hearingTime:  times[i % times.length],
        arbitrator:   arbitrators[i % arbitrators.length],
        amountSought: `$${(2_500 + synth(i, 0, 12_000)).toLocaleString()}`,
        hearingStatus:hStatuses[i % hStatuses.length],
      }));
    },
  },
};

// ── Page 4 — Awards ──────────────────────────────────────────────────────

const awardsPage: DeptPageConfig = {
  deptId: 'pip-arbs',
  pageId: 'awards',
  title: 'PIP Arbs — Awards',
  deptLabel: 'PIP Arbs',
  accentColor: '#8b5cf6',

  filterCases: (cases: LitCase[]) => cases,

  statCards: [
    {
      label: 'Awards MTD',
      compute: (cases) => Math.round(cases.length * 0.007),
      computeDelta: (cases) => {
        const v = Math.round(cases.length * 0.007);
        return { value: `+${Math.round(v * 0.09)} vs last month`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.round(cases.length * 0.007);
        return [
          Math.round(base * 0.78),
          Math.round(base * 0.82),
          Math.round(base * 0.86),
          Math.round(base * 0.91),
          Math.round(base * 0.96),
          base,
        ];
      },
    },
    {
      label: 'Total Awarded MTD ($)',
      compute: (cases) => {
        const count = Math.round(cases.length * 0.007);
        const total = count * 4_200;
        return `$${total.toLocaleString()}`;
      },
      computeDelta: () => ({ value: '+$14k vs last month', type: 'positive' }),
    },
    {
      label: 'Avg Award',
      compute: (cases) => {
        const count = Math.round(cases.length * 0.007);
        return `$${(count > 0 ? 4_200 : 0).toLocaleString()}`;
      },
      computeDelta: () => ({ value: '+$180 vs prior period', type: 'positive' }),
    },
    {
      label: 'Full Award Rate',
      compute: (cases) => {
        const total = Math.round(cases.length * 0.007);
        const full  = Math.round(total * 0.62);
        return `${total > 0 ? Math.round((full / total) * 100) : 0}%`;
      },
      computeDelta: () => ({ value: '+3 pts vs last month', type: 'positive' }),
    },
    {
      label: 'Partial / Denied Rate',
      compute: (cases) => {
        const total   = Math.round(cases.length * 0.007);
        const partial = Math.round(total * 0.23);
        const denied  = Math.round(total * 0.15);
        const pct = total > 0 ? Math.round(((partial + denied) / total) * 100) : 0;
        return `${pct}% (${Math.round(total * 0.23)}P / ${Math.round(total * 0.15)}D)`;
      },
      computeDelta: () => ({ value: '-3 pts vs last month', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Award Outcomes by Month',
      subtitle: 'Full award, partial, and denied — last 6 months',
      type: 'stacked-bar',
      getData: (cases) => {
        const base = Math.round(cases.length * 0.007);
        return MONTHS.map((month, i) => {
          const total   = Math.round(base * (0.75 + i * 0.05));
          const full    = Math.round(total * 0.62);
          const partial = Math.round(total * 0.23);
          const denied  = total - full - partial;
          return { month, full, partial, denied };
        });
      },
      series: [
        { dataKey: 'full',    color: '#6d28d9', name: 'Full Award' },
        { dataKey: 'partial', color: '#8b5cf6', name: 'Partial'    },
        { dataKey: 'denied',  color: '#d1d5db', name: 'Denied'     },
      ],
      xAxisKey: 'month',
    },
    {
      title: 'Awards by Carrier',
      subtitle: 'MTD count and total value',
      type: 'bar',
      getData: (cases) => {
        const base    = Math.round(cases.length * 0.007);
        const weights = [0.22, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05];
        return CARRIERS.map((carrier, i) => {
          const count = Math.round(base * weights[i]);
          return {
            carrier,
            count,
            totalAwarded: count * (3_800 + synth(i, 0, 900)),
          };
        });
      },
      series: [
        { dataKey: 'count',        color: '#8b5cf6', name: 'Award Count'   },
        { dataKey: 'totalAwarded', color: '#6d28d9', name: 'Total Awarded ($)' },
      ],
      xAxisKey: 'carrier',
    },
  ],

  table: {
    title: 'Recent Awards',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'caseId',       label: 'Case #',         sortable: true  },
      { key: 'claimant',     label: 'Claimant',        sortable: true  },
      { key: 'carrier',      label: 'Carrier',         sortable: true  },
      { key: 'disputeType',  label: 'Dispute Type',    sortable: true  },
      { key: 'awardDate',    label: 'Award Date',      sortable: true  },
      { key: 'amountSought', label: 'Amount Sought',   sortable: true  },
      { key: 'amountAwarded',label: 'Amount Awarded',  sortable: true  },
      { key: 'outcome',      label: 'Outcome',         sortable: true  },
      { key: 'arbitrator',   label: 'Arbitrator',      sortable: true  },
    ],
    getData: (cases) => {
      const pip         = cases.slice(0, Math.round(cases.length * 0.007));
      const outcomes    = ['Full Award', 'Full Award', 'Full Award', 'Full Award', 'Partial Award', 'Partial Award', 'Denied'];
      const arbitrators = ['Hon. J. Williams', 'Hon. R. Patel', 'Hon. S. Lee', 'Hon. M. Torres', 'Hon. A. Brooks'];
      return pip.map((c, i) => {
        const sought  = 2_500 + synth(i, 0, 12_000);
        const outcome = outcomes[i % outcomes.length];
        const awarded = outcome === 'Full Award'
          ? sought
          : outcome === 'Partial Award'
          ? Math.round(sought * (0.45 + synth(i, 0, 30) / 100))
          : 0;
        return {
          id:           `awd-${i}`,
          caseId:       `PIP-${String(2026).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
          claimant:     c.title.split(' v. ')[0] ?? c.title,
          carrier:      CARRIERS[i % CARRIERS.length],
          disputeType:  DISPUTE_TYPES[i % DISPUTE_TYPES.length],
          awardDate:    c.lastActivityDate,
          amountSought: `$${sought.toLocaleString()}`,
          amountAwarded:`$${awarded.toLocaleString()}`,
          outcome,
          arbitrator:   arbitrators[i % arbitrators.length],
        };
      });
    },
  },
};

// ── Export ───────────────────────────────────────────────────────────────

export const pipArbsPages: DeptPageConfig[] = [
  dashboardPage,
  activeCasesPage,
  hearingsPage,
  awardsPage,
];
