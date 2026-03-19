// ── Med Marketing Department Page Configs ────────────────────────────────
// 5 pages: Dashboard, Outbound Calls, Appointments, Referrals, Conversion
// All cases pass through (synthetic data — no real case filter needed)

import type { DeptPageConfig } from './types';

const DEPT_ID = 'med-marketing';
const DEPT_LABEL = 'Med Marketing';
const ACCENT = '#14b8a6';

// ── Synthetic constants ──────────────────────────────────────────────────
const REPS = ['Sarah M.', 'Mike T.', 'Lisa R.', 'James K.', 'Amy W.'];

const PROVIDER_TYPES = [
  'Orthopedic',
  'Chiropractic',
  'Pain Management',
  'PT/Rehab',
  'Neurologist',
  'General Practice',
];

const SPECIALTIES = [
  'Orthopedic',
  'Chiropractic',
  'Pain Management',
  'PT/Rehab',
  'Neurologist',
  'General Practice',
  'Urgent Care',
];

// Deterministic pseudo-random helpers (seeded by index so renders are stable)
function seededVal(seed: number, min: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

// ── Page 1: Dashboard ────────────────────────────────────────────────────
const dashboardPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'dashboard',
  title: 'Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Outbound Calls MTD',
      compute: (cases) => Math.max(120, Math.round(cases.length * 0.38)),
      computeDelta: (cases) => {
        const v = Math.max(120, Math.round(cases.length * 0.38));
        const prev = Math.round(v * 0.91);
        const pct = (((v - prev) / prev) * 100).toFixed(1);
        return { value: `+${pct}%`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.max(20, Math.round(cases.length * 0.013));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 7, -3, 5));
      },
    },
    {
      label: 'Appointments MTD',
      compute: (cases) => Math.max(30, Math.round(cases.length * 0.095)),
      computeDelta: (cases) => {
        const v = Math.max(30, Math.round(cases.length * 0.095));
        const prev = Math.round(v * 0.88);
        const pct = (((v - prev) / prev) * 100).toFixed(1);
        return { value: `+${pct}%`, type: 'positive' };
      },
      sparkline: (cases) => {
        const base = Math.max(6, Math.round(cases.length * 0.003));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 11, -2, 4));
      },
    },
    {
      label: 'Active Providers',
      compute: (cases) => Math.max(18, Math.round(cases.length * 0.028)),
      computeDelta: () => ({ value: '+2', type: 'positive' }),
      sparkline: (cases) => {
        const base = Math.max(4, Math.round(cases.length * 0.007));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 3, 0, 2));
      },
    },
    {
      label: 'New Referrals MTD',
      compute: (cases) => Math.max(14, Math.round(cases.length * 0.04)),
      computeDelta: (cases) => {
        const v = Math.max(14, Math.round(cases.length * 0.04));
        const prev = Math.round(v * 0.94);
        const pct = (((v - prev) / prev) * 100).toFixed(1);
        return { value: `+${pct}%`, type: 'positive' };
      },
    },
    {
      label: 'Conversion Rate',
      compute: (cases) => {
        const appts = Math.max(30, Math.round(cases.length * 0.095));
        const signed = Math.max(8, Math.round(appts * 0.42));
        return `${((signed / appts) * 100).toFixed(1)}%`;
      },
      computeDelta: () => ({ value: '+1.3%', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Weekly Calls & Appointments',
      subtitle: 'Last 8 weeks',
      type: 'line',
      getData: (cases) => {
        const base = Math.max(25, Math.round(cases.length * 0.012));
        return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'].map(
          (week, i) => ({
            week,
            calls: base + seededVal(i * 5, -4, 10),
            appointments: Math.round((base + seededVal(i * 5, -4, 10)) * 0.27),
          })
        );
      },
      series: [
        { dataKey: 'calls', color: ACCENT, name: 'Calls' },
        { dataKey: 'appointments', color: '#f97316', name: 'Appointments' },
      ],
      xAxisKey: 'week',
    },
    {
      title: 'Provider Type Mix',
      subtitle: 'Active providers by specialty',
      type: 'pie',
      getData: (cases) => {
        const total = Math.max(18, Math.round(cases.length * 0.028));
        const weights = [22, 25, 18, 15, 10, 10];
        const sum = weights.reduce((a, b) => a + b, 0);
        return PROVIDER_TYPES.map((type, i) => ({
          name: type,
          value: Math.max(1, Math.round((weights[i] / sum) * total)),
        }));
      },
      series: [
        { dataKey: 'value', color: ACCENT },
      ],
      xAxisKey: 'name',
    },
  ],

  table: {
    title: 'Recent Activity',
    columns: [
      { key: 'rep', label: 'Rep', sortable: true },
      { key: 'activityType', label: 'Activity', sortable: true },
      { key: 'provider', label: 'Provider', sortable: true },
      { key: 'date', label: 'Date', sortable: true },
      { key: 'outcome', label: 'Outcome', sortable: false },
    ],
    getData: () => {
      const activities = ['Outbound Call', 'Appointment', 'Follow-Up Call', 'Referral Drop-Off', 'Check-In Visit'];
      const providers = ['Coastal Orthopedics', 'SunCoast Chiro', 'Bay Area Pain Mgmt', 'Gulf Rehab PT', 'Neuro Associates', 'Bayside Family Med'];
      const outcomes = ['Connected', 'Voicemail', 'Appointment Set', 'Referral Confirmed', 'No Answer', 'Follow-Up Needed'];
      return Array.from({ length: 20 }, (_, i) => ({
        id: `act-${i + 1}`,
        rep: REPS[i % REPS.length],
        activityType: activities[seededVal(i * 2, 0, activities.length - 1)],
        provider: providers[seededVal(i * 3, 0, providers.length - 1)],
        date: `2026-03-${String(Math.max(1, 18 - i)).padStart(2, '0')}`,
        outcome: outcomes[seededVal(i * 4, 0, outcomes.length - 1)],
      }));
    },
    keyField: 'id',
    maxRows: 20,
  },
};

// ── Page 2: Outbound Calls ───────────────────────────────────────────────
const outboundCallsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'outbound-calls',
  title: 'Outbound Calls',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Calls Today',
      compute: (cases) => Math.max(8, Math.round(cases.length * 0.018)),
      computeDelta: () => ({ value: '+3 vs yesterday', type: 'positive' }),
      sparkline: (_cases) => [6, 9, 7, 11, 8, 10, 12],
    },
    {
      label: 'Calls This Week',
      compute: (cases) => Math.max(40, Math.round(cases.length * 0.09)),
      computeDelta: () => ({ value: '+12%', type: 'positive' }),
      sparkline: (_cases) => [35, 38, 41, 40, 44],
    },
    {
      label: 'Connect Rate',
      compute: (cases) => {
        const calls = Math.max(40, Math.round(cases.length * 0.09));
        const connects = Math.round(calls * 0.58);
        return `${((connects / calls) * 100).toFixed(1)}%`;
      },
      computeDelta: () => ({ value: '+2.1%', type: 'positive' }),
    },
    {
      label: 'Avg Duration (min)',
      compute: () => '4.2',
      computeDelta: () => ({ value: '-0.3 min', type: 'neutral' }),
    },
    {
      label: 'Calls / Rep (Week)',
      compute: (cases) => {
        const total = Math.max(40, Math.round(cases.length * 0.09));
        return (total / REPS.length).toFixed(1);
      },
      computeDelta: () => ({ value: '+1.4', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Calls by Rep',
      subtitle: 'Current week',
      type: 'bar',
      getData: (cases) => {
        const base = Math.max(8, Math.round(cases.length * 0.018));
        return REPS.map((rep, i) => ({
          rep,
          calls: base + seededVal(i * 6, -3, 8),
          connected: Math.round((base + seededVal(i * 6, -3, 8)) * 0.56),
        }));
      },
      series: [
        { dataKey: 'calls', color: ACCENT, name: 'Total Calls' },
        { dataKey: 'connected', color: '#0d9488', name: 'Connected' },
      ],
      xAxisKey: 'rep',
    },
    {
      title: 'Daily Call Volume',
      subtitle: 'Last 14 days',
      type: 'line',
      getData: (cases) => {
        const base = Math.max(8, Math.round(cases.length * 0.018));
        return Array.from({ length: 14 }, (_, i) => ({
          day: `Mar ${String(5 + i).padStart(2, '0')}`,
          calls: base + seededVal(i * 7, -4, 9),
        }));
      },
      series: [
        { dataKey: 'calls', color: ACCENT, name: 'Calls' },
      ],
      xAxisKey: 'day',
    },
  ],

  table: {
    title: 'Call Log',
    columns: [
      { key: 'time', label: 'Time', sortable: true },
      { key: 'rep', label: 'Rep', sortable: true },
      { key: 'provider', label: 'Provider', sortable: true },
      { key: 'duration', label: 'Duration', sortable: true },
      { key: 'outcome', label: 'Outcome', sortable: true },
      { key: 'notes', label: 'Notes', sortable: false },
    ],
    getData: () => {
      const providers = ['Coastal Orthopedics', 'SunCoast Chiro', 'Bay Area Pain Mgmt', 'Gulf Rehab PT', 'Neuro Associates', 'Bayside Family Med', 'Atlantic PT', 'Premier Pain Clinic'];
      const outcomes = ['Connected', 'Voicemail', 'No Answer', 'Appointment Set', 'Callback Requested', 'Not Interested'];
      const notes = ['Left detailed VM', 'Will call back Fri', 'Appt confirmed', 'Send info via email', 'Spoke with front desk', 'Follow up next week', ''];
      return Array.from({ length: 30 }, (_, i) => ({
        id: `call-${i + 1}`,
        time: `${String(8 + Math.floor(i / 3)).padStart(2, '0')}:${String((i % 3) * 20).padStart(2, '0')}`,
        rep: REPS[i % REPS.length],
        provider: providers[seededVal(i * 3, 0, providers.length - 1)],
        duration: `${seededVal(i * 2, 1, 9)}:${String(seededVal(i * 5, 0, 59)).padStart(2, '0')}`,
        outcome: outcomes[seededVal(i * 4, 0, outcomes.length - 1)],
        notes: notes[seededVal(i * 6, 0, notes.length - 1)],
      }));
    },
    keyField: 'id',
    maxRows: 30,
  },
};

// ── Page 3: Appointments ─────────────────────────────────────────────────
const appointmentsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'appointments',
  title: 'Appointments',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Appointments This Week',
      compute: (cases) => Math.max(10, Math.round(cases.length * 0.024)),
      computeDelta: () => ({ value: '+2 vs last week', type: 'positive' }),
      sparkline: (_cases) => [8, 9, 7, 11, 10],
    },
    {
      label: 'Appointments MTD',
      compute: (cases) => Math.max(30, Math.round(cases.length * 0.095)),
      computeDelta: () => ({ value: '+18%', type: 'positive' }),
      sparkline: (cases) => {
        const base = Math.max(7, Math.round(cases.length * 0.024));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 9, -2, 4));
      },
    },
    {
      label: 'No-Shows',
      compute: (cases) => {
        const appts = Math.max(30, Math.round(cases.length * 0.095));
        return Math.round(appts * 0.11);
      },
      computeDelta: () => ({ value: '-2 vs last month', type: 'positive' }),
    },
    {
      label: 'Avg Appts / Rep / Week',
      compute: (cases) => {
        const weekly = Math.max(10, Math.round(cases.length * 0.024));
        return (weekly / REPS.length).toFixed(1);
      },
      computeDelta: () => ({ value: '+0.4', type: 'positive' }),
    },
    {
      label: 'New vs Follow-Up',
      compute: (cases) => {
        const total = Math.max(30, Math.round(cases.length * 0.095));
        const newAppts = Math.round(total * 0.62);
        const followUp = total - newAppts;
        return `${newAppts} / ${followUp}`;
      },
      computeDelta: () => ({ value: 'New +5%', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Appointments by Rep',
      subtitle: 'Month to date',
      type: 'bar',
      getData: (cases) => {
        const base = Math.max(5, Math.round(cases.length * 0.019));
        return REPS.map((rep, i) => ({
          rep,
          newAppts: base + seededVal(i * 5, -2, 5),
          followUp: Math.round((base + seededVal(i * 5, -2, 5)) * 0.55),
          noShow: Math.max(0, Math.round((base + seededVal(i * 5, -2, 5)) * 0.1)),
        }));
      },
      series: [
        { dataKey: 'newAppts', color: ACCENT, name: 'New' },
        { dataKey: 'followUp', color: '#0d9488', name: 'Follow-Up' },
        { dataKey: 'noShow', color: '#f87171', name: 'No-Show' },
      ],
      xAxisKey: 'rep',
    },
    {
      title: 'Weekly Appointment Trend',
      subtitle: 'Last 10 weeks',
      type: 'area',
      getData: (cases) => {
        const base = Math.max(8, Math.round(cases.length * 0.022));
        return Array.from({ length: 10 }, (_, i) => ({
          week: `Wk${i + 1}`,
          appointments: base + seededVal(i * 8, -3, 6),
        }));
      },
      series: [
        { dataKey: 'appointments', color: ACCENT, name: 'Appointments' },
      ],
      xAxisKey: 'week',
    },
  ],

  table: {
    title: 'Appointment Schedule',
    columns: [
      { key: 'date', label: 'Date', sortable: true },
      { key: 'time', label: 'Time', sortable: true },
      { key: 'rep', label: 'Rep', sortable: true },
      { key: 'provider', label: 'Provider', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ],
    getData: () => {
      const providers = ['Coastal Orthopedics', 'SunCoast Chiro', 'Bay Area Pain Mgmt', 'Gulf Rehab PT', 'Neuro Associates', 'Bayside Family Med'];
      const types = ['New Provider', 'Follow-Up', 'Lunch & Learn', 'Re-Engagement', 'Check-In'];
      const statuses = ['Confirmed', 'Pending', 'Completed', 'No-Show', 'Rescheduled'];
      return Array.from({ length: 25 }, (_, i) => ({
        id: `appt-${i + 1}`,
        date: `2026-03-${String(Math.max(1, 25 - i)).padStart(2, '0')}`,
        time: `${String(9 + (i % 7)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
        rep: REPS[i % REPS.length],
        provider: providers[seededVal(i * 3, 0, providers.length - 1)],
        type: types[seededVal(i * 4, 0, types.length - 1)],
        status: statuses[seededVal(i * 6, 0, statuses.length - 1)],
      }));
    },
    keyField: 'id',
    maxRows: 25,
  },
};

// ── Page 4: Referrals ────────────────────────────────────────────────────
const referralsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'referrals',
  title: 'Referrals',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'New Referrals MTD',
      compute: (cases) => Math.max(14, Math.round(cases.length * 0.04)),
      computeDelta: () => ({ value: '+22%', type: 'positive' }),
      sparkline: (cases) => {
        const base = Math.max(3, Math.round(cases.length * 0.01));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 7, -1, 3));
      },
    },
    {
      label: 'Top Provider',
      compute: () => 'SunCoast Chiro',
      computeDelta: () => ({ value: '4 referrals this mo.', type: 'neutral' }),
    },
    {
      label: 'Avg Referrals / Provider',
      compute: (cases) => {
        const refs = Math.max(14, Math.round(cases.length * 0.04));
        const providers = Math.max(18, Math.round(cases.length * 0.028));
        return (refs / providers).toFixed(2);
      },
      computeDelta: () => ({ value: '+0.08', type: 'positive' }),
    },
    {
      label: 'Inactive 90d+',
      compute: (cases) => {
        const providers = Math.max(18, Math.round(cases.length * 0.028));
        return Math.round(providers * 0.18);
      },
      computeDelta: () => ({ value: '-1 vs last mo.', type: 'positive' }),
    },
    {
      label: 'Growth MoM',
      compute: () => '+11.4%',
      computeDelta: () => ({ value: 'vs +6.2% prior mo.', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Referrals by Provider',
      subtitle: 'Top 8 providers, MTD',
      type: 'horizontal-bar',
      getData: (cases) => {
        const base = Math.max(2, Math.round(cases.length * 0.006));
        const providerNames = [
          'SunCoast Chiro', 'Coastal Orthopedics', 'Bay Area Pain Mgmt',
          'Gulf Rehab PT', 'Neuro Associates', 'Bayside Family Med',
          'Atlantic PT', 'Premier Pain Clinic',
        ];
        return providerNames.map((provider, i) => ({
          provider,
          referrals: base + seededVal(i * 9, 0, 5),
        })).sort((a, b) => b.referrals - a.referrals);
      },
      series: [
        { dataKey: 'referrals', color: ACCENT, name: 'Referrals' },
      ],
      xAxisKey: 'provider',
    },
    {
      title: 'Monthly Referral Trend',
      subtitle: 'Last 6 months',
      type: 'line',
      getData: (cases) => {
        const base = Math.max(10, Math.round(cases.length * 0.034));
        return ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, i) => ({
          month,
          referrals: base + seededVal(i * 11, -2, 6),
        }));
      },
      series: [
        { dataKey: 'referrals', color: ACCENT, name: 'Referrals' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Referral Sources',
    columns: [
      { key: 'provider', label: 'Provider', sortable: true },
      { key: 'specialty', label: 'Specialty', sortable: true },
      { key: 'referralsMTD', label: 'Referrals MTD', sortable: true },
      { key: 'referralsYTD', label: 'Referrals YTD', sortable: true },
      { key: 'lastReferral', label: 'Last Referral', sortable: true },
      { key: 'rep', label: 'Rep', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ],
    getData: () => {
      const providerData = [
        { name: 'SunCoast Chiro', specialty: 'Chiropractic' },
        { name: 'Coastal Orthopedics', specialty: 'Orthopedic' },
        { name: 'Bay Area Pain Mgmt', specialty: 'Pain Management' },
        { name: 'Gulf Rehab PT', specialty: 'PT/Rehab' },
        { name: 'Neuro Associates', specialty: 'Neurologist' },
        { name: 'Bayside Family Med', specialty: 'General Practice' },
        { name: 'Atlantic PT', specialty: 'PT/Rehab' },
        { name: 'Premier Pain Clinic', specialty: 'Pain Management' },
        { name: 'Harbor Ortho Group', specialty: 'Orthopedic' },
        { name: 'Sunrise Chiropractic', specialty: 'Chiropractic' },
        { name: 'Bayview Urgent Care', specialty: 'Urgent Care' },
        { name: 'Gulf Coast Neuro', specialty: 'Neurologist' },
        { name: 'Coastal Family Practice', specialty: 'General Practice' },
        { name: 'Sunbelt Rehab', specialty: 'PT/Rehab' },
        { name: 'Metro Pain Specialists', specialty: 'Pain Management' },
      ];
      const statuses = ['Active', 'Active', 'Active', 'Active', 'Inactive 90d+', 'New'];
      return providerData.map((p, i) => ({
        id: `prov-${i + 1}`,
        provider: p.name,
        specialty: p.specialty,
        referralsMTD: seededVal(i * 7, 0, 4),
        referralsYTD: seededVal(i * 5, 3, 18),
        lastReferral: `2026-0${seededVal(i * 3, 1, 3)}-${String(seededVal(i * 4, 1, 28)).padStart(2, '0')}`,
        rep: REPS[i % REPS.length],
        status: statuses[seededVal(i * 6, 0, statuses.length - 1)],
      }));
    },
    keyField: 'id',
  },
};

// ── Page 5: Conversion ───────────────────────────────────────────────────
const conversionPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'conversion',
  title: 'Conversion',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases,

  statCards: [
    {
      label: 'Leads from Referrals',
      compute: (cases) => Math.max(14, Math.round(cases.length * 0.04)),
      computeDelta: () => ({ value: '+22% MoM', type: 'positive' }),
      sparkline: (cases) => {
        const base = Math.max(3, Math.round(cases.length * 0.01));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 9, -1, 3));
      },
    },
    {
      label: 'Signed Cases',
      compute: (cases) => {
        const leads = Math.max(14, Math.round(cases.length * 0.04));
        return Math.round(leads * 0.43);
      },
      computeDelta: () => ({ value: '+3 vs last mo.', type: 'positive' }),
      sparkline: (cases) => {
        const base = Math.max(1, Math.round(cases.length * 0.004));
        return [0, 1, 2, 3].map((i) => base + seededVal(i * 12, 0, 2));
      },
    },
    {
      label: 'Conversion Rate',
      compute: (cases) => {
        const leads = Math.max(14, Math.round(cases.length * 0.04));
        const signed = Math.round(leads * 0.43);
        return `${((signed / leads) * 100).toFixed(1)}%`;
      },
      computeDelta: () => ({ value: '+1.8%', type: 'positive' }),
    },
    {
      label: 'Avg Case Value',
      compute: (cases) => {
        const avg = Math.max(28000, Math.round(cases.length * 8.5));
        return `$${avg.toLocaleString()}`;
      },
      computeDelta: () => ({ value: '+$2,100', type: 'positive' }),
    },
    {
      label: 'Cost / Referral',
      compute: () => '$148',
      computeDelta: () => ({ value: '-$12 vs last mo.', type: 'positive' }),
    },
  ],

  charts: [
    {
      title: 'Conversion Rate by Specialty',
      subtitle: 'Leads → Signed (%)',
      type: 'bar',
      getData: () => {
        const baseRates = [48, 55, 38, 41, 30, 35, 28];
        return SPECIALTIES.map((specialty, i) => ({
          specialty,
          rate: baseRates[i] + seededVal(i * 7, -4, 4),
        }));
      },
      series: [
        { dataKey: 'rate', color: ACCENT, name: 'Conversion Rate (%)' },
      ],
      xAxisKey: 'specialty',
    },
    {
      title: 'Monthly Conversion Trend',
      subtitle: 'Signed cases last 6 months',
      type: 'line',
      getData: (cases) => {
        const base = Math.max(4, Math.round(cases.length * 0.017));
        return ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, i) => ({
          month,
          leads: base + seededVal(i * 11, -1, 4),
          signed: Math.round((base + seededVal(i * 11, -1, 4)) * 0.43),
        }));
      },
      series: [
        { dataKey: 'leads', color: '#94a3b8', name: 'Leads' },
        { dataKey: 'signed', color: ACCENT, name: 'Signed' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Conversion by Source',
    columns: [
      { key: 'source', label: 'Source Provider', sortable: true },
      { key: 'specialty', label: 'Specialty', sortable: true },
      { key: 'leadsTotal', label: 'Leads', sortable: true },
      { key: 'signed', label: 'Signed', sortable: true },
      { key: 'rate', label: 'Conv. Rate', sortable: true },
      { key: 'avgCaseValue', label: 'Avg Case Value', sortable: true },
      { key: 'rep', label: 'Rep', sortable: true },
    ],
    getData: () => {
      const sources = [
        { name: 'SunCoast Chiro', specialty: 'Chiropractic' },
        { name: 'Coastal Orthopedics', specialty: 'Orthopedic' },
        { name: 'Bay Area Pain Mgmt', specialty: 'Pain Management' },
        { name: 'Gulf Rehab PT', specialty: 'PT/Rehab' },
        { name: 'Neuro Associates', specialty: 'Neurologist' },
        { name: 'Bayside Family Med', specialty: 'General Practice' },
        { name: 'Atlantic PT', specialty: 'PT/Rehab' },
        { name: 'Premier Pain Clinic', specialty: 'Pain Management' },
        { name: 'Harbor Ortho Group', specialty: 'Orthopedic' },
        { name: 'Sunrise Chiropractic', specialty: 'Chiropractic' },
        { name: 'Gulf Coast Neuro', specialty: 'Neurologist' },
        { name: 'Bayview Urgent Care', specialty: 'Urgent Care' },
      ];
      return sources.map((s, i) => {
        const leads = seededVal(i * 7, 2, 8);
        const signed = Math.max(0, Math.round(leads * (0.3 + seededVal(i * 4, 0, 25) / 100)));
        const rate = leads > 0 ? ((signed / leads) * 100).toFixed(1) : '0.0';
        const avgVal = 22000 + seededVal(i * 11, 0, 15) * 1000;
        return {
          id: `conv-${i + 1}`,
          source: s.name,
          specialty: s.specialty,
          leadsTotal: leads,
          signed,
          rate: `${rate}%`,
          avgCaseValue: `$${avgVal.toLocaleString()}`,
          rep: REPS[i % REPS.length],
        };
      });
    },
    keyField: 'id',
  },
};

// ── Export ───────────────────────────────────────────────────────────────
export const medMarketingPages: DeptPageConfig[] = [
  dashboardPage,
  outboundCallsPage,
  appointmentsPage,
  referralsPage,
  conversionPage,
];
