import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { ensureMosMigration } from '../utils/mosMigration.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { MeetingDef, MetricDef, MosMetricDefsData } from '../types/mos.ts';
import { ScorecardTable } from './MOS.tsx';
import {
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

type WeeklyData = Record<string, string>;
type SyncStatus = '' | 'saving' | 'saved' | 'error';

function useMergeOnSave(
  sectionId: string,
  data: WeeklyData,
  changedKeys: React.MutableRefObject<Set<string>>,
  enabled: boolean,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [status, setStatus] = useState<SyncStatus>('');

  useEffect(() => {
    if (!enabled || changedKeys.current.size === 0) return;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const keysToSave = new Set(changedKeys.current);
      changedKeys.current.clear();
      try {
        const current = await loadGenericSection<WeeklyData>(sectionId) ?? {};
        for (const key of keysToSave) {
          if (data[key] !== undefined) {
            current[key] = data[key];
          }
        }
        const ok = await saveGenericSection(sectionId, current);
        setStatus(ok ? 'saved' : 'error');
        if (ok) setTimeout(() => setStatus(''), 2000);
      } catch {
        setStatus('error');
      }
    }, 1200);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), sectionId, enabled]);

  return status;
}

export default function MosEntry() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = user.role === 'admin';
  const personOverride = isAdmin ? searchParams.get('person') : null;
  const personName = personOverride ?? user.displayName;

  const [allMeetings, setAllMeetings] = useState<MeetingDef[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({});
  const [loaded, setLoaded] = useState(false);
  const changedKeysRef = useRef<Set<string>>(new Set());
  const syncStatus = useMergeOnSave('mos-kpi-scorecard', weeklyData, changedKeysRef, loaded);

  useEffect(() => {
    (async () => {
      await initDb();
      try {
        const migrated = await ensureMosMigration();
        setAllMeetings(migrated);
      } catch {
        // If migration fails, try loading directly
        const data = await loadGenericSection<MosMetricDefsData>('mos-metric-defs');
        if (data?.meetings) setAllMeetings(data.meetings);
      }
      const saved = await loadGenericSection<WeeklyData>('mos-kpi-scorecard');
      if (saved) setWeeklyData(saved);
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    changedKeysRef.current.add(key);
    setWeeklyData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Filter meetings to only those containing this person's metrics
  const filteredMeetings: MeetingDef[] = allMeetings
    .map(meeting => {
      const personMetrics = meeting.metrics.filter(
        m => m.responsible === personName || m.isSection
      );
      // Remove trailing sections with no metrics after them
      const cleaned: MetricDef[] = [];
      for (let i = 0; i < personMetrics.length; i++) {
        if (personMetrics[i].isSection) {
          // Check if there are non-section metrics after this section in the filtered list
          const hasChildren = personMetrics.slice(i + 1).some(m => !m.isSection);
          if (hasChildren) cleaned.push(personMetrics[i]);
        } else {
          cleaned.push(personMetrics[i]);
        }
      }
      if (cleaned.filter(m => !m.isSection).length === 0) return null;
      return { ...meeting, metrics: cleaned };
    })
    .filter((m): m is MeetingDef => m !== null);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        Loading your scorecard...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">MOS Entry — {personName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your weekly metrics below
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {syncStatus === 'saving' && <><Loader2 size={14} className="animate-spin" /> Saving...</>}
          {syncStatus === 'saved' && <><CheckCircle size={14} className="text-green-500" /> Saved</>}
          {syncStatus === 'error' && <><AlertCircle size={14} className="text-red-400" /> Save failed</>}
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No metrics assigned to {personName}
        </div>
      ) : (
        filteredMeetings.map(meeting => (
          <div key={meeting.id} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{meeting.label}</h2>
              <p className="text-xs text-muted-foreground">{meeting.subtitle}</p>
            </div>
            <ScorecardTable
              meeting={meeting}
              weeklyData={weeklyData}
              onCellChange={handleCellChange}
              isAdmin={false}
              onMetricUpdate={() => {}}
              onDeleteMetric={() => {}}
              allResponsibles={[]}
              onReorder={() => {}}
            />
          </div>
        ))
      )}
    </div>
  );
}
