// Types and constants
export * from './types';
export * from './shared';

// Stage metric functions
export { computeComplaints } from './complaints';
export { computeService } from './service';
export { computeAnswers } from './answers';
export { computeFormA } from './formA';
export { computeFormC } from './formC';
export { computeDepositions } from './depositions';
export { computeDED } from './ded';

// Attorney
export {
  buildAttorneyLookup,
  filterRowsByAttorney,
  buildFixedAttorneyLookup,
  buildAttorneyList,
  computeAllLdnMetrics,
  computeStageAggregatesFromLdn,
} from './attorney';

// Portfolio
export {
  computePortfolioGauges,
  computePortfolioStages,
  computePortfolioFromScores,
} from './portfolio';

// Escalations
export { ESCALATION_FILTERS, countOverdue } from './escalations';

// LCI
export { computeRealLCI, computeAttorneyMetrics, getRealEscalations, getRedAmberMetrics } from './lci';
export type { LCIResult, LCIBand, LayerMetric, LayerScore, AttorneyLCIRow, AlertMetric, EscalationItem, RealLCIInput } from './lci';

// Discovery Flow
export { computeDiscoveryFlow } from './discoveryFlow';
export type { DiscoveryFlowData, BlockedMatter, PipelineStage, SankeyData } from './discoveryFlow';

// Case Timing
export { computeCaseTimingStages, DEFAULT_THRESHOLDS } from './caseTiming';
export type { TimingThresholds, TimingStageResult } from './caseTiming';

// Card definitions
export { CARD_FILTERS, CARD_INFO, CARD_TIMING, STAGE_INFO, STAGE_DRILL_COLUMNS } from './cardDefs';
