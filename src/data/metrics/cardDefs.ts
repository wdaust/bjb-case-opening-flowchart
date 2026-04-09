/**
 * Card definitions — filters, info tooltips, drill-down column specs.
 * Extracted from ldnMetrics.ts.
 */
import { parseDate, daysSinceToday, daysFromToday, formABucket, formCBucket } from './shared';
import type { StageName, DrillRow, DrillColumn } from './types';

type CardFilterFn = (row: DrillRow) => boolean;
const identity = () => true;
const hasVal = (key: string) => (row: DrillRow) => {
  const v = row[key];
  return v != null && v !== '' && v !== '-';
};

export const CARD_FILTERS: Record<StageName, Record<string, CardFilterFn>> = {
  complaints: {
    'Total Unfiled': identity,
    'Overdue >14d': (row) => {
      const v = row['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      if (!isNaN(num)) return num > 14;
      const d = parseDate(row['Date Assigned To Litigation Unit']);
      return d ? daysSinceToday(d) > 14 : false;
    },
    'Avg Days Assigned': identity,
    'Blockers': (row) => {
      const b = row['Blocker to Filing Complaint'] ?? row['Blocker'];
      return b != null && b !== '' && b !== '-';
    },
  },
  service: {
    'Past-Due Items': identity,
    'Days to Service': identity,
    'Culpable Defendants Not Served': identity,
  },
  answers: {
    'Missing Answers': identity,
    'Defaults Entered': hasVal('Default Entered Date'),
    'Active Defendants': hasVal('Active Defendant?'),
  },
  formA: {
    'Overdue': (row) => {
      if (!formABucket(String(row._groupingLabel ?? '')).startsWith('Form A Overdue')) return false;
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num >= 60;
    },
    'Approaching Due': (row) => {
      const b = formABucket(String(row._groupingLabel ?? ''));
      if (b.includes('Days to Due Date')) return true;
      if (b.startsWith('Form A Overdue')) {
        const v = row['Answer Date to Today'];
        const num = typeof v === 'number' ? v : Number(v);
        return !isNaN(num) && num < 60;
      }
      return false;
    },
    'At Attorney Review': (row) => formABucket(String(row._groupingLabel ?? '')) === 'With Attorney for Review',
    'Days Overdue': (row) => {
      if (!formABucket(String(row._groupingLabel ?? '')).startsWith('Form A Overdue')) return false;
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num >= 60;
    },
  },
  formC: {
    'File Motion to Compel': (row) => {
      const b = formCBucket(String(row._groupingLabel ?? ''));
      const fa = row['Form A Served'];
      return b === 'Need to File Motion' && fa != null && fa !== '' && fa !== '-';
    },
    'Send 10-Day Letter': (row) => {
      const b = formCBucket(String(row._groupingLabel ?? ''));
      const fa = row['Form A Served'];
      return b === 'Need a 10-Day Letter' && fa != null && fa !== '' && fa !== '-';
    },
    'Awaiting Our Form A': (row) => {
      const b = formCBucket(String(row._groupingLabel ?? ''));
      const fa = row['Form A Served'];
      return (b === 'Need to File Motion' || b === 'Need a 10-Day Letter') && (fa == null || fa === '' || fa === '-');
    },
    'Pending Response': (row) => { const b = formCBucket(String(row._groupingLabel ?? '')); return b.startsWith('10-Day Letter Out') || b.startsWith('60 Days'); },
    'Within Time': (row) => formCBucket(String(row._groupingLabel ?? '')) === 'Within Time',
  },
  depositions: {
    'Outstanding': identity,
    'Overdue 180+': (row) => {
      const v = row['Time from Filed Date'] ?? row['Time from Filed'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num >= 180;
    },
    'Avg Days from Filed': identity,
    'Not Marked Complete': (row) => {
      const cd = row['Client Deposition'] ?? row['Client Depo Date'];
      return !cd || cd === '' || cd === '-';
    },
  },
  ded: {
    'At-Risk Cases': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      return daysFromToday(d) < 60;
    },
    'Past DED': (row) => {
      const d = parseDate(row['Discovery End Date']);
      return d ? daysFromToday(d) < 0 : false;
    },
    'Within 30d': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      const days = daysFromToday(d);
      return days >= 0 && days <= 30;
    },
    'No DED Set': (row) => !row['Discovery End Date'] || row['Discovery End Date'] === '-',
  },
};

export const CARD_INFO: Record<string, string> = {
  'Total Unfiled': 'Unique matters assigned to the litigation team but not yet filed as complaints. Count is deduplicated by matter.',
  'Overdue >14d': 'Matters where complaints have been sitting unfiled for more than 14 days — our internal SLA target.',
  'Avg Days Assigned': 'Average days since a complaint was assigned to the team. Shows how long work has been waiting.',
  'Blockers': 'Matters with a documented issue preventing complaint filing (e.g., missing records, pending authority). Aging breakdown shows how long each has been stuck.',
  'Past-Due Items': 'Matters where service of process is past due. Each matter counted once regardless of number of defendants.',
  'Days to Service': 'Median days to complete service after filing. Min and max show the full range — a single outlier won\'t skew the number.',
  'Culpable Defendants Not Served': 'Coming in v2.0 — defendants identified as culpable but not yet served.',
  'Active Defendants': 'Defendants currently marked as active in the case.',
  'Missing Answers': 'Matters where one or more defendants have not filed an answer to our complaint.',
  'Defaults Entered': 'Matters where a default judgment has been entered because a defendant failed to respond.',
  'Overdue': 'Matters where our Form A interrogatories are 60+ days past due for service — above SLA threshold.',
  'Approaching Due': 'Matters approaching their Form A due date, or flagged overdue by SF but still under our 60-day SLA.',
  'At Attorney Review': 'Form A answers sent to an attorney for review but not yet served on the defendant.',
  'Days Overdue': 'Median days overdue for Form A items past the 60-day SLA. Min and max show the full range.',
  'File Motion to Compel': 'Defendants who received our Form A, owe us Form C, and ignored our 10-day demand letter. Next step: ask the court to order compliance (R. 4:23).',
  'Send 10-Day Letter': 'Defendants who received our Form A and their Form C response is late. Next step: send a 10-day demand letter before we can move for a motion.',
  'Awaiting Our Form A': 'Defendants we can\'t chase for Form C yet because we haven\'t served our interrogatories (Form A) first. Not considered late under court rules until we serve ours.',
  'Pending Response': 'Defendants where a 10-day letter has been sent or the 60-day response window is still active. Waiting for their reply.',
  'Within Time': 'Defendants whose Form C response is not yet due — no action needed.',
  'Outstanding': 'Unique matters with depositions that haven\'t been completed yet.',
  'Overdue 180+': 'Matters with depositions outstanding for more than 180 days from the filing date.',
  'Avg Days from Filed': 'Average days since the case was filed for outstanding depositions.',
  'Not Marked Complete': 'Depositions without a completion date recorded — may need follow-up to confirm status.',
  'At-Risk Cases': 'Matters where the Discovery End Date (DED) has passed or is approaching within 60 days. Extensions must be filed promptly.',
  'Past DED': 'Matters where the Discovery End Date has already passed. Extensions must be filed or discovery closed immediately.',
  'Within 30d': 'Matters with DED approaching within 30 days — need immediate attention to request extensions if discovery isn\'t complete.',
  'No DED Set': 'Open litigation matters with no Discovery End Date on file — a gap that prevents tracking discovery deadlines.',
};

export const STAGE_INFO: Record<StageName, string> = {
  complaints: 'After a case is assigned to the litigation team, a complaint must be filed within 14 days. This stage tracks how many are still waiting and how long they\'ve been sitting.',
  service: 'Once a complaint is filed, we must serve the defendant (deliver legal papers). This tracks matters where service is past due and how quickly we typically complete it.',
  answers: 'After being served, defendants must file an answer. This tracks matters where answers are still missing and flags any defaults entered against non-responsive defendants.',
  formA: 'Form A interrogatories are written questions we serve on defendants. Our SLA is 60 days from answer date. Counts are deduplicated by matter; the "Days Overdue" card shows median with min/max range.',
  formC: 'Form C document requests follow NJ court rules: we can\'t demand the defendant\'s Form C until we\'ve served our Form A first. "Awaiting Our Form A" shows cases where the clock hasn\'t started. Only after Form A is served can we send a 10-day demand letter, then file a motion to compel.',
  depositions: 'Depositions are sworn testimony taken before trial. This tracks outstanding depositions from filing date and flags any over 180 days old.',
  ded: 'The Discovery End Date (DED) is the court-set deadline for completing all discovery. This tracks matters approaching or past their DED, plus cases missing a DED entirely.',
};

export const STAGE_DRILL_COLUMNS: Record<StageName, DrillColumn[]> = {
  complaints: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Date Assigned to Team to Today', label: 'Days Assigned' },
    { key: 'Date Assigned To Litigation Unit', label: 'Assigned Date' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Blocker to Filing Complaint', label: 'Blocker' },
    { key: 'PI Status', label: 'PI Status' },
  ],
  service: [
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Case Type', label: 'Case Type' },
    { key: 'Active Defendant?', label: 'Active?' },
    { key: 'Service complete date', label: 'Service Date' },
    { key: 'Default Entered Date', label: 'Default Date' },
  ],
  answers: [
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Default Entered Date', label: 'Default Date' },
    { key: 'Active Defendant?', label: 'Active?' },
    { key: 'Defendant Deposition', label: 'Deposition' },
  ],
  formA: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Date Form A Sent to Attorney for Review', label: 'Sent to Review' },
    { key: 'Form A Served', label: 'Served' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  formC: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Form C Received', label: 'Form C Received' },
    { key: '10 Day Letter Sent', label: '10-Day Letter' },
    { key: 'Date Motion Filed', label: 'Motion Filed' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  depositions: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Time from Filed Date', label: 'Days from Filed' },
    { key: 'Client Deposition', label: 'Client Depo' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  ded: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Case Type', label: 'Case Type' },
    { key: 'Active Stage', label: 'Stage' },
    { key: 'Discovery End Date', label: 'DED' },
    { key: 'Age in Litigation', label: 'Age (Lit)' },
    { key: 'Statute of Limitations', label: 'SOL' },
    { key: 'Matter State', label: 'State' },
  ],
};
