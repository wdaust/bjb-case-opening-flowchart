export type KpiType = 'number' | 'currency' | 'percent' | 'text' | 'days';
export type KpiDirection = 'above' | 'below';

export interface MetricDef {
  uid: string;
  responsible: string;
  metric: string;
  kpi: string;
  kpiType?: KpiType;
  kpiDirection?: KpiDirection;
  isRock?: boolean;
  isSection?: boolean;
  order: number;
}

export interface MeetingDef {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  metrics: MetricDef[];
}

export interface Contributor {
  username: string;
  displayName: string;
  passwordHash: string;
  active: boolean;
}

export interface MosMetricDefsData {
  meetings: MeetingDef[];
  migrated: boolean;
}

export interface MosContributorsData {
  contributors: Contributor[];
}
