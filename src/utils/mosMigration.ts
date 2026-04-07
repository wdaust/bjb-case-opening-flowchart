import { loadGenericSection, saveGenericSection } from './db.ts';
import type { MeetingDef, MosMetricDefsData } from '../types/mos.ts';
import { MEETINGS } from '../data/mosMeetings.ts';

/**
 * One-time migration: seeds mos-metric-defs from hardcoded MEETINGS,
 * and re-keys existing mos-kpi-scorecard data from index-based → UID-based keys.
 */
export async function ensureMosMigration(): Promise<MeetingDef[]> {
  // Check if already migrated
  const existing = await loadGenericSection<MosMetricDefsData>('mos-metric-defs');
  if (existing?.migrated) {
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

  // Re-key existing scorecard data from index-based to UID-based
  const oldData = await loadGenericSection<Record<string, string>>('mos-kpi-scorecard');
  if (oldData && Object.keys(oldData).length > 0) {
    const newData: Record<string, string> = {};
    for (const [key, value] of Object.entries(oldData)) {
      // Old format: meetingId:metricIndex:weekKey
      const parts = key.split(':');
      if (parts.length !== 3) {
        // Keep unknown keys as-is
        newData[key] = value;
        continue;
      }
      const [meetingId, indexStr, weekKey] = parts;
      const metricIndex = parseInt(indexStr, 10);
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting && !isNaN(metricIndex) && metricIndex < meeting.metrics.length) {
        const uid = meeting.metrics[metricIndex].uid;
        newData[`${meetingId}:${uid}:${weekKey}`] = value;
      } else {
        // Keep unmatched keys
        newData[key] = value;
      }
    }
    await saveGenericSection('mos-kpi-scorecard', newData);
  }

  // Save migrated metric defs
  await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
    meetings,
    migrated: true,
  });

  return meetings;
}
