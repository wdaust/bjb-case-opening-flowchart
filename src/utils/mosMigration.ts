import { loadGenericSection, saveGenericSection } from './db.ts';
import type { MeetingDef, MosMetricDefsData } from '../types/mos.ts';
import { MEETINGS } from '../data/mosMeetings.ts';

/** Bump this to force a re-seed from hardcoded MEETINGS data. */
export const SEED_VERSION = 3;

/**
 * Version-gated migration: seeds mos-metric-defs from hardcoded MEETINGS
 * the first time the app runs.
 *
 * SAFETY: only wipes `mos-kpi-scorecard` when we're actually seeding fresh
 * metric UIDs (true first-time install). If existing metric defs are present
 * but missing the `version` field (e.g. from an older save that omitted it),
 * we preserve them — just stamp them with the current version. This avoids
 * destroying user-entered weekly data when the stored shape drifts.
 */
export async function ensureMosMigration(): Promise<MeetingDef[]> {
  const existing = await loadGenericSection<MosMetricDefsData>('mos-metric-defs');

  // Already at current version — nothing to do.
  if (existing?.version && existing.version >= SEED_VERSION) {
    return existing.meetings;
  }

  // Existing meetings present but missing/stale version — keep their UIDs
  // (and therefore all linked weekly data) and just stamp the version.
  if (existing?.meetings?.length) {
    await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
      meetings: existing.meetings,
      migrated: true,
      version: SEED_VERSION,
    });
    return existing.meetings;
  }

  // Genuine first-time install: seed from hardcoded MEETINGS with fresh UIDs.
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

  // Only wipe weekly data when we're seeding brand-new metric UIDs — otherwise
  // the weekly keys (which embed the old UIDs) would be orphaned anyway.
  await saveGenericSection('mos-kpi-scorecard', {});

  await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
    meetings,
    migrated: true,
    version: SEED_VERSION,
  });

  return meetings;
}
