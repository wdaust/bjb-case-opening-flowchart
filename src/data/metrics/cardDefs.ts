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
    'Avg Days to Service': identity,
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
    'Avg Days Overdue': (row) => {
      if (!formABucket(String(row._groupingLabel ?? '')).startsWith('Form A Overdue')) return false;
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num >= 60;
    },
  },
  formC: {
    'Need Motion': (row) => formCBucket(String(row._groupingLabel ?? '')) === 'Need to File Motion',
    'Need 10-Day Letter': (row) => formCBucket(String(row._groupingLabel ?? '')) === 'Need a 10-Day Letter',
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
  'Total Unfiled': 'Count of complaints assigned but not yet filed.',
  'Overdue >14d': 'Complaints past the 14-day SLA target.',
  'Avg Days Assigned': 'Average days since assignment to litigation unit.',
  'Blockers': 'Cases with a documented blocker preventing filing. Sub-metrics show aging breakdown.',
  'Past-Due Items': 'Service items that are past due for completion.',
  'Avg Days to Service': 'Average number of days to complete service (from 30-day service report).',
  'Culpable Defendants Not Served': 'Placeholder for v2.0 — culpable defendants not yet served.',
  'Active Defendants': 'Defendants marked as active in the case.',
  'Missing Answers': 'Defendants who have not filed an answer.',
  'Defaults Entered': 'Cases where a default judgment has been entered against a defendant.',
  'Overdue': 'Form A rows ≥60 days since answer (SLA threshold).',
  'Approaching Due': 'Rows approaching due date, plus items SF flags as overdue but under the 60-day SLA.',
  'At Attorney Review': 'Form A sent to attorney for review but not yet served.',
  'Avg Days Overdue': 'Average days since answer for overdue Form A rows only.',
  'Need Motion': 'Form C rows where a motion to compel is needed (from SF report bucket).',
  'Need 10-Day Letter': 'Form C rows where a 10-day demand letter is needed (from SF report bucket).',
  'Pending Response': 'Form C rows where a 10-day letter is out or 60-day deadline is approaching.',
  'Within Time': 'Form C rows that are within the allowed time — no action needed.',
  'Outstanding': 'Total outstanding depositions not yet completed.',
  'Overdue 180+': 'Depositions more than 180 days from the filing date.',
  'Avg Days from Filed': 'Average days since the case was filed.',
  'Not Marked Complete': 'Depositions without a Client Deposition date — not yet marked complete.',
  'At-Risk Cases': 'Cases with DED that is past, within 30 days, or within 60 days.',
  'Past DED': 'Cases where the Discovery End Date has already passed.',
  'Within 30d': 'Cases with DED approaching within 30 days.',
  'No DED Set': 'Open litigation cases with no Discovery End Date set — a key management gap.',
};

export const STAGE_INFO: Record<StageName, string> = {
  complaints: 'Tracks unfiled complaints from the date they were assigned to the litigation unit. SLA target is 14 days.',
  service: 'Monitors past-due service items across matters. No reliable aging field exists in this report.',
  answers: 'Tracks missing answers/responses from defendants. Answer Filed is typically empty since this is a missing-answers report.',
  formA: 'Form A interrogatories — enforces a 60-day SLA: rows ≥60 days since answer are "Overdue"; SF-flagged overdue rows below 60 days are folded into "Approaching Due". Uses SF report status buckets for categorization.',
  formC: 'Form C document requests — uses SF report status buckets (Need Motion, Need 10-Day Letter, Pending Response, Within Time) from a single source report.',
  depositions: 'Outstanding depositions tracked from filing date. Monitors scheduling rate and 180-day overdue threshold.',
  ded: 'Discovery End Date tracking across the open litigation portfolio. Flags past-DED cases and those approaching within 30/60 days.',
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
