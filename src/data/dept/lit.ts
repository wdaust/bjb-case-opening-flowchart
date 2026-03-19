// ── Litigation Department Page Configs ───────────────────────────────────
// 6 pages: Dashboard, Case Opening, Discovery, Expert & Depo, Arb/Med, Trial

import type { DeptPageConfig } from './types';
import { type LitCase } from '../mockData';

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const fmt$ = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');

// ── Shared constants ─────────────────────────────────────────────────────
const DEPTID = 'lit';
const DEPT_LABEL = 'Litigation';
const ACCENT = '#ef4444';

const isLit = (c: LitCase) => c.parentStage === 'lit';

// Current month/year helpers
const now = new Date();
const thisMonth = now.getMonth();
const thisYear = now.getFullYear();
const isThisMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
};

// SOL within N days
const solWithinDays = (cases: LitCase[], days: number) =>
  cases.filter(c =>
    c.deadlines.some(d => {
      if (d.type !== 'SOL') return false;
      const diff = (new Date(d.date).getTime() - Date.now()) / 86400000;
      return diff >= 0 && diff <= days;
    })
  ).length;

// ── 1. DASHBOARD ─────────────────────────────────────────────────────────
const dashboardPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'dashboard',
  title: 'Litigation Dashboard',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(isLit),

  statCards: [
    {
      label: 'Active Lit Cases',
      compute: (cases) => cases.filter(c => c.status !== 'Closed').length,
      computeDelta: (cases) => {
        const active = cases.filter(c => c.status !== 'Closed').length;
        const total = cases.length;
        const pct = total > 0 ? Math.round((active / total) * 100) : 0;
        return { value: `${pct}% of total`, type: 'neutral' };
      },
      sparkline: (cases) => {
        // count by sub-stage order
        const stages = ['lit-case-opening','lit-treatment-monitoring','lit-discovery','lit-expert-depo','lit-arb-mediation','lit-trial'];
        return stages.map(s => cases.filter(c => c.subStage === s).length);
      },
    },
    {
      label: 'Suits Filed MTD',
      compute: (cases) =>
        cases.filter(c => c.subStage === 'lit-case-opening' && isThisMonth(c.stageEntryDate)).length,
      computeDelta: (cases) => {
        const mtd = cases.filter(c => c.subStage === 'lit-case-opening' && isThisMonth(c.stageEntryDate)).length;
        return { value: mtd > 0 ? `+${mtd} this month` : 'None this month', type: mtd > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'In Discovery',
      compute: (cases) => cases.filter(c => c.subStage === 'lit-discovery').length,
      computeDelta: (cases) => {
        const overSla = cases.filter(c => c.subStage === 'lit-discovery' && daysSince(c.stageEntryDate) > c.slaTarget).length;
        return { value: `${overSla} over SLA`, type: overSla > 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Trial-Ready',
      compute: (cases) => cases.filter(c => c.subStage === 'lit-trial').length,
      computeDelta: (cases) => {
        const thisMonthTrials = cases.filter(c => c.subStage === 'lit-trial' && c.deadlines.some(d => d.type === 'trial' && isThisMonth(d.date))).length;
        return { value: `${thisMonthTrials} scheduled this month`, type: thisMonthTrials > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'Win Rate',
      compute: (cases) => {
        const closed = cases.filter(c => c.status === 'Closed' || c.status === 'Settled' || c.status === 'Verdict');
        if (closed.length === 0) return 'N/A';
        const wins = closed.filter(c => c.riskFlags.length === 0 || c.status === 'Settled').length;
        return `${Math.round((wins / closed.length) * 100)}%`;
      },
      computeDelta: (cases) => {
        const closed = cases.filter(c => c.status === 'Closed' || c.status === 'Settled' || c.status === 'Verdict');
        const wins = closed.filter(c => c.riskFlags.length === 0 || c.status === 'Settled').length;
        const rate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
        return { value: rate >= 70 ? 'Above target' : 'Below target', type: rate >= 70 ? 'positive' : 'negative' };
      },
    },
  ],

  charts: [
    {
      title: 'Cases by Lit Sub-Stage',
      subtitle: 'Current distribution across litigation pipeline',
      type: 'pie',
      getData: (cases) => [
        { name: 'Case Opening',          value: cases.filter(c => c.subStage === 'lit-case-opening').length },
        { name: 'Treatment Monitoring',  value: cases.filter(c => c.subStage === 'lit-treatment-monitoring').length },
        { name: 'Discovery',             value: cases.filter(c => c.subStage === 'lit-discovery').length },
        { name: 'Expert & Depo',         value: cases.filter(c => c.subStage === 'lit-expert-depo').length },
        { name: 'Arb/Mediation',         value: cases.filter(c => c.subStage === 'lit-arb-mediation').length },
        { name: 'Trial',                 value: cases.filter(c => c.subStage === 'lit-trial').length },
      ],
      series: [
        { dataKey: 'value', color: ACCENT, name: 'Cases' },
      ],
      xAxisKey: 'name',
    },
    {
      title: 'Monthly Filings (YTD)',
      subtitle: 'New lit cases opened per month this year',
      type: 'line',
      getData: (cases) => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months.slice(0, thisMonth + 1).map((month, idx) => ({
          month,
          filed: cases.filter(c => {
            const d = new Date(c.openDate);
            return d.getMonth() === idx && d.getFullYear() === thisYear;
          }).length,
        }));
      },
      series: [{ dataKey: 'filed', color: ACCENT, name: 'Cases Filed' }],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Litigation Case Overview',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',           label: 'Case ID',       sortable: true },
      { key: 'title',        label: 'Client',        sortable: true },
      { key: 'caseType',     label: 'Type',          sortable: true },
      { key: 'subStageLabel',label: 'Sub-Stage',     sortable: true },
      { key: 'attorney',     label: 'Attorney',      sortable: true },
      { key: 'venue',        label: 'Venue',         sortable: true },
      { key: 'daysInStage',  label: 'Days in Stage', sortable: true },
      { key: 'expectedValue',label: 'Exp. Value',    sortable: true },
      { key: 'nextAction',   label: 'Next Action',   sortable: false },
      { key: 'status',       label: 'Status',        sortable: true },
    ],
    getData: (cases) =>
      cases.map(c => ({
        id:            c.id,
        title:         c.title,
        caseType:      c.caseType,
        subStageLabel: c.subStage ? c.subStage.replace('lit-', '').replace(/-/g, ' ') : '—',
        attorney:      c.attorney,
        venue:         c.venue,
        daysInStage:   daysSince(c.stageEntryDate),
        expectedValue: fmt$(c.expectedValue),
        nextAction:    c.nextAction,
        status:        c.status,
      })),
  },
};

// ── 2. CASE OPENING ───────────────────────────────────────────────────────
const caseOpeningPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'case-opening',
  title: 'Lit Case Opening',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(c => c.parentStage === 'lit' && c.subStage === 'lit-case-opening'),

  statCards: [
    {
      label: 'Filed MTD',
      compute: (cases) => cases.filter(c => isThisMonth(c.stageEntryDate)).length,
      computeDelta: (cases) => {
        const n = cases.filter(c => isThisMonth(c.stageEntryDate)).length;
        return { value: n > 0 ? `+${n} this month` : 'None filed', type: n > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'In Draft',
      compute: (cases) => cases.filter(c => c.status === 'Draft' || c.status === 'Pending Filing').length,
      computeDelta: (cases) => {
        const draft = cases.filter(c => c.status === 'Draft' || c.status === 'Pending Filing').length;
        return { value: `${draft} awaiting filing`, type: draft > 5 ? 'negative' : 'neutral' };
      },
    },
    {
      label: 'Avg Days to File',
      compute: (cases) => {
        if (cases.length === 0) return '—';
        const avg = cases.reduce((sum, c) => sum + daysSince(c.openDate), 0) / cases.length;
        return `${Math.round(avg)}d`;
      },
      computeDelta: (cases) => {
        if (cases.length === 0) return { value: 'No data', type: 'neutral' };
        const avg = cases.reduce((sum, c) => sum + daysSince(c.openDate), 0) / cases.length;
        return { value: avg <= 30 ? 'Within target' : 'Above target', type: avg <= 30 ? 'positive' : 'negative' };
      },
    },
    {
      label: 'SOL Alerts (60d)',
      compute: (cases) => solWithinDays(cases, 60),
      computeDelta: (cases) => {
        const n = solWithinDays(cases, 60);
        return { value: n > 0 ? `${n} cases at risk` : 'None at risk', type: n > 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'SOL Alerts (30d)',
      compute: (cases) => solWithinDays(cases, 30),
      computeDelta: (cases) => {
        const n = solWithinDays(cases, 30);
        return { value: n > 0 ? `URGENT: ${n} cases` : 'None critical', type: n > 0 ? 'negative' : 'positive' };
      },
    },
  ],

  charts: [
    {
      title: 'New Suits by Case Type',
      subtitle: 'Distribution of cases entering litigation',
      type: 'bar',
      getData: (cases) => {
        const counts: Record<string, number> = {};
        for (const c of cases) {
          counts[c.caseType] = (counts[c.caseType] ?? 0) + 1;
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({ type, count }));
      },
      series: [{ dataKey: 'count', color: ACCENT, name: 'Cases' }],
      xAxisKey: 'type',
    },
    {
      title: 'Monthly Filings (YTD)',
      subtitle: 'New lit case openings per month',
      type: 'line',
      getData: (cases) => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months.slice(0, thisMonth + 1).map((month, idx) => ({
          month,
          filed: cases.filter(c => {
            const d = new Date(c.stageEntryDate);
            return d.getMonth() === idx && d.getFullYear() === thisYear;
          }).length,
        }));
      },
      series: [{ dataKey: 'filed', color: ACCENT, name: 'Filed' }],
      xAxisKey: 'month',
    },
  ],

  table: {
    title: 'Case Opening Pipeline',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',          label: 'Case ID',        sortable: true },
      { key: 'title',       label: 'Client',         sortable: true },
      { key: 'caseType',    label: 'Type',           sortable: true },
      { key: 'attorney',    label: 'Attorney',       sortable: true },
      { key: 'venue',       label: 'Venue',          sortable: true },
      { key: 'openDate',    label: 'Open Date',      sortable: true },
      { key: 'daysOpen',    label: 'Days Open',      sortable: true },
      { key: 'solAlert',    label: 'SOL Alert',      sortable: false },
      { key: 'status',      label: 'Status',         sortable: true },
      { key: 'nextAction',  label: 'Next Action',    sortable: false },
    ],
    getData: (cases) =>
      cases.map(c => {
        const solDeadline = c.deadlines.find(d => d.type === 'SOL');
        const solDaysLeft = solDeadline
          ? Math.floor((new Date(solDeadline.date).getTime() - Date.now()) / 86400000)
          : null;
        return {
          id:         c.id,
          title:      c.title,
          caseType:   c.caseType,
          attorney:   c.attorney,
          venue:      c.venue,
          openDate:   c.openDate,
          daysOpen:   daysSince(c.openDate),
          solAlert:   solDaysLeft !== null ? (solDaysLeft <= 30 ? `URGENT ${solDaysLeft}d` : solDaysLeft <= 60 ? `${solDaysLeft}d` : '—') : '—',
          status:     c.status,
          nextAction: c.nextAction,
        };
      }),
  },
};

// ── 3. DISCOVERY ──────────────────────────────────────────────────────────
const discoveryPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'discovery',
  title: 'Discovery',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(c => c.parentStage === 'lit' && c.subStage === 'lit-discovery'),

  statCards: [
    {
      label: 'In Discovery',
      compute: (cases) => cases.length,
      computeDelta: (cases) => {
        const overSla = cases.filter(c => daysSince(c.stageEntryDate) > c.slaTarget).length;
        return { value: `${overSla} over SLA`, type: overSla > 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Overdue Responses',
      compute: (cases) =>
        cases.filter(c => new Date(c.nextActionDue) < now && c.nextAction.toLowerCase().includes('response')).length,
      computeDelta: (cases) => {
        const overdue = cases.filter(c => new Date(c.nextActionDue) < now && c.nextAction.toLowerCase().includes('response')).length;
        return { value: overdue > 0 ? `${overdue} past due` : 'All current', type: overdue > 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Interrogatories Pending',
      compute: (cases) =>
        cases.filter(c => c.nextAction.toLowerCase().includes('interrogator')).length,
      computeDelta: (cases) => {
        const n = cases.filter(c => c.nextAction.toLowerCase().includes('interrogator')).length;
        return { value: `${n} cases with pending rogs`, type: n > 3 ? 'negative' : 'neutral' };
      },
    },
    {
      label: 'Productions Due',
      compute: (cases) =>
        cases.filter(c => c.deadlines.some(d => d.type === 'discovery' && new Date(d.date) > now && (new Date(d.date).getTime() - now.getTime()) / 86400000 <= 30)).length,
      computeDelta: (cases) => {
        const due = cases.filter(c => c.deadlines.some(d => d.type === 'discovery' && new Date(d.date) > now && (new Date(d.date).getTime() - now.getTime()) / 86400000 <= 30)).length;
        return { value: `${due} due within 30d`, type: due > 0 ? 'negative' : 'positive' };
      },
    },
  ],

  charts: [
    {
      title: 'Discovery Tasks by Type',
      subtitle: 'Breakdown of pending discovery actions',
      type: 'bar',
      getData: (cases) => {
        const buckets = [
          { label: 'Interrogatories', match: 'interrogator' },
          { label: 'Depositions',     match: 'depo' },
          { label: 'Productions',     match: 'produc' },
          { label: 'Subpoenas',       match: 'subpoena' },
          { label: 'Other',           match: '' },
        ];
        return buckets.map(b => ({
          type: b.label,
          count: b.match
            ? cases.filter(c => c.nextAction.toLowerCase().includes(b.match)).length
            : cases.filter(c => !['interrogator','depo','produc','subpoena'].some(m => c.nextAction.toLowerCase().includes(m))).length,
        }));
      },
      series: [{ dataKey: 'count', color: ACCENT, name: 'Tasks' }],
      xAxisKey: 'type',
    },
  ],

  table: {
    title: 'Discovery Tasks',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',           label: 'Case ID',        sortable: true },
      { key: 'title',        label: 'Client',         sortable: true },
      { key: 'attorney',     label: 'Attorney',       sortable: true },
      { key: 'venue',        label: 'Venue',          sortable: true },
      { key: 'daysInStage',  label: 'Days in Disc.',  sortable: true },
      { key: 'nextAction',   label: 'Next Action',    sortable: false },
      { key: 'nextActionDue',label: 'Due Date',       sortable: true },
      { key: 'nextActionOwner', label: 'Owner',       sortable: true },
      { key: 'discDeadline', label: 'Disc. Deadline', sortable: true },
      { key: 'status',       label: 'Status',         sortable: true },
    ],
    getData: (cases) =>
      cases.map(c => {
        const discDeadline = c.deadlines.find(d => d.type === 'discovery');
        return {
          id:              c.id,
          title:           c.title,
          attorney:        c.attorney,
          venue:           c.venue,
          daysInStage:     daysSince(c.stageEntryDate),
          nextAction:      c.nextAction,
          nextActionDue:   c.nextActionDue,
          nextActionOwner: c.nextActionOwner,
          discDeadline:    discDeadline ? discDeadline.date : '—',
          status:          c.status,
        };
      }),
  },
};

// ── 4. EXPERT & DEPO ──────────────────────────────────────────────────────
const expertDepoPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'expert-depo',
  title: 'Expert & Deposition',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(c => c.parentStage === 'lit' && c.subStage === 'lit-expert-depo'),

  statCards: [
    {
      label: 'Depos Scheduled',
      compute: (cases) =>
        cases.filter(c => c.deadlines.some(d => d.type === 'depo' && new Date(d.date) > now)).length,
      computeDelta: (cases) => {
        const thisMonthDepos = cases.filter(c => c.deadlines.some(d => d.type === 'depo' && isThisMonth(d.date))).length;
        return { value: `${thisMonthDepos} this month`, type: 'neutral' };
      },
    },
    {
      label: 'Expert Reports Pending',
      compute: (cases) =>
        cases.filter(c => c.nextAction.toLowerCase().includes('expert report') || c.nextAction.toLowerCase().includes('report due')).length,
      computeDelta: (cases) => {
        const overdue = cases.filter(c =>
          (c.nextAction.toLowerCase().includes('expert report') || c.nextAction.toLowerCase().includes('report due'))
          && new Date(c.nextActionDue) < now
        ).length;
        return { value: `${overdue} overdue`, type: overdue > 0 ? 'negative' : 'positive' };
      },
    },
    {
      label: 'Expert Costs MTD',
      compute: (cases) => {
        const total = cases
          .filter(c => isThisMonth(c.stageEntryDate) || isThisMonth(c.lastActivityDate))
          .reduce((sum, c) => sum + c.hardCostsRemaining, 0);
        return fmt$(total);
      },
      computeDelta: (cases) => {
        const total = cases.reduce((sum, c) => sum + c.hardCostsRemaining, 0);
        return { value: `${fmt$(total)} total costs`, type: total > 500000 ? 'negative' : 'neutral' };
      },
    },
    {
      label: 'Experts Retained',
      compute: (cases) =>
        cases.filter(c =>
          c.gateChecklist.some(g => g.name.toLowerCase().includes('expert') && g.completed)
        ).length,
      computeDelta: (cases) => {
        const notRetained = cases.filter(c =>
          !c.gateChecklist.some(g => g.name.toLowerCase().includes('expert') && g.completed)
        ).length;
        return { value: `${notRetained} not yet retained`, type: notRetained > 0 ? 'negative' : 'positive' };
      },
    },
  ],

  charts: [
    {
      title: 'Expert Costs by Case Type',
      subtitle: 'Hard costs remaining per case type',
      type: 'bar',
      getData: (cases) => {
        const costs: Record<string, number> = {};
        for (const c of cases) {
          costs[c.caseType] = (costs[c.caseType] ?? 0) + c.hardCostsRemaining;
        }
        return Object.entries(costs)
          .sort((a, b) => b[1] - a[1])
          .map(([type, cost]) => ({ type, cost: Math.round(cost) }));
      },
      series: [{ dataKey: 'cost', color: ACCENT, name: 'Hard Costs ($)' }],
      xAxisKey: 'type',
    },
  ],

  table: {
    title: 'Expert & Deposition Schedule',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',            label: 'Case ID',         sortable: true },
      { key: 'title',         label: 'Client',          sortable: true },
      { key: 'caseType',      label: 'Type',            sortable: true },
      { key: 'attorney',      label: 'Attorney',        sortable: true },
      { key: 'daysInStage',   label: 'Days in Stage',   sortable: true },
      { key: 'depoDate',      label: 'Next Depo Date',  sortable: true },
      { key: 'expertDeadline',label: 'Expert Deadline', sortable: true },
      { key: 'hardCosts',     label: 'Hard Costs',      sortable: true },
      { key: 'nextAction',    label: 'Next Action',     sortable: false },
      { key: 'status',        label: 'Status',          sortable: true },
    ],
    getData: (cases) =>
      cases.map(c => {
        const nextDepo    = c.deadlines.find(d => d.type === 'depo' && new Date(d.date) > now);
        const expertDL    = c.deadlines.find(d => d.type === 'expert');
        return {
          id:             c.id,
          title:          c.title,
          caseType:       c.caseType,
          attorney:       c.attorney,
          daysInStage:    daysSince(c.stageEntryDate),
          depoDate:       nextDepo    ? nextDepo.date    : '—',
          expertDeadline: expertDL   ? expertDL.date    : '—',
          hardCosts:      fmt$(c.hardCostsRemaining),
          nextAction:     c.nextAction,
          status:         c.status,
        };
      }),
  },
};

// ── 5. ARB / MEDIATION ────────────────────────────────────────────────────
const arbMedPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'arb-med',
  title: 'Arbitration & Mediation',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(c => c.parentStage === 'lit' && c.subStage === 'lit-arb-mediation'),

  statCards: [
    {
      label: 'Mediations Scheduled',
      compute: (cases) =>
        cases.filter(c => c.deadlines.some(d => d.type === 'court' && new Date(d.date) > now)).length,
      computeDelta: (cases) => {
        const next30 = cases.filter(c => c.deadlines.some(d => d.type === 'court' && (new Date(d.date).getTime() - now.getTime()) / 86400000 <= 30 && new Date(d.date) > now)).length;
        return { value: `${next30} in next 30d`, type: next30 > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'Completed MTD',
      compute: (cases) =>
        cases.filter(c => (c.status === 'Settled' || c.status === 'Closed') && isThisMonth(c.lastActivityDate)).length,
      computeDelta: (cases) => {
        const n = cases.filter(c => (c.status === 'Settled' || c.status === 'Closed') && isThisMonth(c.lastActivityDate)).length;
        return { value: `${n} resolved this month`, type: n > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'Settlement Rate',
      compute: (cases) => {
        const resolved = cases.filter(c => c.status === 'Settled' || c.status === 'Closed' || c.status === 'Verdict');
        if (resolved.length === 0) return 'N/A';
        const settled = resolved.filter(c => c.status === 'Settled').length;
        return `${Math.round((settled / resolved.length) * 100)}%`;
      },
      computeDelta: (cases) => {
        const resolved = cases.filter(c => c.status === 'Settled' || c.status === 'Closed' || c.status === 'Verdict');
        const settled  = resolved.filter(c => c.status === 'Settled').length;
        const rate = resolved.length > 0 ? Math.round((settled / resolved.length) * 100) : 0;
        return { value: rate >= 80 ? 'Above target' : 'Below target', type: rate >= 80 ? 'positive' : 'negative' };
      },
    },
    {
      label: 'Avg Med. Settlement',
      compute: (cases) => {
        const settled = cases.filter(c => c.status === 'Settled' && c.expectedValue > 0);
        if (settled.length === 0) return 'N/A';
        const avg = settled.reduce((s, c) => s + c.expectedValue, 0) / settled.length;
        return fmt$(avg);
      },
      computeDelta: (cases) => {
        const settled = cases.filter(c => c.status === 'Settled' && c.expectedValue > 0);
        const avg = settled.length > 0 ? settled.reduce((s, c) => s + c.expectedValue, 0) / settled.length : 0;
        const totalEv = cases.length > 0 ? cases.reduce((s, c) => s + c.expectedValue, 0) / cases.length : 0;
        const pct = totalEv > 0 ? Math.round((avg / totalEv) * 100) : 0;
        return { value: `${pct}% of avg EV`, type: pct >= 90 ? 'positive' : pct >= 70 ? 'neutral' : 'negative' };
      },
    },
  ],

  charts: [
    {
      title: 'Mediation Outcomes Breakdown',
      subtitle: 'Result distribution for mediation cases',
      type: 'bar',
      getData: (cases) => {
        const outcomes = ['Settled','Pending','No Agreement','Continued','Closed'];
        return outcomes.map(o => ({
          outcome: o,
          count: o === 'Pending'
            ? cases.filter(c => c.status !== 'Settled' && c.status !== 'Closed' && c.status !== 'Verdict').length
            : cases.filter(c => c.status === o).length,
        }));
      },
      series: [{ dataKey: 'count', color: ACCENT, name: 'Cases' }],
      xAxisKey: 'outcome',
    },
    {
      title: 'Demand vs Settlement (by Case)',
      subtitle: 'Exposure amount vs expected value comparison',
      type: 'line',
      getData: (cases) =>
        cases
          .slice(0, 20)
          .map((c, i) => ({
            case:       `#${i + 1}`,
            demand:     Math.round(c.exposureAmount),
            settlement: Math.round(c.expectedValue),
          })),
      series: [
        { dataKey: 'demand',     color: '#94a3b8', name: 'Demand'     },
        { dataKey: 'settlement', color: ACCENT,    name: 'Settlement' },
      ],
      xAxisKey: 'case',
    },
  ],

  table: {
    title: 'Mediation Cases',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',           label: 'Case ID',       sortable: true },
      { key: 'title',        label: 'Client',        sortable: true },
      { key: 'caseType',     label: 'Type',          sortable: true },
      { key: 'attorney',     label: 'Attorney',      sortable: true },
      { key: 'venue',        label: 'Venue',         sortable: true },
      { key: 'medDate',      label: 'Med. Date',     sortable: true },
      { key: 'exposureAmt',  label: 'Demand',        sortable: true },
      { key: 'expectedValue',label: 'Exp. Value',    sortable: true },
      { key: 'status',       label: 'Status',        sortable: true },
      { key: 'nextAction',   label: 'Next Action',   sortable: false },
    ],
    getData: (cases) =>
      cases.map(c => {
        const medDeadline = c.deadlines.find(d => d.type === 'court');
        return {
          id:            c.id,
          title:         c.title,
          caseType:      c.caseType,
          attorney:      c.attorney,
          venue:         c.venue,
          medDate:       medDeadline ? medDeadline.date : '—',
          exposureAmt:   fmt$(c.exposureAmount),
          expectedValue: fmt$(c.expectedValue),
          status:        c.status,
          nextAction:    c.nextAction,
        };
      }),
  },
};

// ── 6. TRIAL ──────────────────────────────────────────────────────────────
const trialPage: DeptPageConfig = {
  deptId: DEPTID,
  pageId: 'trial',
  title: 'Trial',
  deptLabel: DEPT_LABEL,
  accentColor: ACCENT,

  filterCases: (cases) => cases.filter(c => c.parentStage === 'lit' && c.subStage === 'lit-trial'),

  statCards: [
    {
      label: 'Cases Set for Trial',
      compute: (cases) =>
        cases.filter(c => c.deadlines.some(d => d.type === 'trial')).length,
      computeDelta: (cases) => {
        const active = cases.filter(c => c.status !== 'Closed' && c.status !== 'Settled').length;
        return { value: `${active} active`, type: 'neutral' };
      },
    },
    {
      label: 'Trials This Month',
      compute: (cases) =>
        cases.filter(c => c.deadlines.some(d => d.type === 'trial' && isThisMonth(d.date))).length,
      computeDelta: (cases) => {
        const n = cases.filter(c => c.deadlines.some(d => d.type === 'trial' && isThisMonth(d.date))).length;
        return { value: n > 0 ? `${n} on calendar` : 'None scheduled', type: n > 0 ? 'positive' : 'neutral' };
      },
    },
    {
      label: 'Continuances YTD',
      compute: (cases) =>
        cases.filter(c => c.riskFlags.some(f => f.toLowerCase().includes('continu'))).length,
      computeDelta: (cases) => {
        const n = cases.filter(c => c.riskFlags.some(f => f.toLowerCase().includes('continu'))).length;
        return { value: `${n} cases continued`, type: n > 3 ? 'negative' : 'neutral' };
      },
    },
    {
      label: 'Avg Verdict',
      compute: (cases) => {
        const verdicts = cases.filter(c => c.status === 'Verdict' && c.expectedValue > 0);
        if (verdicts.length === 0) return 'N/A';
        const avg = verdicts.reduce((s, c) => s + c.expectedValue, 0) / verdicts.length;
        return fmt$(avg);
      },
      computeDelta: (cases) => {
        const verdicts = cases.filter(c => c.status === 'Verdict' && c.exposureAmount > 0);
        if (verdicts.length === 0) return { value: 'No verdict data', type: 'neutral' };
        const avgVerdict  = verdicts.reduce((s, c) => s + c.expectedValue, 0) / verdicts.length;
        const avgDemand   = verdicts.reduce((s, c) => s + c.exposureAmount, 0) / verdicts.length;
        const pct = avgDemand > 0 ? Math.round((avgVerdict / avgDemand) * 100) : 0;
        return { value: `${pct}% of demand`, type: pct >= 80 ? 'positive' : pct >= 50 ? 'neutral' : 'negative' };
      },
    },
    {
      label: 'Win Rate',
      compute: (cases) => {
        const resolved = cases.filter(c => c.status === 'Verdict' || c.status === 'Settled');
        if (resolved.length === 0) return 'N/A';
        const wins = resolved.filter(c => c.riskFlags.length === 0 || c.status === 'Settled').length;
        return `${Math.round((wins / resolved.length) * 100)}%`;
      },
      computeDelta: (cases) => {
        const resolved = cases.filter(c => c.status === 'Verdict' || c.status === 'Settled');
        const wins = resolved.filter(c => c.riskFlags.length === 0 || c.status === 'Settled').length;
        const rate = resolved.length > 0 ? Math.round((wins / resolved.length) * 100) : 0;
        return { value: rate >= 70 ? 'Above target' : 'Below target', type: rate >= 70 ? 'positive' : 'negative' };
      },
    },
  ],

  charts: [
    {
      title: 'Verdicts vs Settlements',
      subtitle: 'Trial resolution breakdown',
      type: 'bar',
      getData: (cases) => {
        const results = [
          { outcome: 'Verdict Win',   count: cases.filter(c => c.status === 'Verdict' && c.riskFlags.length === 0).length },
          { outcome: 'Verdict Loss',  count: cases.filter(c => c.status === 'Verdict' && c.riskFlags.length > 0).length },
          { outcome: 'Settled',       count: cases.filter(c => c.status === 'Settled').length },
          { outcome: 'Pending Trial', count: cases.filter(c => c.status !== 'Verdict' && c.status !== 'Settled' && c.status !== 'Closed').length },
          { outcome: 'Continued',     count: cases.filter(c => c.riskFlags.some(f => f.toLowerCase().includes('continu'))).length },
        ];
        return results;
      },
      series: [{ dataKey: 'count', color: ACCENT, name: 'Cases' }],
      xAxisKey: 'outcome',
    },
  ],

  table: {
    title: 'Trial Calendar',
    keyField: 'id',
    maxRows: 50,
    columns: [
      { key: 'id',           label: 'Case ID',       sortable: true },
      { key: 'title',        label: 'Client',        sortable: true },
      { key: 'caseType',     label: 'Type',          sortable: true },
      { key: 'attorney',     label: 'Attorney',      sortable: true },
      { key: 'venue',        label: 'Venue',         sortable: true },
      { key: 'trialDate',    label: 'Trial Date',    sortable: true },
      { key: 'exposureAmt',  label: 'Demand',        sortable: true },
      { key: 'expectedValue',label: 'Exp. Value',    sortable: true },
      { key: 'riskFlags',    label: 'Risk Flags',    sortable: false },
      { key: 'status',       label: 'Status',        sortable: true },
    ],
    getData: (cases) =>
      cases.map(c => {
        const trialDeadline = c.deadlines.find(d => d.type === 'trial');
        return {
          id:            c.id,
          title:         c.title,
          caseType:      c.caseType,
          attorney:      c.attorney,
          venue:         c.venue,
          trialDate:     trialDeadline ? trialDeadline.date : '—',
          exposureAmt:   fmt$(c.exposureAmount),
          expectedValue: fmt$(c.expectedValue),
          riskFlags:     c.riskFlags.length > 0 ? c.riskFlags.join(', ') : 'None',
          status:        c.status,
        };
      }),
  },
};

// ── Export ────────────────────────────────────────────────────────────────
export const litPages: DeptPageConfig[] = [
  dashboardPage,
  caseOpeningPage,
  discoveryPage,
  expertDepoPage,
  arbMedPage,
  trialPage,
];
