// Expert & Deposition Stage - Metrics, KPIs, SLA Rules, Escalation Triggers & Indexes

import type { Metric, KPICategory, SLARule, EscalationTrigger } from './tmMetricsData';

// ─── New Type Definitions ───────────────────────────────────────────

export interface IndexComponent {
  name: string;
  weight: number;
  description: string;
}

export interface IndexBand {
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface IndexConfig {
  name: string;
  description: string;
  components: IndexComponent[];
  bands: IndexBand[];
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: 'warning' | 'critical';
}

export interface TrialMetric {
  id: string;
  name: string;
  target: string;
}

// ─── 1. Core Weekly Scorecard Metrics (15) ──────────────────────────

export const expMetrics: Metric[] = [
  {
    id: 'exp-m-001',
    name: 'Expert Retention Cycle Time (Median Days)',
    description: 'Discovery served → Expert retained',
    formula: 'Median(Retained date - Discovery served)',
    target: 14,
    unit: 'days',
    sla: '≤14 days',
    rag: { green: { min: 0, max: 14 }, amber: { min: 15, max: 21 }, red: { min: 22, max: 999 } },
  },
  {
    id: 'exp-m-002',
    name: 'Expert Contact Success Rate %',
    description: 'Retained within 3 attempts',
    formula: '(Retained in ≤3 attempts / Total) × 100',
    target: 85,
    unit: '%',
    sla: '≥85%',
    rag: { green: { min: 85, max: 100 }, amber: { min: 70, max: 84 }, red: { min: 0, max: 69 } },
  },
  {
    id: 'exp-m-003',
    name: 'Expert Replacement Rate %',
    description: 'Experts replaced due to unresponsiveness',
    formula: '(Replaced / Total assigned) × 100',
    target: 10,
    unit: '%',
    sla: '≤10%',
    rag: { green: { min: 0, max: 10 }, amber: { min: 11, max: 20 }, red: { min: 21, max: 100 } },
  },
  {
    id: 'exp-m-004',
    name: 'Expert Report On-Time %',
    description: 'Report received within agreed timeframe',
    formula: '(On-time reports / Total) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'exp-m-005',
    name: 'Attorney Review SLA %',
    description: 'Review completed within 7 days',
    formula: '(Reviews in ≤7d / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'exp-m-006',
    name: 'Amendment Rate %',
    description: 'Reports requiring amendment',
    formula: '(Amended / Total) × 100',
    target: 25,
    unit: '%',
    sla: '≤25%',
    rag: { green: { min: 0, max: 25 }, amber: { min: 26, max: 40 }, red: { min: 41, max: 100 } },
  },
  {
    id: 'exp-m-007',
    name: 'Amendment Cycle Time (Days)',
    description: 'Report returned → approved',
    formula: 'Median(Approval date - Return date)',
    target: 10,
    unit: 'days',
    sla: '≤10 days',
    rag: { green: { min: 0, max: 10 }, amber: { min: 11, max: 15 }, red: { min: 16, max: 999 } },
  },
  {
    id: 'exp-m-008',
    name: 'Expert Responsiveness Score',
    description: 'Difficulty rating trend (1-3 scale)',
    formula: 'Avg difficulty rating',
    target: 2,
    unit: 'score',
    sla: 'Avg ≤2',
    rag: { green: { min: 0, max: 2 }, amber: { min: 2.1, max: 2.5 }, red: { min: 2.6, max: 3 } },
  },
  {
    id: 'exp-m-009',
    name: 'IME Scheduling Compliance %',
    description: 'IME scheduled per court order timeline',
    formula: '(On-time IMEs / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'exp-m-010',
    name: 'IME Attendance Rate %',
    description: 'Client appears at IME',
    formula: '(Attended / Scheduled) × 100',
    target: 98,
    unit: '%',
    sla: '≥98%',
    rag: { green: { min: 98, max: 100 }, amber: { min: 90, max: 97 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'exp-m-011',
    name: 'Non-Party Depo Scheduled ≤75 Days %',
    description: 'Scheduled by day 75',
    formula: '(Scheduled ≤75d / Total) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'exp-m-012',
    name: 'Depo Confirmation Rate %',
    description: 'Confirmed ≥24 hrs prior',
    formula: '(Confirmed / Scheduled) × 100',
    target: 98,
    unit: '%',
    sla: '≥98%',
    rag: { green: { min: 98, max: 100 }, amber: { min: 90, max: 97 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'exp-m-013',
    name: 'Court Reporter Scheduling SLA %',
    description: 'Scheduled within 1 hr of approval',
    formula: '(On-time / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'exp-m-014',
    name: 'Expert Cost Variance %',
    description: 'Budget vs actual spend variance',
    formula: '(Abs(Actual - Budget) / Budget) × 100',
    target: 10,
    unit: '%',
    sla: '≤10%',
    rag: { green: { min: 0, max: 10 }, amber: { min: 11, max: 20 }, red: { min: 21, max: 100 } },
  },
  {
    id: 'exp-m-015',
    name: 'Expert→Settlement Movement %',
    description: 'Cases moving post-report',
    formula: '(Cases with settlement activity / Cases with reports) × 100',
    target: 60,
    unit: '%',
    sla: '≥60%',
    rag: { green: { min: 60, max: 100 }, amber: { min: 40, max: 59 }, red: { min: 0, max: 39 } },
  },
];

// ─── 2. KPI Categories (3) ──────────────────────────────────────────

export const expKPICategories: KPICategory[] = [
  {
    id: 'paralegal',
    name: 'Paralegal/Legal Asst',
    color: 'blue',
    kpis: [
      { id: 'exp-kpi-p-001', name: 'Retention cycle time compliance', definition: 'Percentage of experts retained within the 14-day SLA from discovery served date', active: true },
      { id: 'exp-kpi-p-002', name: '% retained within 3 attempts', definition: 'Proportion of experts successfully retained using 3 or fewer contact attempts', active: true },
      { id: 'exp-kpi-p-003', name: 'Follow-up cadence compliance', definition: 'Adherence to required follow-up schedule for expert outreach and report requests', active: true },
      { id: 'exp-kpi-p-004', name: 'Upload-to-review SLA %', definition: 'Percentage of expert reports uploaded to attorney review queue within 1 hour of receipt', active: true },
      { id: 'exp-kpi-p-005', name: 'IME reminder compliance %', definition: 'Percentage of IME appointments where client reminders were sent per protocol', active: true },
      { id: 'exp-kpi-p-006', name: 'Depo scheduling on-time %', definition: 'Percentage of depositions scheduled within required timeframes and deadlines', active: true },
      { id: 'exp-kpi-p-007', name: 'Replacement efficiency time', definition: 'Average time to identify and retain a replacement expert when original is unresponsive', active: true },
    ],
  },
  {
    id: 'attorney',
    name: 'Attorney',
    color: 'purple',
    kpis: [
      { id: 'exp-kpi-a-001', name: 'Expert approval turnaround time', definition: 'Median time from expert report upload to attorney approval or amendment request', active: true },
      { id: 'exp-kpi-a-002', name: '% reports approved without amendment', definition: 'Percentage of expert reports accepted on first review without requiring changes', active: true },
      { id: 'exp-kpi-a-003', name: 'Expert quality rating (1-5)', definition: 'Average quality score assigned by attorney to retained experts on a 1-5 scale', active: true },
      { id: 'exp-kpi-a-004', name: 'Strategic alignment score', definition: 'Assessment of how well expert opinions align with overall case theory and strategy', active: true },
      { id: 'exp-kpi-a-005', name: 'Post-report action lag', definition: 'Average days between expert report approval and next strategic action taken on case', active: true },
    ],
  },
  {
    id: 'management',
    name: 'Management',
    color: 'emerald',
    kpis: [
      { id: 'exp-kpi-m-001', name: 'Expert portfolio responsiveness trend', definition: 'Trending analysis of expert responsiveness scores across the retained expert portfolio', active: true },
      { id: 'exp-kpi-m-002', name: 'Cost per expert vs recovery band', definition: 'Ratio of expert costs to projected case recovery band to ensure cost-effectiveness', active: true },
      { id: 'exp-kpi-m-003', name: 'Report amendment pattern', definition: 'Trend analysis of amendment frequency and root causes across expert reports', active: true },
      { id: 'exp-kpi-m-004', name: 'Litigation leverage index improvement', definition: 'Tracking improvement in litigation leverage index scores after expert engagement', active: true },
      { id: 'exp-kpi-m-005', name: 'Report-to-settlement timing distribution', definition: 'Distribution analysis of time elapsed between expert report completion and settlement activity', active: true },
    ],
  },
];

// ─── 3. SLA Rules (~25) ─────────────────────────────────────────────

export const expSLARules: SLARule[] = [
  // Non-Party Depositions (5)
  { id: 'exp-sla-npd-001', task: 'Attorney approval of non-party depo list', slaTarget: 'By day 75 of case lifecycle', escalationTrigger: 'Not approved by day 70', escalateTo: 'Manager' },
  { id: 'exp-sla-npd-002', task: 'Notice of deposition served', slaTarget: 'Within 1 hour of attorney approval', escalationTrigger: 'Not served within 2 hours', escalateTo: 'Manager' },
  { id: 'exp-sla-npd-003', task: 'Court reporter scheduled', slaTarget: 'Within 1 hour of notice served', escalationTrigger: 'Not scheduled within 2 hours', escalateTo: 'Manager' },
  { id: 'exp-sla-npd-004', task: 'Deposition confirmation with deponent', slaTarget: '≥24 hours prior to deposition', escalationTrigger: 'Not confirmed 48 hours prior', escalateTo: 'Attorney' },
  { id: 'exp-sla-npd-005', task: 'Reschedule upon cancellation', slaTarget: 'Same business day as cancellation', escalationTrigger: 'Not rescheduled by end of day', escalateTo: 'Manager' },

  // Defendant Depositions (4)
  { id: 'exp-sla-dd-001', task: 'Defendant deposition notice served', slaTarget: 'By day 75 of case lifecycle', escalationTrigger: 'Not noticed by day 70', escalateTo: 'Attorney' },
  { id: 'exp-sla-dd-002', task: 'Court reporter and interpreter scheduled', slaTarget: 'Same day as notice served', escalationTrigger: 'Not scheduled by end of day', escalateTo: 'Manager' },
  { id: 'exp-sla-dd-003', task: 'Defendant deposition confirmation', slaTarget: '≥24 hours prior to deposition', escalationTrigger: 'Not confirmed 48 hours prior', escalateTo: 'Attorney' },
  { id: 'exp-sla-dd-004', task: 'Failure-to-appear documentation filed', slaTarget: 'Same business day as missed deposition', escalationTrigger: 'Not filed by end of day', escalateTo: 'Senior Manager' },

  // Expert Retention (5)
  { id: 'exp-sla-er-001', task: 'First expert contact attempt', slaTarget: 'By day 10 from discovery served', escalationTrigger: 'No attempt by day 8', escalateTo: 'Manager' },
  { id: 'exp-sla-er-002', task: 'Second expert contact attempt', slaTarget: 'By day 11 from discovery served', escalationTrigger: 'No second attempt within 24 hours of first', escalateTo: 'Manager' },
  { id: 'exp-sla-er-003', task: 'Third expert contact attempt', slaTarget: 'By day 11 from discovery served (end of day)', escalationTrigger: 'No third attempt same day as second', escalateTo: 'Attorney' },
  { id: 'exp-sla-er-004', task: 'Replacement expert identified', slaTarget: 'By day 11 if original unresponsive', escalationTrigger: 'No replacement identified by day 12', escalateTo: 'Senior Manager' },
  { id: 'exp-sla-er-005', task: 'IME request submitted', slaTarget: 'Within 1 hour of expert retention', escalationTrigger: 'Not submitted within 2 hours', escalateTo: 'Manager' },

  // Report Follow-Up (5)
  { id: 'exp-sla-rf-001', task: 'Initial report follow-up', slaTarget: '10 days after expert retention', escalationTrigger: 'No follow-up by day 12', escalateTo: 'Manager' },
  { id: 'exp-sla-rf-002', task: 'Subsequent follow-ups (3 attempts)', slaTarget: 'Within 48 hours of each other', escalationTrigger: 'Gap exceeds 72 hours between attempts', escalateTo: 'Manager' },
  { id: 'exp-sla-rf-003', task: 'Replacement after 4th failed attempt', slaTarget: 'Immediately after 4th failed attempt', escalationTrigger: 'No replacement action within 24 hours', escalateTo: 'Senior Manager' },
  { id: 'exp-sla-rf-004', task: 'Report uploaded to review queue', slaTarget: 'Within 1 hour of receipt', escalationTrigger: 'Not uploaded within 2 hours', escalateTo: 'Manager' },
  { id: 'exp-sla-rf-005', task: 'Attorney review completed', slaTarget: '≤7 days from upload', escalationTrigger: 'Not reviewed by day 5', escalateTo: 'Senior Manager' },

  // Amended Report (5)
  { id: 'exp-sla-ar-001', task: 'Amendment request sent to expert', slaTarget: 'Immediately upon attorney request', escalationTrigger: 'Not sent within 1 hour', escalateTo: 'Manager' },
  { id: 'exp-sla-ar-002', task: 'Amendment follow-ups', slaTarget: 'By day 19 from original retention', escalationTrigger: 'No follow-up by day 17', escalateTo: 'Manager' },
  { id: 'exp-sla-ar-003', task: 'Amended report uploaded', slaTarget: 'Within 1 hour of receipt', escalationTrigger: 'Not uploaded within 2 hours', escalateTo: 'Manager' },
  { id: 'exp-sla-ar-004', task: 'Attorney re-review of amended report', slaTarget: '≤7 days from upload', escalationTrigger: 'Not reviewed by day 5', escalateTo: 'Senior Manager' },
  { id: 'exp-sla-ar-005', task: 'Administrative corrections applied', slaTarget: '≤3 hours from identification', escalationTrigger: 'Not corrected within 4 hours', escalateTo: 'Attorney' },
];

// ─── 4. Escalation Triggers (8) ─────────────────────────────────────

export const expEscalationTriggers: EscalationTrigger[] = [
  { id: 'exp-esc-001', condition: 'Expert not retained within 14 days of discovery served', severity: 'critical', action: 'Escalate to Senior Manager for immediate replacement and case timeline review' },
  { id: 'exp-esc-002', condition: 'Expert report more than 30 days late from agreed deadline', severity: 'critical', action: 'Escalate to Attorney and Senior Manager for expert replacement evaluation and timeline adjustment' },
  { id: 'exp-esc-003', condition: 'Amendment requested twice on the same expert report', severity: 'warning', action: 'Flag for Attorney review of expert quality and potential replacement consideration' },
  { id: 'exp-esc-004', condition: 'Client no-show at scheduled IME appointment', severity: 'critical', action: 'Immediate client contact and IME reschedule; escalate to Attorney for court compliance review' },
  { id: 'exp-esc-005', condition: 'Expert cost exceeds approved budget by more than 10%', severity: 'warning', action: 'Notify Manager for budget review and cost justification documentation' },
  { id: 'exp-esc-006', condition: 'Non-party deposition missed 75-day scheduling window', severity: 'critical', action: 'Escalate to Attorney for emergency scheduling and potential motion for extension' },
  { id: 'exp-esc-007', condition: 'Attorney review of expert report exceeds 7-day SLA', severity: 'warning', action: 'Notify Senior Manager and reassign review if attorney unavailable' },
  { id: 'exp-esc-008', condition: 'Expert unresponsive after 3 consecutive contact attempts', severity: 'warning', action: 'Initiate replacement protocol and notify Manager of expert portfolio issue' },
];

// ─── 5. Expert Performance Index (EPI) ──────────────────────────────

export const expertPerformanceIndex: IndexConfig = {
  name: 'Expert Performance Index',
  description: 'Composite score (0-100) measuring overall expert engagement quality, timeliness, cost efficiency, and downstream case impact',
  components: [
    { name: 'Retention Speed', weight: 20, description: 'How quickly experts are retained relative to the 14-day SLA target' },
    { name: 'Report Timeliness', weight: 20, description: 'Percentage of expert reports delivered within agreed-upon deadlines' },
    { name: 'Amendment Rate', weight: 15, description: 'Inverse score based on frequency of reports requiring amendments' },
    { name: 'Expert Responsiveness', weight: 15, description: 'Average difficulty rating for expert communication and follow-up' },
    { name: 'Cost Control', weight: 10, description: 'Variance between budgeted and actual expert costs' },
    { name: 'Settlement Movement', weight: 20, description: 'Proportion of cases showing settlement activity after expert report completion' },
  ],
  bands: [
    { label: 'Elite', min: 90, max: 100, color: 'green' },
    { label: 'Strong', min: 80, max: 89, color: 'blue' },
    { label: 'Watch', min: 70, max: 79, color: 'amber' },
    { label: 'Intervention Required', min: 0, max: 69, color: 'red' },
  ],
};

// ─── 6. Defense Pressure Index (DPI) ────────────────────────────────

export const defensePressureIndex: IndexConfig = {
  name: 'Defense Pressure Index',
  description: 'Composite score (0-100) measuring the level of pressure placed on the defense based on case strength, evidence quality, and litigation posture',
  components: [
    { name: 'LSI', weight: 20, description: 'Litigation Strength Index contribution reflecting overall case strength' },
    { name: 'TSI', weight: 15, description: 'Treatment Strength Index contribution reflecting medical evidence quality' },
    { name: 'Objective Proof Density', weight: 10, description: 'Concentration of objective diagnostic and documentary evidence supporting claims' },
    { name: 'Expert Report Strength', weight: 15, description: 'Quality and persuasiveness of retained expert opinions and reports' },
    { name: 'Defendant Jury Optics/Liability Risk', weight: 10, description: 'Assessment of how defendant conduct and liability facts appear to a potential jury' },
    { name: 'Discovery Compliance Score', weight: 15, description: 'Completeness and timeliness of discovery responses and document production' },
    { name: 'Case Theory Cohesion', weight: 15, description: 'Degree to which all evidence, testimony, and expert opinions support a unified case theory' },
  ],
  bands: [
    { label: 'Carrier Nervous', min: 85, max: 100, color: 'green' },
    { label: 'Strong Leverage', min: 70, max: 84, color: 'blue' },
    { label: 'Moderate', min: 55, max: 69, color: 'amber' },
    { label: 'Defense Comfortable', min: 0, max: 54, color: 'red' },
  ],
};

// ─── 7. Expert Leverage Index (ELI) ─────────────────────────────────

export const expertLeverageIndex: IndexConfig = {
  name: 'Expert Leverage Index',
  description: 'Composite score (0-100) measuring how effectively retained experts strengthen settlement leverage and trial readiness',
  components: [
    { name: 'Expert Credibility', weight: 20, description: 'Credentials, publication history, and courtroom track record of retained expert' },
    { name: 'Objective Support Alignment', weight: 15, description: 'Degree to which expert opinions are supported by objective diagnostic evidence' },
    { name: 'Causation Defensibility', weight: 15, description: 'Strength of expert causation opinion against defense challenge and cross-examination' },
    { name: 'Future Exposure Quantification', weight: 15, description: 'Clarity and defensibility of expert future damages and treatment projections' },
    { name: 'Jury Appeal', weight: 10, description: 'Expert presentation quality and ability to communicate complex concepts to lay jurors' },
    { name: 'Defense Counterattack Strength', weight: 10, description: 'Assessment of vulnerability to defense expert rebuttal and impeachment strategies' },
    { name: 'Depo Performance Quality', weight: 10, description: 'Expert performance quality during deposition testimony and cross-examination' },
    { name: 'Amendment Frequency Penalty', weight: 5, description: 'Penalty factor based on number of report amendments indicating opinion instability' },
  ],
  bands: [
    { label: 'Trial Fear', min: 90, max: 100, color: 'green' },
    { label: 'Strong Leverage', min: 75, max: 89, color: 'blue' },
    { label: 'Helpful But Limited', min: 60, max: 74, color: 'amber' },
    { label: 'Minimal Impact', min: 0, max: 59, color: 'red' },
  ],
};

// ─── 8. Defense Resistance Signals ──────────────────────────────────

export const defenseResistanceSignals: string[] = [
  'SIU Involvement',
  'Reservation of Rights',
  'Defense Counsel Aggressiveness',
  'Motion Filing Frequency',
  'Discovery Delay Tactics',
  'Depo Scheduling Resistance',
  'Surveillance Activity',
];

// ─── 9. Expert Risk Flags ───────────────────────────────────────────

export const expertRiskFlags: RiskFlag[] = [
  { id: 'exp-rf-001', label: 'Expert report late by more than 14 days', severity: 'warning' },
  { id: 'exp-rf-002', label: 'Report amended more than once', severity: 'warning' },
  { id: 'exp-rf-003', label: 'Deposition performance score ≤3', severity: 'warning' },
  { id: 'exp-rf-004', label: 'Cross-exposure vulnerability identified', severity: 'critical' },
  { id: 'exp-rf-005', label: 'Expert fee outlier vs portfolio average', severity: 'warning' },
];

// ─── 10. Trial Readiness Index (TRI) ────────────────────────────────

export const trialReadinessIndex: IndexConfig = {
  name: 'Trial Readiness Index',
  description: 'Composite score (0-100) measuring preparedness for trial across five equally weighted pillars',
  components: [
    { name: 'Case Theory Cohesion', weight: 20, description: 'Unified and defensible narrative supported by all evidence, testimony, and expert opinions' },
    { name: 'Witness & Client Stability', weight: 20, description: 'Consistency and reliability of client and witness testimony under examination pressure' },
    { name: 'Evidence Completeness', weight: 20, description: 'All required exhibits, records, and documentary evidence identified, obtained, and organized' },
    { name: 'Expert Strength & Preparedness', weight: 20, description: 'Expert qualification, opinion strength, and trial testimony preparation status' },
    { name: 'Procedural Compliance & Deadlines', weight: 20, description: 'All court deadlines, filings, and procedural requirements met without outstanding items' },
  ],
  bands: [
    { label: 'Trial Ready', min: 90, max: 100, color: 'green' },
    { label: 'Mostly Ready', min: 75, max: 89, color: 'blue' },
    { label: 'Gaps Identified', min: 60, max: 74, color: 'amber' },
    { label: 'Not Ready', min: 0, max: 59, color: 'red' },
  ],
};

// ─── 11. Trial Readiness Metrics (10) ───────────────────────────────

export const trialReadinessMetrics: TrialMetric[] = [
  { id: 'exp-trm-001', name: 'Trial Binder Completion %', target: '≥95%' },
  { id: 'exp-trm-002', name: 'Exhibit Index Accuracy %', target: '≥98%' },
  { id: 'exp-trm-003', name: 'Witness Contact Verified %', target: '100%' },
  { id: 'exp-trm-004', name: 'Subpoenas Issued On Time %', target: '≥95%' },
  { id: 'exp-trm-005', name: 'Expert Trial Prep Completed %', target: '≥95%' },
  { id: 'exp-trm-006', name: 'Client Trial Prep Completed %', target: '≥95%' },
  { id: 'exp-trm-007', name: 'Motions in Limine Filed On Time %', target: '100%' },
  { id: 'exp-trm-008', name: 'Jury Charge Draft Status', target: 'Complete ≥7 days prior' },
  { id: 'exp-trm-009', name: 'Trial Budget Variance', target: '≤10%' },
  { id: 'exp-trm-010', name: 'Compliance Deadline Risk', target: '0 overdue' },
];

// ─── 12. Trial Countdown SLA Rules (9) ──────────────────────────────

export const trialCountdownSLA: SLARule[] = [
  { id: 'exp-tc-001', task: 'Trial binder assembly started', slaTarget: '90 days before trial', escalationTrigger: 'Not started by day 85', escalateTo: 'Manager' },
  { id: 'exp-tc-002', task: 'Expert trial prep sessions initiated', slaTarget: '60 days before trial', escalationTrigger: 'Not initiated by day 55', escalateTo: 'Attorney' },
  { id: 'exp-tc-003', task: 'Witness preparation sessions initiated', slaTarget: '45 days before trial', escalationTrigger: 'Not initiated by day 40', escalateTo: 'Attorney' },
  { id: 'exp-tc-004', task: 'Motions in limine filing deadline', slaTarget: '30 days before trial', escalationTrigger: 'Not filed by day 28', escalateTo: 'Senior Manager' },
  { id: 'exp-tc-005', task: 'Final exhibit list submitted', slaTarget: '21 days before trial', escalationTrigger: 'Not submitted by day 19', escalateTo: 'Attorney' },
  { id: 'exp-tc-006', task: 'Jury charge draft completed', slaTarget: '14 days before trial', escalationTrigger: 'Not completed by day 12', escalateTo: 'Senior Manager' },
  { id: 'exp-tc-007', task: 'Pre-trial conference preparation complete', slaTarget: '7 days before trial', escalationTrigger: 'Not complete by day 6', escalateTo: 'Attorney' },
  { id: 'exp-tc-008', task: 'Final witness confirmation', slaTarget: '3 days before trial', escalationTrigger: 'Not confirmed by day 2', escalateTo: 'Senior Manager' },
  { id: 'exp-tc-009', task: 'Trial ready confirmation submitted', slaTarget: '1 day before trial', escalationTrigger: 'Not confirmed by morning of trial eve', escalateTo: 'Senior Manager' },
];

// ─── 13. Trial Risk Flags (6) ───────────────────────────────────────

export const trialRiskFlags: RiskFlag[] = [
  { id: 'exp-trf-001', label: 'Client inconsistent in testimony', severity: 'critical' },
  { id: 'exp-trf-002', label: 'Expert uncertain on causation', severity: 'critical' },
  { id: 'exp-trf-003', label: 'Missing prior imaging', severity: 'warning' },
  { id: 'exp-trf-004', label: 'Undisclosed prior claim', severity: 'critical' },
  { id: 'exp-trf-005', label: 'Defense surprise evidence', severity: 'critical' },
  { id: 'exp-trf-006', label: 'Court compliance deadline within 5 days', severity: 'warning' },
];

// ─── 14. Case Theory Integrity Checks ───────────────────────────────

export const caseTheoryIntegrityChecks: string[] = [
  'Liability theory supported by evidence',
  'Causation chain documented and defensible',
  'Damages calculation methodology verified',
  'Expert opinions consistent with case theory',
  'No contradictory evidence unaddressed',
];

// ─── 15. Client Trial Stability Factors ─────────────────────────────

export const clientTrialStabilityFactors: string[] = [
  'Emotional control under pressure',
  'Narrative consistency across depositions',
  'Cross-examination durability',
  'Social media risk profile',
  'Treatment credibility and compliance',
];

// ─── 16. Expert Trial Durability Factors ────────────────────────────

export const expertTrialDurabilityFactors: string[] = [
  'Depo transcript performance quality',
  'Cross-exposure weakness assessment',
  'Defense impeachment potential',
  'Clarity of causation testimony',
  'Jury appeal and presentation',
];
