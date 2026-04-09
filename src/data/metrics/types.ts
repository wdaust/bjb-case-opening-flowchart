/**
 * LDN metric types and constants — extracted from ldnMetrics.ts.
 */
import type { RagColor, MetricCard, BulletGauge, ActionableIssue } from './shared';

export type StageName = 'complaints' | 'service' | 'answers' | 'formA' | 'formC' | 'depositions' | 'ded';

export interface LdnStageMetrics {
  stage: StageName;
  label: string;
  cards: MetricCard[];
  gauge: BulletGauge;
  rag: RagColor;
}

export interface LdnAttorneyScore {
  attorney: string;
  redCount: number;
  amberCount: number;
  greenCount: number;
  riskScore: number;
  totalIssues: number;
  stages: Record<StageName, LdnStageMetrics>;
  actionableText: string;
  issues: ActionableIssue[];
}

export interface LdnReportBundle {
  complaints: import('../../types/salesforce').ReportSummaryResponse | null;
  service: import('../../types/salesforce').ReportSummaryResponse | null;
  answers: import('../../types/salesforce').ReportSummaryResponse | null;
  formA: import('../../types/salesforce').ReportSummaryResponse | null;
  formC: import('../../types/salesforce').ReportSummaryResponse | null;
  deps: import('../../types/salesforce').ReportSummaryResponse | null;
  tenDay: import('../../types/salesforce').ReportSummaryResponse | null;
  motions: import('../../types/salesforce').ReportSummaryResponse | null;
  openLit: import('../../types/salesforce').ReportSummaryResponse | null;
  service30Day?: import('../../types/salesforce').ReportSummaryResponse | null;
}

export interface LdnStageAggregate {
  stage: StageName;
  label: string;
  totalItems: number;
  pctTimely: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
}

export type DrillRow = Record<string, unknown>;

export interface DrillColumn {
  key: string;
  label: string;
}

export const STAGE_LABELS: Record<StageName, string> = {
  complaints: 'Complaints',
  service: 'Service',
  answers: 'Defendant Answers',
  formA: 'Form A Overdue',
  formC: 'Form C',
  depositions: 'Plaintiff Deposition',
  ded: 'DED',
};

export const STAGE_ORDER: StageName[] = ['complaints', 'service', 'answers', 'formA', 'formC', 'depositions', 'ded'];

export const SLA_TARGETS: Record<StageName, number> = {
  complaints: 14,
  service: 30,
  answers: 35,
  formA: 60,
  formC: 90,
  depositions: 180,
  ded: 60,
};

// Re-export shared types
export type { RagColor, MetricCard, BulletGauge, ActionableIssue } from './shared';
