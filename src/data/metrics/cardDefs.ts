/**
 * Card definitions — filters, info tooltips, drill-down column specs, timing tooltips.
 * Extracted from ldnMetrics.ts.
 */
import { parseDate, daysSinceToday, daysFromToday, formABucket } from './shared';
import type { StageName, DrillRow, DrillColumn } from './types';

type CardFilterFn = (row: DrillRow) => boolean;
const identity = () => true;
const hasVal = (key: string) => (row: DrillRow) => {
  const v = row[key];
  return v != null && v !== '' && v !== '-';
};
const noVal = (key: string) => (row: DrillRow) => {
  const v = row[key];
  return v == null || v === '' || v === '-';
};

const answerDaysNum = (row: DrillRow): number => {
  const v = row['Answer Date to Today'];
  const num = typeof v === 'number' ? v : Number(v);
  return isNaN(num) ? 0 : num;
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
    'Untimely Answers': (row) => {
      const ans = row['Answer Filed'];
      const hasAns = ans != null && ans !== '' && ans !== '-';
      const def = row['Default Entered Date'];
      const hasDef = def != null && def !== '' && def !== '-';
      if (hasAns || hasDef) return false;
      const d = parseDate(row['Service Date Complete']);
      if (!d) return false;
      return daysSinceToday(d) >= 35;
    },
    'Defaults Filed Timely': (row) => {
      const def = row['Default Entered Date'];
      const hasDef = def != null && def !== '' && def !== '-';
      if (!hasDef) return false;
      const d = parseDate(row['Service Date Complete']);
      if (!d) return false;
      return daysSinceToday(d) <= 40;
    },
    'Defaults Remaining Untimely': (row) => {
      const ans = row['Answer Filed'];
      const hasAns = ans != null && ans !== '' && ans !== '-';
      const def = row['Default Entered Date'];
      const hasDef = def != null && def !== '' && def !== '-';
      if (hasAns || hasDef) return false;
      const d = parseDate(row['Service Date Complete']);
      if (!d) return false;
      return daysSinceToday(d) > 40;
    },
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
    '10 Day Letters Needed': (row) => {
      if (!noVal('Form C Received')(row)) return false;
      if (!hasVal('Form A Served')(row)) return false;
      // No 10-day letter sent yet
      const letter = row['10 Day Letter Sent'];
      if (letter != null && letter !== '' && letter !== '-') return false;
      return answerDaysNum(row) >= 60;
    },
    'Ready for Motion': (row) => {
      if (!noVal('Form C Received')(row)) return false;
      if (!hasVal('Form A Served')(row)) return false;
      const letterDate = parseDate(row['10 Day Letter Sent']);
      if (!letterDate || daysSinceToday(letterDate) < 10) return false;
      return noVal('Date Motion Filed')(row);
    },
    'Motions Late': (row) => {
      // Same as Ready for Motion — once motions start being filed, this diverges
      if (!noVal('Form C Received')(row)) return false;
      if (!hasVal('Form A Served')(row)) return false;
      const letterDate = parseDate(row['10 Day Letter Sent']);
      if (!letterDate || daysSinceToday(letterDate) < 10) return false;
      return noVal('Date Motion Filed')(row);
    },
    'Filed Timely': hasVal('Date Motion Filed'),
  },
  depositions: {
    'Undone 180+': (row) => {
      const cd = row['Client Deposition'] ?? row['Client Depo Date'];
      const noDepo = !cd || cd === '' || cd === '-';
      return noDepo && answerDaysNum(row) >= 180;
    },
    'Completed Timely': () => false, // disabled — no report
    'Completed Untimely': () => false, // disabled — no report
  },
  ded: {
    'Active Open Cases': (row) => {
      const v = row['Discovery End Date'];
      return v != null && v !== '' && v !== '-';
    },
    'Avg Days Past DED': (row) => {
      const d = parseDate(row['Discovery End Date']);
      return d ? daysFromToday(d) < 0 : false;
    },
    '90+ Days Past': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      const days = daysFromToday(d);
      return days < 0 && Math.abs(days) >= 90;
    },
    '180+ Days Past': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      const days = daysFromToday(d);
      return days < 0 && Math.abs(days) >= 180;
    },
  },
};

export const CARD_INFO: Record<string, string> = {
  // Complaints
  'Total Unfiled': 'Unique matters assigned to the litigation team but not yet filed as complaints. Count is deduplicated by matter.',
  'Overdue >14d': 'Matters where complaints have been sitting unfiled for more than 14 days — our internal SLA target.',
  'Avg Days Assigned': 'Average days since a complaint was assigned to the team. Shows how long work has been waiting.',
  'Blockers': 'Matters with a documented issue preventing complaint filing (e.g., missing records, pending authority). Aging breakdown shows how long each has been stuck.',
  // Service
  'Past-Due Items': 'Matters where service of process is past due. Each matter counted once regardless of number of defendants.',
  'Days to Service': 'Median days to complete service after filing. Min and max show the full range — a single outlier won\'t skew the number.',
  'Culpable Defendants Not Served': 'Coming in v2.0 — defendants identified as culpable but not yet served.',
  // Defendant Answers
  'Untimely Answers': 'Matters where no answer has been filed and no default entered, 35+ days from service. These need follow-up.',
  'Defaults Filed Timely': 'Matters where a default was entered within 40 days of service — handled promptly.',
  'Defaults Remaining Untimely': 'Matters with no answer and no default filed, 40+ days from service. These are problem cases needing immediate action.',
  // Form A
  'Overdue': 'Matters where our Form A interrogatories are 60+ days past due for service — above SLA threshold.',
  'Approaching Due': 'Matters approaching their Form A due date, or flagged overdue by SF but still under our 60-day SLA.',
  'At Attorney Review': 'Form A answers sent to an attorney for review but not yet served on the defendant.',
  'Days Overdue': 'Median days overdue for Form A items past the 60-day SLA. Min and max show the full range.',
  // Form C (new)
  '10 Day Letters Needed': 'Answer received, no Form C, Form A served, 60+ days — 10-day letter needs to be sent.',
  'Ready for Motion': 'All prerequisites met: Form A served, 10-day letter sent 10+ days ago, no motion filed yet. These are actionable NOW — file motion to compel (R. 4:23-1).',
  'Motions Late': 'Cases where motion criteria have been met but no motion has been filed. Currently mirrors "Ready for Motion" until motions start being filed.',
  'Filed Timely': 'Motions to compel that have been filed. Will populate as the team begins filing motions.',
  // Depositions (new)
  'Undone 180+': 'Depositions not completed and 180+ days past the answer date — past our SLA. The answer date (not filed date) starts the clock per NJ rules.',
  'Completed Timely': 'Depositions completed within the 180-day SLA from answer. Needs a "completed depositions" report in the SF bundle to populate.',
  'Completed Untimely': 'Depositions completed but after the 180-day SLA from answer. Needs a "completed depositions" report to populate.',
  // DED (new)
  'Active Open Cases': 'Active open litigation matters with a Discovery End Date set. Baseline count for tracking DED compliance.',
  'Avg Days Past DED': 'Average number of days past the Discovery End Date for matters whose DED has expired.',
  '90+ Days Past': 'Matters whose Discovery End Date passed 90+ days ago — extensions should have been filed.',
  '180+ Days Past': 'Matters whose Discovery End Date passed 180+ days ago — significant risk, immediate action required.',
};

export const CARD_TIMING: Record<string, string> = {
  // Defendant Answers
  'Untimely Answers':
    'Day 0: Defendant served\nDay 35+: No answer filed, no default entered\n→ Follow up or file for default',
  'Defaults Filed Timely':
    'Day 0: Defendant served\nDay ≤40: Default entered\n✓ Handled promptly',
  'Defaults Remaining Untimely':
    'Day 0: Defendant served\nDay 40+: No answer, no default\n✗ Problem case — immediate action needed',
  // Form A
  'Overdue':
    'Day 0: Answer filed\nDay 60: Form A SLA expires\n\u2192 Counts matters 60+ days past answer with Form A not served',
  'Approaching Due':
    'Day 0: Answer filed\nDay 30\u201360: Approaching Form A SLA\n\u2192 Matters nearing the 60-day deadline or flagged overdue but under SLA',
  'At Attorney Review':
    'Day 0: Answer filed\n\u2192 Form A sent to attorney for review\n\u2192 Waiting for attorney sign-off before service',
  'Days Overdue':
    'Day 0: Answer filed\nDay 60: SLA expired\nDay 60+: Median days past the 60-day SLA\n\u2192 Shows how late overdue items are',
  // Form C
  '10 Day Letters Needed':
    'Day 0: Answer filed\nDay 60+: No Form C received, Form A served\n\u2192 10-day letter needs to be sent',
  'Ready for Motion':
    'Day 0: Answer filed\n\u2192 Form A served to defendant\n\u2192 10-day letter sent\nDay +10: Letter expired, no response\n\u2192 Motion to compel can now be filed (R. 4:23-1)',
  'Motions Late':
    'Day 0: Answer filed\n\u2192 All motion prerequisites met\n\u2192 Motion should have been filed\n\u2192 Counts cases where motion is overdue',
  'Filed Timely':
    'Day 0: Answer filed\n\u2192 Prerequisites met\n\u2192 Motion to compel filed\n\u2713 Completed',
  // Depositions
  'Undone 180+':
    'Day 0: Answer filed\nDay 180: Deposition SLA expires\n\u2192 Counts depositions 180+ days past answer, not completed',
  'Completed Timely':
    'Day 0: Answer filed\nDay \u2264180: Deposition completed\n\u2713 Within SLA',
  'Completed Untimely':
    'Day 0: Answer filed\nDay >180: Deposition completed late\n\u2717 Past SLA',
  // DED
  'Active Open Cases':
    'Active open litigation matters with DED set\n\u2192 All discovery must complete by this date\n\u2192 Baseline count for DED compliance tracking',
  'Avg Days Past DED':
    'DED has passed\n\u2192 Average days elapsed since DED\n\u2192 Extensions should be filed promptly',
  '90+ Days Past':
    'DED passed 90+ days ago\n\u2192 Extensions significantly overdue\n\u2192 Amber zone — file immediately',
  '180+ Days Past':
    'DED passed 180+ days ago\n\u2192 Critical risk — court may impose sanctions\n\u2192 Red zone — immediate action required',
};

export const STAGE_INFO: Record<StageName, string> = {
  complaints: 'After a case is assigned to the litigation team, a complaint must be filed within 14 days. This stage tracks how many are still waiting and how long they\'ve been sitting.',
  service: 'Once a complaint is filed, we must serve the defendant (deliver legal papers). This tracks matters where service is past due and how quickly we typically complete it.',
  answers: 'After being served, defendants must file an answer within 35 days. This tracks untimely answers, timely defaults, and problem cases where neither has happened by day 40.',
  formA: 'Form A interrogatories are written questions we serve on defendants. Our SLA is 60 days from answer date. Counts are deduplicated by matter; the "Days Overdue" card shows median with min/max range.',
  formC: 'Form C follows the NJ discovery process (R. 4:17-4): after our Form A is served, the defendant owes Form C answers within 60 days. If overdue, we send a 10-day demand letter (R. 4:23-1), then file a motion to compel. Cards track each step of this process.',
  depositions: 'Plaintiff depositions are sworn testimony taken before trial. SLA is 180 days from the answer date (not filed date). Tracks outstanding depositions and flags those past due.',
  ded: 'The Discovery End Date (DED) is the court-set deadline for completing all discovery. Tracks how many matters have a DED, how far past it they are, and flags 90+ and 180+ day outliers.',
};

export const STAGE_DRILL_COLUMNS: Record<StageName, DrillColumn[]> = {
  complaints: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter: Matter Name', label: 'Matter Name' },
    { key: 'Date Assigned to Team to Today', label: 'Days Assigned' },
    { key: 'Date Assigned To Litigation Unit', label: 'Assigned Date' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Blocker to Filing Complaint', label: 'Blocker' },
    { key: 'PI Status', label: 'PI Status' },
  ],
  service: [
    { key: 'Matter: Matter Name', label: 'Matter Name' },
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Complaint Filed Date', label: 'Complaint Filed' },
    { key: 'Service complete date', label: 'Service Date' },
    { key: 'Age in Litigation', label: 'Age (days)' },
    { key: 'Total Liability Limits', label: 'Liability Limits' },
  ],
  answers: [
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Defendant (Party Name)', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Default Entered Date', label: 'Default Date' },
    { key: 'Active Defendant?', label: 'Active?' },
    { key: 'Defendant Deposition', label: 'Deposition' },
    { key: '_daysSinceService', label: 'Days Since Service', render: (row) => {
      const d = parseDate(row['Service Date Complete']);
      return d ? daysSinceToday(d) : '';
    }},
  ],
  formA: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant (Party Name)', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: '_daysPastSla', label: 'Days Past SLA', render: (row) => {
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? '' : num - 60;
    }},
    { key: 'Date Form A Sent to Attorney for Review', label: 'Sent to Review' },
    { key: 'Form A Served', label: 'Served' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  formC: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant (Party Name)', label: 'Defendant' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: '_daysPastSla', label: 'Days Past SLA', render: (row) => {
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? '' : num - 60;
    }},
    { key: 'Form A Served', label: 'Form A Served' },
    { key: 'Form C Received', label: 'Form C Received' },
    { key: '10 Day Letter Sent', label: '10-Day Letter' },
    { key: 'Date Motion Filed', label: 'Motion Filed' },
  ],
  depositions: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant (Party Name)', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Answer Date to Today', label: 'Days from Answer' },
    { key: '_daysPastSla', label: 'Days Past SLA', render: (row) => {
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? '' : num - 180;
    }},
    { key: 'Client Deposition', label: 'Client Depo' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  ded: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter: Matter Name', label: 'Matter Name' },
    { key: 'Case Type', label: 'Case Type' },
    { key: 'Active Stage', label: 'Stage' },
    { key: 'Discovery End Date', label: 'DED' },
    { key: '_daysToDed', label: 'Days to DED', render: (row) => {
      const d = parseDate(row['Discovery End Date']);
      return d ? daysFromToday(d) : '';
    }},
    { key: 'Age in Litigation', label: 'Age (Lit)' },
    { key: 'Statute of Limitations', label: 'SOL' },
    { key: 'Matter State', label: 'State' },
  ],
};
