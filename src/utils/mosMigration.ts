import { loadGenericSection, saveGenericSection } from './db.ts';
import type { MeetingDef, MosMetricDefsData } from '../types/mos.ts';
import { MEETINGS } from '../data/mosMeetings.ts';

/** Bump this to force a re-seed from hardcoded MEETINGS data. */
const SEED_VERSION = 3;

/**
 * Version-gated migration: seeds mos-metric-defs from hardcoded MEETINGS.
 * When SEED_VERSION exceeds the stored version, all metric defs and weekly
 * cell data are wiped and re-seeded from the latest hardcoded data.
 */
export async function ensureMosMigration(): Promise<MeetingDef[]> {
  // Check if already at current version
  const existing = await loadGenericSection<MosMetricDefsData>('mos-metric-defs');
  if (existing?.version && existing.version >= SEED_VERSION) {
    return existing.meetings;
  }

  // Build meetings with UIDs
  const meetings: MeetingDef[] = MEETINGS.map(m => ({
    id: m.id,
    label: m.label,
    title: m.title,
    subtitle: m.subtitle,
    metrics: m.metrics.map((metric, idx) => ({
      uid: crypto.randomUUID(),
      responsible: metric.responsible,
      metric: metric.metric,
      kpi: metric.kpi,
      isRock: metric.isRock,
      isSection: metric.isSection,
      order: idx,
    })),
  }));

  // Fresh start — clear all weekly cell data
  await saveGenericSection('mos-kpi-scorecard', {});

  // Save migrated metric defs with version
  await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
    meetings,
    migrated: true,
    version: SEED_VERSION,
  });

  return meetings;
}
