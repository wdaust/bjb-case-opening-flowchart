import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog.tsx';
import { saveGenericSection } from '../../utils/db.ts';
import { cn } from '../../utils/cn.ts';
import type { MeetingDef, MetricDef, MosMetricDefsData, KpiType, KpiDirection } from '../../types/mos.ts';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Loader2, CheckCircle,
} from 'lucide-react';

const KPI_TYPE_OPTIONS: { value: KpiType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: '#' },
  { value: 'currency', label: '$' },
  { value: 'percent', label: '%' },
  { value: 'days', label: 'Days' },
];

const KPI_DIR_OPTIONS: { value: KpiDirection | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'above', label: '≥' },
  { value: 'below', label: '≤' },
];

interface MetricEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetings: MeetingDef[];
  activeMeetingId: string;
  onMeetingsUpdated: (meetings: MeetingDef[]) => void;
}

export function MetricEditor({
  open,
  onOpenChange,
  meetings,
  activeMeetingId,
  onMeetingsUpdated,
}: MetricEditorProps) {
  const [editTab, setEditTab] = useState(activeMeetingId);
  const [localMetrics, setLocalMetrics] = useState<MetricDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const meeting = meetings.find(m => m.id === editTab);

  useEffect(() => {
    if (meeting) {
      setLocalMetrics(meeting.metrics.map(m => ({ ...m })));
    }
  }, [editTab, meeting]);

  useEffect(() => {
    setEditTab(activeMeetingId);
  }, [activeMeetingId]);

  const updateMetric = (idx: number, field: keyof MetricDef, value: string | boolean | number) => {
    setLocalMetrics(prev => {
      const next = [...prev];
      // Store undefined for empty kpiDirection so it serializes cleanly
      const resolved = field === 'kpiDirection' && value === '' ? undefined : value;
      next[idx] = { ...next[idx], [field]: resolved };
      return next;
    });
    setSaved(false);
  };

  const addMetric = () => {
    setLocalMetrics(prev => [
      ...prev,
      {
        uid: crypto.randomUUID(),
        responsible: '',
        metric: '',
        kpi: '',
        order: prev.length,
      },
    ]);
    setSaved(false);
  };

  const removeMetric = (idx: number) => {
    setLocalMetrics(prev => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const moveMetric = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= localMetrics.length) return;
    setLocalMetrics(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((m, i) => ({ ...m, order: i }));
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = meetings.map(m =>
      m.id === editTab ? { ...m, metrics: localMetrics.map((lm, i) => ({ ...lm, order: i })) } : m
    );
    const ok = await saveGenericSection<MosMetricDefsData>('mos-metric-defs', {
      meetings: updated,
      migrated: true,
    });
    setSaving(false);
    if (ok) {
      onMeetingsUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Metrics</DialogTitle>
        </DialogHeader>

        {/* Meeting tabs */}
        <div className="flex gap-1 border-b border-border mb-3">
          {meetings.map(m => (
            <button
              key={m.id}
              onClick={() => setEditTab(m.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors relative",
                editTab === m.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
              {editTab === m.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Metrics list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {localMetrics.map((m, idx) => (
            <div
              key={m.uid}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border text-xs",
                m.isSection ? "border-primary/30 bg-primary/5" : m.isRock ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card",
              )}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => moveMetric(idx, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={idx === 0}>
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => moveMetric(idx, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={idx === localMetrics.length - 1}>
                  <ArrowDown size={12} />
                </button>
              </div>

              {/* Fields */}
              <input
                type="text"
                value={m.responsible}
                onChange={e => updateMetric(idx, 'responsible', e.target.value)}
                placeholder="Responsible"
                className="w-[120px] shrink-0 px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
              />
              <input
                type="text"
                value={m.metric}
                onChange={e => updateMetric(idx, 'metric', e.target.value)}
                placeholder="Metric name"
                className="flex-1 min-w-0 px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
              />
              <input
                type="text"
                value={m.kpi}
                onChange={e => updateMetric(idx, 'kpi', e.target.value)}
                placeholder="KPI"
                className="w-[80px] shrink-0 px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
              />
              <select
                value={m.kpiType ?? 'text'}
                onChange={e => updateMetric(idx, 'kpiType', e.target.value as KpiType)}
                className="w-[52px] shrink-0 px-1 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                title="KPI type"
              >
                {KPI_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={m.kpiDirection ?? ''}
                onChange={e => {
                  const v = e.target.value as KpiDirection | '';
                  updateMetric(idx, 'kpiDirection', v || ('' as unknown as KpiDirection));
                }}
                className="w-[40px] shrink-0 px-1 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                title="KPI direction"
              >
                {KPI_DIR_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Toggles */}
              <label className="flex items-center gap-1 shrink-0 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!m.isSection}
                  onChange={e => updateMetric(idx, 'isSection', e.target.checked)}
                  className="accent-primary"
                />
                Sec
              </label>
              <label className="flex items-center gap-1 shrink-0 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!m.isRock}
                  onChange={e => updateMetric(idx, 'isRock', e.target.checked)}
                  className="accent-amber-500"
                />
                Rock
              </label>

              {/* Delete */}
              <button onClick={() => removeMetric(idx)} className="text-red-400 hover:text-red-300 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            onClick={addMetric}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus size={14} />
            Add Metric
          </button>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle size={14} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
