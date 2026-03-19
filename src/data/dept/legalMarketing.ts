// ── Legal Marketing Department Page Configs ──────────────────────────────
// Synthetic marketing data — all filterCases return the full case list and
// stats/charts are computed from synthetic metrics scaled to case count.

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

const DEPT_ID = 'legal-marketing';
const DEPT_LABEL = 'Legal Marketing';
const ACCENT = '#f43f5e';

// ── Synthetic helpers ─────────────────────────────────────────────────────

const CHANNELS = ['TV', 'Digital', 'Referral', 'Walk-In', 'Other'] as const;
type Channel = typeof CHANNELS[number];

const CAMPAIGNS = [
  { name: 'TV - Hartford Local',       channel: 'TV'       as Channel },
  { name: 'Google Ads - PI',           channel: 'Digital'  as Channel },
  { name: 'Facebook - Auto Accident',  channel: 'Digital'  as Channel },
  { name: 'Yelp - Reviews',            channel: 'Digital'  as Channel },
  { name: 'Billboard I-95',            channel: 'Other'    as Channel },
  { name: 'Radio WTIC',                channel: 'TV'       as Channel },
] as const;

/** Deterministic pseudo-random seeded on index */
function seed(n: number): number {
  return ((n * 1_664_525 + 1_013_904_223) & 0x7fff_ffff) / 0x7fff_ffff;
}

function syntheticLeads(n: number): number {
  // ~3 leads per case, with light variance
  return Math.round(n * 3 * (0.85 + seed(n) * 0.3));
}

function syntheticSigned(leads: number): number {
  return Math.round(leads * 0.18);
}

function syntheticSpendMTD(n: number): number {
  return Math.round(n * 420 * (0.9 + seed(n + 1) * 0.2));
}

/** Split a total across channels with fixed-ish weights */
function splitByChannel(total: number): Record<Channel, number> {
  const weights: Record<Channel, number> = { TV: 0.38, Digital: 0.32, Referral: 0.15, 'Walk-In': 0.08, Other: 0.07 };
  const out = {} as Record<Channel, number>;
  for (const ch of CHANNELS) {
    out[ch] = Math.round(total * weights[ch]);
  }
  return out;
}

/** Split leads across channels */
function leadsByChannel(total: number): Record<Channel, number> {
  const weights: Record<Channel, number> = { TV: 0.30, Digital: 0.35, Referral: 0.22, 'Walk-In': 0.08, Other: 0.05 };
  const out = {} as Record<Channel, number>;
  for (const ch of CHANNELS) {
    out[ch] = Math.round(total * weights[ch]);
  }
  return out;
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// ── Filter (returns all cases — data is synthetic) ────────────────────────

function allCases(cases: LitCase[]): LitCase[] {
  return cases;
}

// ── Page 1: Dashboard ─────────────────────────────────────────────────────

const dashboardPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'dashboard',
  title: 'Marketing Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: allCases,

  statCards: [
    {
      label: 'Total Spend MTD',
      compute: (cases) => {
        const n = cases.length;
        const spend = syntheticSpendMTD(n);
        return `$${spend.toLocaleString()}`;
      },
      computeDelta: (cases) => {
        const n = cases.length;
        const delta = Math.round(seed(n + 2) * 12 - 4);
        return { value: `${delta > 0 ? '+' : ''}${delta}% vs last month`, type: delta >= 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Leads (MTD)',
      compute: (cases) => syntheticLeads(cases.length),
      computeDelta: (cases) => {
        const n = cases.length;
        const delta = Math.round(seed(n + 3) * 20 - 5);
        return { value: `${delta > 0 ? '+' : ''}${delta}% vs last month`, type: delta >= 0 ? 'positive' : 'negative' };
      },
      sparkline: (cases) => {
        const n = cases.length;
        return MONTHS.map((_, i) => Math.round(n * 2.8 * (0.8 + seed(n + i) * 0.4)));
      },
    },
    {
      label: 'Signed Cases (MTD)',
      compute: (cases) => {
        const leads = syntheticLeads(cases.length);
        return syntheticSigned(leads);
      },
      computeDelta: (cases) => {
        const n = cases.length;
        const delta = Math.round(seed(n + 4) * 18 - 4);
        return { value: `${delta > 0 ? '+' : ''}${delta}% vs last month`, type: delta >= 0 ? 'positive' : 'negative' };
      },
    },
    {
      label: 'Cost per Lead (CPL)',
      compute: (cases) => {
        const n = cases.length;
        const spend = syntheticSpendMTD(n);
        const leads = syntheticLeads(n);
        return leads > 0 ? `$${Math.round(spend / leads).toLocaleString()}` : '—';
      },
    },
    {
      label: 'Cost per Signed (CPS)',
      compute: (cases) => {
        const n = cases.length;
        const spend = syntheticSpendMTD(n);
        const signed = syntheticSigned(syntheticLeads(n));
        return signed > 0 ? `$${Math.round(spend / signed).toLocaleString()}` : '—';
      },
    },
    {
      label: 'Pipeline Revenue',
      compute: (cases) => {
        const n = cases.length;
        const signed = syntheticSigned(syntheticLeads(n));
        const avgEV = 42_000;
        const total = signed * avgEV;
        return `$${(total / 1_000).toFixed(0)}k`;
      },
    },
  ],

  charts: [
    {
      title: 'Spend by Channel',
      subtitle: 'Month to date',
      type: 'pie',
      getData: (cases) => {
        const n = cases.length;
        const spend = syntheticSpendMTD(n);
        const split = splitByChannel(spend);
        return CHANNELS.map((ch) => ({ channel: ch, value: split[ch] }));
      },
      series: [{ dataKey: 'value', color: ACCENT }],
      xAxisKey: 'channel',
    },
    {
      title: 'Spend vs Signed Cases',
      subtitle: 'Last 6 months',
      type: 'line',
      getData: (cases) => {
        const n = cases.length;
        return MONTHS.map((month, i) => ({
          month,
          spend: Math.round(n * 400 * (0.75 + seed(n + i + 10) * 0.5)),
          signed: Math.round(n * 0.55 * (0.8 + seed(n + i + 20) * 0.4)),
        }));
      },
      series: [
        { dataKey: 'spend',  color: ACCENT,     name: 'Spend ($)' },
        { dataKey: 'signed', color: '#fb923c',  name: 'Signed Cases' },
      ],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Marketing Overview by Channel',
    keyField: 'channel',
    maxRows: 10,
    columns: [
      { key: 'channel',    label: 'Channel',        sortable: true  },
      { key: 'spend',      label: 'Spend MTD ($)',   sortable: true  },
      { key: 'leads',      label: 'Leads',           sortable: true  },
      { key: 'signed',     label: 'Signed',          sortable: true  },
      { key: 'cpl',        label: 'CPL ($)',          sortable: true  },
      { key: 'cps',        label: 'CPS ($)',          sortable: true  },
      { key: 'convRate',   label: 'Conv. Rate',       sortable: true  },
    ],
    getData: (cases) => {
      const n = cases.length;
      const totalSpend = syntheticSpendMTD(n);
      const totalLeads = syntheticLeads(n);
      const spendSplit  = splitByChannel(totalSpend);
      const leadsSplit  = leadsByChannel(totalLeads);
      return CHANNELS.map((ch) => {
        const spend  = spendSplit[ch];
        const leads  = leadsSplit[ch];
        const signed = syntheticSigned(leads);
        return {
          channel:  ch,
          spend:    spend.toLocaleString(),
          leads,
          signed,
          cpl:      leads  > 0 ? Math.round(spend / leads)  : 0,
          cps:      signed > 0 ? Math.round(spend / signed) : 0,
          convRate: leads  > 0 ? `${((signed / leads) * 100).toFixed(1)}%` : '—',
        };
      });
    },
  },
};

// ── Page 2: Campaigns ─────────────────────────────────────────────────────

const campaignsPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'campaigns',
  title: 'Campaigns',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: allCases,

  statCards: [
    {
      label: 'Active Campaigns',
      compute: () => CAMPAIGNS.length,
    },
    {
      label: 'Top Performing',
      compute: (cases) => {
        const n = cases.length;
        // Campaign with best CPL index (lowest) — seed-stable
        const idx = Math.floor(seed(n) * CAMPAIGNS.length);
        return CAMPAIGNS[idx].name;
      },
    },
    {
      label: 'Worst Performing',
      compute: (cases) => {
        const n = cases.length;
        const idx = Math.floor(seed(n + 99) * CAMPAIGNS.length);
        return CAMPAIGNS[idx].name;
      },
    },
    {
      label: 'A/B Tests Running',
      compute: (cases) => {
        const n = cases.length;
        return Math.min(3, Math.max(1, Math.round(seed(n + 7) * 3)));
      },
    },
  ],

  charts: [
    {
      title: 'Leads by Campaign',
      type: 'bar',
      getData: (cases) => {
        const n = cases.length;
        const totalLeads = syntheticLeads(n);
        return CAMPAIGNS.map((c, i) => ({
          campaign: c.name.split(' - ')[0] + (c.name.includes(' - ') ? ' …' : ''),
          leads: Math.round(totalLeads * (0.08 + seed(n + i + 30) * 0.22)),
        }));
      },
      series: [{ dataKey: 'leads', color: ACCENT, name: 'Leads' }],
      xAxisKey: 'campaign',
    },
    {
      title: 'CPL vs Conversion Rate by Campaign',
      type: 'bar',
      getData: (cases) => {
        const n = cases.length;
        const totalSpend = syntheticSpendMTD(n);
        const totalLeads = syntheticLeads(n);
        return CAMPAIGNS.map((c, i) => {
          const leads   = Math.round(totalLeads * (0.08 + seed(n + i + 30) * 0.22));
          const spend   = Math.round(totalSpend * (0.08 + seed(n + i + 40) * 0.22));
          const conv    = parseFloat((8 + seed(n + i + 50) * 14).toFixed(1));
          return {
            campaign: c.name.split(' - ')[0],
            cpl:  leads > 0 ? Math.round(spend / leads) : 0,
            conv,
          };
        });
      },
      series: [
        { dataKey: 'cpl',  color: ACCENT,    name: 'CPL ($)' },
        { dataKey: 'conv', color: '#fb923c', name: 'Conv. Rate (%)' },
      ],
      xAxisKey: 'campaign',
    },
  ],

  table: {
    title: 'Campaign List',
    keyField: 'name',
    maxRows: 10,
    columns: [
      { key: 'name',     label: 'Campaign',       sortable: true },
      { key: 'channel',  label: 'Channel',         sortable: true },
      { key: 'status',   label: 'Status',          sortable: true },
      { key: 'spend',    label: 'Spend MTD ($)',    sortable: true },
      { key: 'leads',    label: 'Leads',            sortable: true },
      { key: 'signed',   label: 'Signed',           sortable: true },
      { key: 'cpl',      label: 'CPL ($)',           sortable: true },
      { key: 'conv',     label: 'Conv. Rate',        sortable: true },
    ],
    getData: (cases) => {
      const n = cases.length;
      const totalSpend = syntheticSpendMTD(n);
      const totalLeads = syntheticLeads(n);
      return CAMPAIGNS.map((c, i) => {
        const leads   = Math.round(totalLeads * (0.08 + seed(n + i + 30) * 0.22));
        const spend   = Math.round(totalSpend * (0.08 + seed(n + i + 40) * 0.22));
        const signed  = syntheticSigned(leads);
        const statuses = ['Active', 'Active', 'Active', 'Paused', 'Active', 'Active'];
        return {
          name:    c.name,
          channel: c.channel,
          status:  statuses[i] ?? 'Active',
          spend:   spend.toLocaleString(),
          leads,
          signed,
          cpl:     leads > 0 ? Math.round(spend / leads) : 0,
          conv:    leads > 0 ? `${((signed / leads) * 100).toFixed(1)}%` : '—',
        };
      });
    },
  },
};

// ── Page 3: Leads by Source ───────────────────────────────────────────────

const leadsBySourcePage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'leads-by-source',
  title: 'Leads by Source',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: allCases,

  statCards: [
    {
      label: 'TV Leads (MTD)',
      compute: (cases) => {
        const n = cases.length;
        return leadsByChannel(syntheticLeads(n))['TV'];
      },
    },
    {
      label: 'Digital Leads (MTD)',
      compute: (cases) => {
        const n = cases.length;
        return leadsByChannel(syntheticLeads(n))['Digital'];
      },
    },
    {
      label: 'Referral Leads (MTD)',
      compute: (cases) => {
        const n = cases.length;
        return leadsByChannel(syntheticLeads(n))['Referral'];
      },
    },
    {
      label: 'Walk-In Leads (MTD)',
      compute: (cases) => {
        const n = cases.length;
        return leadsByChannel(syntheticLeads(n))['Walk-In'];
      },
    },
    {
      label: 'Other Leads (MTD)',
      compute: (cases) => {
        const n = cases.length;
        return leadsByChannel(syntheticLeads(n))['Other'];
      },
    },
    {
      label: 'Highest Converting',
      compute: (cases) => {
        // Referral consistently converts best
        const n = cases.length;
        const leads  = leadsByChannel(syntheticLeads(n));
        let best: Channel = 'Referral';
        let bestConv = 0;
        for (const ch of CHANNELS) {
          const conv = leads[ch] > 0 ? syntheticSigned(leads[ch]) / leads[ch] : 0;
          if (conv > bestConv) { bestConv = conv; best = ch; }
        }
        return `${best} (${(bestConv * 100).toFixed(1)}%)`;
      },
    },
  ],

  charts: [
    {
      title: 'Leads by Source — Monthly Trend',
      subtitle: 'Last 6 months, stacked',
      type: 'stacked-bar',
      getData: (cases) => {
        const n = cases.length;
        return MONTHS.map((month, mi) => {
          const total = Math.round(n * 2.8 * (0.8 + seed(n + mi + 60) * 0.4));
          const split = leadsByChannel(total);
          return { month, ...split };
        });
      },
      series: [
        { dataKey: 'TV',       color: ACCENT,     name: 'TV'       },
        { dataKey: 'Digital',  color: '#fb923c',  name: 'Digital'  },
        { dataKey: 'Referral', color: '#facc15',  name: 'Referral' },
        { dataKey: 'Walk-In',  color: '#4ade80',  name: 'Walk-In'  },
        { dataKey: 'Other',    color: '#818cf8',  name: 'Other'    },
      ],
      xAxisKey: 'month',
    },
    {
      title: 'Leads by Source — Current Month',
      type: 'pie',
      getData: (cases) => {
        const n = cases.length;
        const split = leadsByChannel(syntheticLeads(n));
        return CHANNELS.map((ch) => ({ source: ch, value: split[ch] }));
      },
      series: [{ dataKey: 'value', color: ACCENT }],
      xAxisKey: 'source',
    },
  ],

  table: {
    title: 'Leads by Source — Breakdown',
    keyField: 'source',
    maxRows: 10,
    columns: [
      { key: 'source',   label: 'Source',         sortable: true },
      { key: 'leads',    label: 'Leads MTD',       sortable: true },
      { key: 'signed',   label: 'Signed',          sortable: true },
      { key: 'convRate', label: 'Conv. Rate',       sortable: true },
      { key: 'share',    label: '% of Total Leads', sortable: true },
    ],
    getData: (cases) => {
      const n = cases.length;
      const totalLeads = syntheticLeads(n);
      const split = leadsByChannel(totalLeads);
      return CHANNELS.map((ch) => {
        const leads  = split[ch];
        const signed = syntheticSigned(leads);
        return {
          source:   ch,
          leads,
          signed,
          convRate: leads > 0 ? `${((signed / leads) * 100).toFixed(1)}%` : '—',
          share:    totalLeads > 0 ? `${((leads / totalLeads) * 100).toFixed(1)}%` : '—',
        };
      });
    },
  },
};

// ── Page 4: Cost per Case ─────────────────────────────────────────────────

const costPerCasePage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'cost-per-case',
  title: 'Cost per Case',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: allCases,

  statCards: [
    {
      label: 'Overall CPC',
      compute: (cases) => {
        const n = cases.length;
        const spend  = syntheticSpendMTD(n);
        const signed = syntheticSigned(syntheticLeads(n));
        return signed > 0 ? `$${Math.round(spend / signed).toLocaleString()}` : '—';
      },
    },
    {
      label: 'TV CPC',
      compute: (cases) => {
        const n = cases.length;
        const spend  = splitByChannel(syntheticSpendMTD(n))['TV'];
        const signed = syntheticSigned(leadsByChannel(syntheticLeads(n))['TV']);
        return signed > 0 ? `$${Math.round(spend / signed).toLocaleString()}` : '—';
      },
    },
    {
      label: 'Digital CPC',
      compute: (cases) => {
        const n = cases.length;
        const spend  = splitByChannel(syntheticSpendMTD(n))['Digital'];
        const signed = syntheticSigned(leadsByChannel(syntheticLeads(n))['Digital']);
        return signed > 0 ? `$${Math.round(spend / signed).toLocaleString()}` : '—';
      },
    },
    {
      label: 'Referral CPC',
      compute: (cases) => {
        const n = cases.length;
        const spend  = splitByChannel(syntheticSpendMTD(n))['Referral'];
        const signed = syntheticSigned(leadsByChannel(syntheticLeads(n))['Referral']);
        return signed > 0 ? `$${Math.round(spend / signed).toLocaleString()}` : '—';
      },
    },
    {
      label: 'CPC Target',
      compute: () => '$2,500',
    },
  ],

  charts: [
    {
      title: 'Cost per Case by Channel',
      type: 'bar',
      getData: (cases) => {
        const n = cases.length;
        const spendSplit = splitByChannel(syntheticSpendMTD(n));
        const leadsSplit = leadsByChannel(syntheticLeads(n));
        return CHANNELS.map((ch) => {
          const signed = syntheticSigned(leadsSplit[ch]);
          return {
            channel: ch,
            cpc: signed > 0 ? Math.round(spendSplit[ch] / signed) : 0,
          };
        });
      },
      series: [{ dataKey: 'cpc', color: ACCENT, name: 'CPC ($)' }],
      xAxisKey: 'channel',
    },
    {
      title: 'CPC Trend (Overall)',
      subtitle: 'Last 6 months',
      type: 'line',
      getData: (cases) => {
        const n = cases.length;
        return MONTHS.map((month, i) => {
          const spend  = Math.round(n * 400 * (0.75 + seed(n + i + 70) * 0.5));
          const signed = Math.round(n * 0.55 * (0.8  + seed(n + i + 80) * 0.4));
          return { month, cpc: signed > 0 ? Math.round(spend / signed) : 0 };
        });
      },
      series: [{ dataKey: 'cpc', color: ACCENT, name: 'CPC ($)' }],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'CPC by Campaign',
    keyField: 'name',
    maxRows: 10,
    columns: [
      { key: 'name',    label: 'Campaign',        sortable: true },
      { key: 'channel', label: 'Channel',          sortable: true },
      { key: 'spend',   label: 'Spend MTD ($)',     sortable: true },
      { key: 'leads',   label: 'Leads',             sortable: true },
      { key: 'signed',  label: 'Signed',            sortable: true },
      { key: 'cpl',     label: 'CPL ($)',            sortable: true },
      { key: 'cpc',     label: 'CPC ($)',            sortable: true },
    ],
    getData: (cases) => {
      const n = cases.length;
      const totalSpend = syntheticSpendMTD(n);
      const totalLeads = syntheticLeads(n);
      return CAMPAIGNS.map((c, i) => {
        const leads  = Math.round(totalLeads * (0.08 + seed(n + i + 30) * 0.22));
        const spend  = Math.round(totalSpend * (0.08 + seed(n + i + 40) * 0.22));
        const signed = syntheticSigned(leads);
        return {
          name:    c.name,
          channel: c.channel,
          spend:   spend.toLocaleString(),
          leads,
          signed,
          cpl:     leads  > 0 ? Math.round(spend / leads)  : 0,
          cpc:     signed > 0 ? Math.round(spend / signed) : 0,
        };
      });
    },
  },
};

// ── Page 5: ROI ───────────────────────────────────────────────────────────

const roiPage: DeptPageConfig = {
  deptId: DEPT_ID,
  pageId: 'roi',
  title: 'ROI',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: allCases,

  statCards: [
    {
      label: 'Overall ROI',
      compute: (cases) => {
        const n = cases.length;
        const spend    = syntheticSpendMTD(n);
        const signed   = syntheticSigned(syntheticLeads(n));
        const revenue  = signed * 42_000 * 0.12; // fee at ~12% avg settlement
        const roi      = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return `${roi.toFixed(0)}%`;
      },
    },
    {
      label: 'TV ROI',
      compute: (cases) => {
        const n       = cases.length;
        const spend   = splitByChannel(syntheticSpendMTD(n))['TV'];
        const signed  = syntheticSigned(leadsByChannel(syntheticLeads(n))['TV']);
        const revenue = signed * 42_000 * 0.12;
        const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return `${roi.toFixed(0)}%`;
      },
    },
    {
      label: 'Digital ROI',
      compute: (cases) => {
        const n       = cases.length;
        const spend   = splitByChannel(syntheticSpendMTD(n))['Digital'];
        const signed  = syntheticSigned(leadsByChannel(syntheticLeads(n))['Digital']);
        const revenue = signed * 42_000 * 0.12;
        const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return `${roi.toFixed(0)}%`;
      },
    },
    {
      label: 'Referral ROI',
      compute: (cases) => {
        const n       = cases.length;
        const spend   = splitByChannel(syntheticSpendMTD(n))['Referral'];
        const signed  = syntheticSigned(leadsByChannel(syntheticLeads(n))['Referral']);
        const revenue = signed * 42_000 * 0.12;
        const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return `${roi.toFixed(0)}%`;
      },
    },
    {
      label: 'YTD Spend',
      compute: (cases) => {
        const n = cases.length;
        // ~5 months YTD
        const ytd = Math.round(syntheticSpendMTD(n) * 5 * (0.92 + seed(n + 5) * 0.16));
        return `$${(ytd / 1_000).toFixed(0)}k`;
      },
    },
    {
      label: 'YTD Revenue (Fees)',
      compute: (cases) => {
        const n      = cases.length;
        const signed = syntheticSigned(syntheticLeads(n)) * 5;
        const rev    = signed * 42_000 * 0.12;
        return `$${(rev / 1_000).toFixed(0)}k`;
      },
    },
  ],

  charts: [
    {
      title: 'ROI by Channel',
      type: 'bar',
      getData: (cases) => {
        const n = cases.length;
        const spendSplit = splitByChannel(syntheticSpendMTD(n));
        const leadsSplit = leadsByChannel(syntheticLeads(n));
        return CHANNELS.map((ch) => {
          const spend   = spendSplit[ch];
          const signed  = syntheticSigned(leadsSplit[ch]);
          const revenue = signed * 42_000 * 0.12;
          const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
          return { channel: ch, roi: parseFloat(roi.toFixed(1)) };
        });
      },
      series: [{ dataKey: 'roi', color: ACCENT, name: 'ROI (%)' }],
      xAxisKey: 'channel',
    },
    {
      title: 'Monthly ROI Trend (Overall)',
      subtitle: 'Last 6 months',
      type: 'line',
      getData: (cases) => {
        const n = cases.length;
        return MONTHS.map((month, i) => {
          const spend   = Math.round(n * 400 * (0.75 + seed(n + i + 70) * 0.5));
          const signed  = Math.round(n * 0.55 * (0.8  + seed(n + i + 80) * 0.4));
          const revenue = signed * 42_000 * 0.12;
          const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
          return { month, roi: parseFloat(roi.toFixed(1)) };
        });
      },
      series: [{ dataKey: 'roi', color: ACCENT, name: 'ROI (%)' }],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'ROI by Channel / Campaign',
    keyField: 'key',
    maxRows: 12,
    columns: [
      { key: 'name',    label: 'Campaign / Channel', sortable: true },
      { key: 'channel', label: 'Channel',             sortable: true },
      { key: 'spend',   label: 'Spend MTD ($)',        sortable: true },
      { key: 'revenue', label: 'Est. Revenue ($)',     sortable: true },
      { key: 'roi',     label: 'ROI (%)',               sortable: true },
      { key: 'signed',  label: 'Signed Cases',          sortable: true },
    ],
    getData: (cases) => {
      const n = cases.length;
      const totalSpend = syntheticSpendMTD(n);
      const totalLeads = syntheticLeads(n);

      // Campaign rows
      const campaignRows = CAMPAIGNS.map((c, i) => {
        const leads   = Math.round(totalLeads * (0.08 + seed(n + i + 30) * 0.22));
        const spend   = Math.round(totalSpend * (0.08 + seed(n + i + 40) * 0.22));
        const signed  = syntheticSigned(leads);
        const revenue = Math.round(signed * 42_000 * 0.12);
        const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return {
          key:     c.name,
          name:    c.name,
          channel: c.channel,
          spend:   spend.toLocaleString(),
          revenue: revenue.toLocaleString(),
          roi:     `${roi.toFixed(1)}%`,
          signed,
        };
      });

      // Channel summary rows
      const spendSplit = splitByChannel(totalSpend);
      const leadsSplit = leadsByChannel(totalLeads);
      const channelRows = CHANNELS.map((ch) => {
        const spend   = spendSplit[ch];
        const signed  = syntheticSigned(leadsSplit[ch]);
        const revenue = Math.round(signed * 42_000 * 0.12);
        const roi     = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
        return {
          key:     `__channel__${ch}`,
          name:    `[${ch} Total]`,
          channel: ch,
          spend:   spend.toLocaleString(),
          revenue: revenue.toLocaleString(),
          roi:     `${roi.toFixed(1)}%`,
          signed,
        };
      });

      return [...campaignRows, ...channelRows];
    },
  },
};

// ── Export ────────────────────────────────────────────────────────────────

export const legalMarketingPages: DeptPageConfig[] = [
  dashboardPage,
  campaignsPage,
  leadsBySourcePage,
  costPerCasePage,
  roiPage,
];
