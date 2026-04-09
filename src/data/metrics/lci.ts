/**
 * Real-data LCI engine — extracted from lciEngineReal.ts.
 * Re-exports everything from the original for backward compatibility.
 */
export {
  computeRealLCI,
  computeAttorneyMetrics,
  getRealEscalations,
  getRedAmberMetrics,
  computeStageLCI,
  REAL_LAYER_DEFINITIONS,
  LAYER_METRICS,
  type LCIBand,
  type LayerMetric,
  type LayerScore,
  type LCIResult,
  type AttorneyLCIRow,
  type AlertMetric,
  type EscalationItem,
  type RealLCIInput,
  type StageLCIRow,
  type StageLCIResult,
} from '../lciEngineReal';
