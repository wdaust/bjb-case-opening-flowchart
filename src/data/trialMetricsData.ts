// Trial Stage - Metrics, KPIs, SLA Rules, Escalation Triggers & Indexes

import type { Metric, KPICategory, SLARule, EscalationTrigger } from './tmMetricsData';

// ─── Re-export Index Types from expMetricsData ──────────────────────

export type { IndexComponent, IndexBand, IndexConfig } from './expMetricsData';
import type { IndexConfig } from './expMetricsData';

// ─── 1. Core Weekly Scorecard Metrics (14) ──────────────────────────

export const trialMetrics: Metric[] = [
  {
    id: 'trial-m-001',
    name: 'Court Notice→Calendared %',
    description: 'Percentage of court notices calendared within 1 business day',
    formula: '(Calendared within 1 day / Total notices) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 90, max: 94 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'trial-m-002',
    name: 'Trial Date in Litify %',
    description: 'Percentage of trial dates entered in Litify within 1 hour',
    formula: '(Entered within 1 hour / Total) × 100',
    target: 98,
    unit: '%',
    sla: '≥98%',
    rag: { green: { min: 98, max: 100 }, amber: { min: 95, max: 97 }, red: { min: 0, max: 94 } },
  },
  {
    id: 'trial-m-003',
    name: 'Client Trial Notice Sent %',
    description: 'Percentage of client trial notices sent within 1 hour',
    formula: '(Sent within 1 hour / Total) × 100',
    target: 99,
    unit: '%',
    sla: '≥99%',
    rag: { green: { min: 99, max: 100 }, amber: { min: 97, max: 98 }, red: { min: 0, max: 96 } },
  },
  {
    id: 'trial-m-004',
    name: 'Expert Trial Notice Sent %',
    description: 'Percentage of expert trial notices sent within 1 hour',
    formula: '(Sent within 1 hour / Total) × 100',
    target: 99,
    unit: '%',
    sla: '≥99%',
    rag: { green: { min: 99, max: 100 }, amber: { min: 97, max: 98 }, red: { min: 0, max: 96 } },
  },
  {
    id: 'trial-m-005',
    name: '30% Notebook Gate %',
    description: 'Percentage of cases reaching 30% notebook completion by 6 weeks pre-trial',
    formula: '(Cases at 30% by gate / Total) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'trial-m-006',
    name: '60% Notebook Gate %',
    description: 'Percentage of cases reaching 60% notebook completion by 4 weeks pre-trial',
    formula: '(Cases at 60% by gate / Total) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'trial-m-007',
    name: '100% Notebook Gate %',
    description: 'Percentage of cases reaching 100% notebook completion by 3 weeks pre-trial',
    formula: '(Cases at 100% by gate / Total) × 100',
    target: 92,
    unit: '%',
    sla: '≥92%',
    rag: { green: { min: 92, max: 100 }, amber: { min: 85, max: 91 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'trial-m-008',
    name: 'Expert Availability Confirmed %',
    description: 'Percentage of expert availability confirmed by 2 weeks pre-trial',
    formula: '(Confirmed / Total experts) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 90, max: 94 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'trial-m-009',
    name: 'Attorney Readiness Confirmation %',
    description: 'Percentage of attorney readiness confirmations obtained by 3 business days pre-trial',
    formula: '(Confirmed / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 90, max: 94 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'trial-m-010',
    name: 'Expert Fees Paid %',
    description: 'Percentage of expert testimony fees paid by 3 business days pre-trial',
    formula: '(Paid / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 90, max: 94 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'trial-m-011',
    name: 'Readiness Exposure (count)',
    description: 'Number of cases not trial-ready within multi-window threshold',
    formula: 'Count(cases not trial-ready)',
    target: 5,
    unit: 'count',
    sla: '≤5',
    rag: { green: { min: 0, max: 5 }, amber: { min: 6, max: 15 }, red: { min: 16, max: 999 } },
  },
  {
    id: 'trial-m-012',
    name: 'SLA Breach Aging',
    description: 'Trending analysis of SLA breach duration and frequency',
    formula: 'Trending analysis of breach duration',
    target: 0,
    unit: 'days',
    sla: 'Trending',
    rag: { green: { min: 0, max: 2 }, amber: { min: 3, max: 7 }, red: { min: 8, max: 999 } },
  },
  {
    id: 'trial-m-013',
    name: 'Automation Failure Rate %',
    description: 'Percentage of automation tasks that failed requiring manual intervention',
    formula: '(Failed automations / Total automations) × 100',
    target: 1,
    unit: '%',
    sla: '≤1%',
    rag: { green: { min: 0, max: 1 }, amber: { min: 2, max: 3 }, red: { min: 4, max: 100 } },
  },
  {
    id: 'trial-m-014',
    name: 'Next-Action Coverage %',
    description: 'Percentage of cases with a defined next action within 24 hours',
    formula: '(Cases with next action / Total active) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 90, max: 94 }, red: { min: 0, max: 89 } },
  },
];

// ─── 2. KPI Categories (4) ──────────────────────────────────────────

export const trialKPICategories: KPICategory[] = [
  {
    id: 'paralegal',
    name: 'Paralegal/Legal Asst',
    color: 'blue',
    kpis: [
      { id: 'trial-kpi-p-001', name: 'Court notice calendar compliance', definition: 'Percentage of court notices calendared within 1-business-day SLA', active: true },
      { id: 'trial-kpi-p-002', name: 'Trial date entry timeliness', definition: 'Percentage of trial dates entered in Litify within 1 hour of notice', active: true },
      { id: 'trial-kpi-p-003', name: 'Notebook gate adherence', definition: 'Percentage of pre-trial notebooks meeting 30/60/100% milestones on time', active: true },
      { id: 'trial-kpi-p-004', name: 'Expert coordination completeness', definition: 'Percentage of expert availability confirmations and fee payments completed on time', active: true },
      { id: 'trial-kpi-p-005', name: 'Pre-trial exchange thoroughness', definition: 'Completeness and quality of pre-trial exchange materials at each gate', active: true },
      { id: 'trial-kpi-p-006', name: 'Fee payment timeliness', definition: 'Percentage of expert testimony fees paid by the 3-business-day deadline', active: true },
      { id: 'trial-kpi-p-007', name: 'Trial readiness checklist completion', definition: 'Percentage of all readiness checklist items completed before trial', active: true },
    ],
  },
  {
    id: 'attorney',
    name: 'Attorney',
    color: 'purple',
    kpis: [
      { id: 'trial-kpi-a-001', name: 'Trial readiness confirmation timeliness', definition: 'Time from readiness request to attorney confirmation', active: true },
      { id: 'trial-kpi-a-002', name: 'Trial strategy preparation quality', definition: 'Assessment of trial strategy documentation completeness', active: true },
      { id: 'trial-kpi-a-003', name: 'Expert testimony coordination', definition: 'Quality of attorney coordination with experts on testimony preparation', active: true },
    ],
  },
  {
    id: 'ops-admin',
    name: 'Ops/Admin',
    color: 'emerald',
    kpis: [
      { id: 'trial-kpi-o-001', name: 'Automation reliability rate', definition: 'Percentage of automated notice tasks completing without manual intervention', active: true },
      { id: 'trial-kpi-o-002', name: 'System notification delivery rate', definition: 'Percentage of automated notifications successfully delivered', active: true },
    ],
  },
  {
    id: 'management',
    name: 'Management',
    color: 'amber',
    kpis: [
      { id: 'trial-kpi-m-001', name: 'Trial readiness pipeline health', definition: 'Trending analysis of cases moving through trial readiness gates', active: true },
      { id: 'trial-kpi-m-002', name: 'SLA breach frequency pattern', definition: 'Trend analysis of SLA breaches across trial preparation tasks', active: true },
      { id: 'trial-kpi-m-003', name: 'Resource allocation efficiency', definition: 'Assessment of paralegal and expert resource utilization during trial prep', active: true },
    ],
  },
];

// ─── 3. SLA Rules (10) ──────────────────────────────────────────────

export const trialSLARules: SLARule[] = [
  // Phase 1: Court Notice & Calendar
  { id: 'trial-sla-001', task: 'Calendar trial notice from the court', slaTarget: '1 business day from notice receipt', escalationTrigger: 'Not calendared within 2 business days', escalateTo: 'Manager' },
  { id: 'trial-sla-002', task: 'Calendar trial date in Litify', slaTarget: '1 hour from receiving trial notice', escalationTrigger: 'Not entered within 2 hours', escalateTo: 'Manager' },

  // Phase 2: Client & Expert Notice
  { id: 'trial-sla-003', task: 'Trial notice to the client (automation)', slaTarget: '1 hour from notice receipt', escalationTrigger: 'Not sent within 2 hours', escalateTo: 'Ops/Admin' },
  { id: 'trial-sla-004', task: 'Trial notice to all experts (automation)', slaTarget: '1 hour from notice receipt', escalationTrigger: 'Not sent within 2 hours', escalateTo: 'Ops/Admin' },

  // Phase 3: Trial Prep
  { id: 'trial-sla-005', task: 'Pre-trial exchange & notebook — 30% complete', slaTarget: '6 weeks before trial', escalationTrigger: 'Not at 30% by 5 weeks pre-trial', escalateTo: 'Manager' },
  { id: 'trial-sla-006', task: 'Pre-trial exchange & notebook — 60% complete', slaTarget: '4 weeks before trial', escalationTrigger: 'Not at 60% by 3 weeks pre-trial', escalateTo: 'Manager' },
  { id: 'trial-sla-007', task: 'Pre-trial exchange & notebook — 100% complete', slaTarget: '3 weeks before trial', escalationTrigger: 'Not at 100% by 2 weeks pre-trial', escalateTo: 'Senior Manager' },
  { id: 'trial-sla-008', task: 'Confirm expert availability and testimony fee', slaTarget: '2 weeks before trial', escalationTrigger: 'Not confirmed by 10 days pre-trial', escalateTo: 'Manager' },

  // Phase 4: Trial Readiness Verification
  { id: 'trial-sla-009', task: 'Confirm with Attorney we are ready for trial', slaTarget: '3 business days before trial', escalationTrigger: 'No confirmation by 2 business days pre-trial', escalateTo: 'Senior Manager' },

  // Phase 3 continued: Trial Prep
  { id: 'trial-sla-010', task: 'Pay expert testimony fees', slaTarget: '3 business days before trial', escalationTrigger: 'Fees not paid by 2 business days pre-trial', escalateTo: 'Senior Manager' },
];

// ─── 4. Escalation Triggers (5) ─────────────────────────────────────

export const trialEscalationTriggers: EscalationTrigger[] = [
  { id: 'trial-esc-001', condition: 'Trial date not calendared within 1 business day of court notice', severity: 'critical', action: 'Auto-escalate to Manager and block trial prep' },
  { id: 'trial-esc-002', condition: 'Notebook not at 100% by 2 weeks pre-trial', severity: 'critical', action: 'Escalate to Senior Manager and flag trial at risk' },
  { id: 'trial-esc-003', condition: 'Expert availability not confirmed by 10 days pre-trial', severity: 'warning', action: 'Notify Manager and initiate backup expert search' },
  { id: 'trial-esc-004', condition: 'Attorney readiness not confirmed by 2 business days pre-trial', severity: 'critical', action: 'Escalate to Senior Manager for immediate resolution' },
  { id: 'trial-esc-005', condition: 'Expert fees not paid by 2 business days pre-trial', severity: 'critical', action: 'Auto-escalate to Director' },
];

// ─── 5. Stage Health Index ──────────────────────────────────────────

export const trialStageHealthIndex: IndexConfig = {
  name: 'Stage Health Index',
  description: 'Composite score (0-100) measuring overall trial stage performance',
  components: [
    { name: 'Velocity & SLA Compliance', weight: 30, description: 'Adherence to SLA targets for notices and calendar entries' },
    { name: 'Readiness Gates', weight: 30, description: 'Progression through 30/60/100% notebook completion gates' },
    { name: 'Pressure & Enforcement', weight: 20, description: 'Expert confirmation, attorney readiness, and fee payment compliance' },
    { name: 'Inventory Health', weight: 10, description: 'Count and aging of cases not yet trial-ready' },
    { name: 'Quality & Reliability', weight: 10, description: 'Automation success rate and next-action coverage' },
  ],
  bands: [
    { label: 'Healthy', min: 85, max: 100, color: 'green' },
    { label: 'Watch', min: 70, max: 84, color: 'blue' },
    { label: 'At Risk', min: 55, max: 69, color: 'amber' },
    { label: 'Critical', min: 0, max: 54, color: 'red' },
  ],
};
