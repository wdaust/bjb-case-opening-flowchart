import { useMemo, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { useLdnBundle } from '../data/queries/bundles';
import { STAGE_ORDER, STAGE_LABELS, type StageName, type LdnReportBundle } from '../data/metrics/types';
import {
  computeCaseTimingStages,
  DEFAULT_THRESHOLDS,
  type TimingThresholds,
  type DrillRow,
} from '../data/metrics/caseTiming';
import { cn } from '../utils/cn';

const COLORS = { green: '#22c55e', amber: '#eab308', red: '#ef4444' } as const;

/** Matter-level drill-down columns per stage (no defendant fields). */
const DRILL_COLUMNS: Record<StageName, { key: string; label: string }[]> = {
  complaints: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter' },
    { key: 'Date Assigned to Team to Today', label: 'Days Assigned' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Blocker to Filing Complaint', label: 'Blocker' },
    { key: 'PI Status', label: 'PI Status' },
  ],
  service: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter: Matter Name', label: 'Matter' },
    { key: 'Days to Service', label: 'Days to Service' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Service complete date', label: 'Service Date' },
  ],
  answers: [
    { key: 'Matter Name', label: 'Matter' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
  ],
  formA: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Form A Served', label: 'Form A Served' },
    { key: 'Date Form A Sent to Attorney for Review', label: 'Sent to Review' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  formC: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Form C Received', label: 'Form C Received' },
    { key: '10 Day Letter Sent', label: '10-Day Letter' },
    { key: 'Date Motion Filed', label: 'Motion Filed' },
  ],
  depositions: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Answer Date to Today', label: 'Days from Answer' },
    { key: 'Client Deposition', label: 'Client Depo' },
    { key: 'Client Depo Date', label: 'Client Depo Date' },
  ],
  ded: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter' },
    { key: 'Discovery End Date', label: 'DED' },
    { key: 'Active Stage', label: 'Stage' },
    { key: 'Case Type', label: 'Case Type' },
  ],
};

function ThresholdInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const display = focused ? draft : String(value);

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="number"
        min={1}
        max={999}
        value={display}
        onChange={e => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (n >= 1 && n <= 999) onChange(n);
        }}
        onFocus={e => { setFocused(true); setDraft(e.target.value); e.target.select(); }}
        onBlur={() => {
          setFocused(false);
          const n = Math.max(1, Math.min(999, Math.round(Number(draft) || value)));
          setDraft(String(n));
          onChange(n);
        }}
        className="w-14 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-xs text-foreground text-center tabular-nums"
      />
      <span>d</span>
    </label>
  );
}

type BucketKey = 'green' | 'amber' | 'red';

interface DrillState {
  stage: StageName;
  bucket: BucketKey;
}

export default function CaseTiming() {
  const {
    complaints, service, answers, formA, formC, deps, openLit, service30Day,
    loading,
  } = useLdnBundle();

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay: null, motions: null, openLit, service30Day,
  }), [complaints, service, answers, formA, formC, deps, openLit, service30Day]);

  const [thresholds, setThresholds] = useState<Record<StageName, TimingThresholds>>(
    () => ({ ...DEFAULT_THRESHOLDS }),
  );
  const [drill, setDrill] = useState<DrillState | null>(null);

  const updateThreshold = useCallback((stage: StageName, field: 'green' | 'amber', value: number) => {
    setThresholds(prev => ({
      ...prev,
      [stage]: { ...prev[stage], [field]: value },
    }));
  }, []);

  const stages = useMemo(() => computeCaseTimingStages(bundle, thresholds), [bundle, thresholds]);

  // Chart data
  const chartData = useMemo(() => stages.map(s => ({
    name: s.label,
    stage: s.stage,
    volume: s.total,
    Green: s.total ? Math.round((s.green / s.total) * 100) : 0,
    Amber: s.total ? Math.round((s.amber / s.total) * 100) : 0,
    Red: s.total ? Math.round((s.red / s.total) * 100) : 0,
    greenCount: s.green,
    amberCount: s.amber,
    redCount: s.red,
  })), [stages]);

  // Summary stats
  const summary = useMemo(() => {
    let totalGreen = 0, totalAll = 0;
    let worstPct = 100, worstStage = '';
    const stagePcts: number[] = [];

    for (const s of stages) {
      totalGreen += s.green;
      totalAll += s.total;
      const pct = s.total ? Math.round((s.green / s.total) * 100) : 100;
      stagePcts.push(pct);
      if (pct < worstPct) {
        worstPct = pct;
        worstStage = s.label;
      }
    }

    return {
      overallPct: totalAll ? Math.round((totalGreen / totalAll) * 100) : 0,
      worstStage: worstStage || 'N/A',
      worstPct,
      totalCases: totalAll,
      avgCompliance: stagePcts.length ? Math.round(stagePcts.reduce((a, b) => a + b, 0) / stagePcts.length) : 0,
    };
  }, [stages]);

  // Drill-down data — uses curated matter-level columns per stage
  const drillData = useMemo((): { rows: DrillRow[]; columns: Column<DrillRow>[]; keyField: string } | null => {
    if (!drill) return null;
    const stageResult = stages.find(s => s.stage === drill.stage);
    if (!stageResult) return null;

    const rowsKey = `${drill.bucket}Rows` as `${BucketKey}Rows`;
    const rows = stageResult[rowsKey];
    if (!rows.length) return { rows: [], columns: [], keyField: 'Matter Name' };

    const colDefs = DRILL_COLUMNS[drill.stage];
    const columns: Column<DrillRow>[] = colDefs.map(c => ({
      key: c.key,
      label: c.label,
      render: (r: DrillRow) => {
        const v = r[c.key];
        if (v == null || v === '') return '-';
        return String(v);
      },
    }));

    // Use Display Name or Matter Name for React key
    const keyField = rows[0]['Display Name'] ? 'Display Name' : 'Matter Name';

    return { rows, columns, keyField };
  }, [drill, stages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading timing data...</span>
      </div>
    );
  }

  const bucketLabel = (b: BucketKey) => b === 'green' ? 'On Time' : b === 'amber' ? 'Deviation' : 'Unacceptable';

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <HeroSection>
        <HeroTitle
          title="Case Timing Standards"
          subtitle="NJ litigation compliance across all stages"
        />
      </HeroSection>

      {/* Summary Cards */}
      <DashboardGrid cols={4}>
        <StatCard label="Overall On-Time" value={`${summary.overallPct}%`} />
        <StatCard
          label="Worst Stage"
          value={summary.worstStage}
          subMetrics={[{ label: 'Compliance', value: `${summary.worstPct}%` }]}
        />
        <StatCard label="Total Cases" value={summary.totalCases} />
        <StatCard label="Avg Stage Compliance" value={`${summary.avgCompliance}%`} />
      </DashboardGrid>

      {/* Editable Thresholds */}
      <section className="rounded-xl border border-border bg-card/50 p-5">
        <SectionHeader
          title="Timing Standards"
          info="Edit thresholds per stage. Green = on time, Amber = deviation, Red = unacceptable."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          {STAGE_ORDER.map(sn => (
            <div key={sn} className="flex flex-col gap-1 bg-muted/30 rounded-lg p-3">
              <span className="text-xs font-semibold text-foreground">{STAGE_LABELS[sn]}</span>
              <div className="flex items-center gap-3">
                <ThresholdInput
                  label="Green ≤"
                  value={thresholds[sn].green}
                  onChange={v => updateThreshold(sn, 'green', v)}
                />
                <ThresholdInput
                  label="Amber ≤"
                  value={thresholds[sn].amber}
                  onChange={v => updateThreshold(sn, 'amber', v)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stacked Horizontal Bar Chart */}
      <section className="rounded-xl border border-border bg-card/50 p-5">
        <SectionHeader
          title="Compliance Distribution"
          info="Click any bar segment to drill into case details. Bar widths show % distribution."
        />
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
            barCategoryGap="20%"
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: '#ccc', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any, name: any, props: any) => {
                const d = props.payload;
                const countKey = name === 'Green' ? 'greenCount' : name === 'Amber' ? 'amberCount' : 'redCount';
                return [`${value}% (${d[countKey]} cases)`, name];
              }}
              labelFormatter={(label: any) => {
                const d = chartData.find(c => c.name === label);
                return `${label} — ${d?.volume ?? 0} total cases`;
              }}
            />
            <Bar
              dataKey="Green"
              stackId="timing"
              fill={COLORS.green}
              cursor="pointer"
              onClick={(data: any) => {
                if (data?.stage) setDrill({ stage: data.stage, bucket: 'green' });
              }}
            />
            <Bar
              dataKey="Amber"
              stackId="timing"
              fill={COLORS.amber}
              cursor="pointer"
              onClick={(data: any) => {
                if (data?.stage) setDrill({ stage: data.stage, bucket: 'amber' });
              }}
            />
            <Bar
              dataKey="Red"
              stackId="timing"
              fill={COLORS.red}
              cursor="pointer"
              onClick={(data: any) => {
                if (data?.stage) setDrill({ stage: data.stage, bucket: 'red' });
              }}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Volume labels beneath chart */}
        <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
          {stages.map(s => (
            <span key={s.stage}>
              <span className="font-medium text-foreground">{s.label}</span>: {s.total} cases
            </span>
          ))}
        </div>
      </section>

      {/* Breakdown Table */}
      <section className="rounded-xl border border-border bg-card/50 p-5">
        <SectionHeader title="Stage Breakdown" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground">Stage</th>
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground text-right">Volume</th>
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground text-right">
                  <span className="text-green-400">On Time</span>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground text-right">
                  <span className="text-amber-400">Deviation</span>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground text-right">
                  <span className="text-red-400">Unacceptable</span>
                </th>
                <th className="py-2 px-3 text-xs font-medium text-muted-foreground text-right">% On Time</th>
              </tr>
            </thead>
            <tbody>
              {stages.map(s => {
                const pct = s.total ? Math.round((s.green / s.total) * 100) : 0;
                return (
                  <tr key={s.stage} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 font-medium text-foreground">{s.label}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{s.total}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      <button
                        className="text-green-400 hover:underline cursor-pointer"
                        onClick={() => setDrill({ stage: s.stage, bucket: 'green' })}
                      >
                        {s.green}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      <button
                        className="text-amber-400 hover:underline cursor-pointer"
                        onClick={() => setDrill({ stage: s.stage, bucket: 'amber' })}
                      >
                        {s.amber}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      <button
                        className="text-red-400 hover:underline cursor-pointer"
                        onClick={() => setDrill({ stage: s.stage, bucket: 'red' })}
                      >
                        {s.red}
                      </button>
                    </td>
                    <td className={cn(
                      'py-2 px-3 text-right tabular-nums font-semibold',
                      pct >= 60 ? 'text-green-400' : pct >= 30 ? 'text-amber-400' : 'text-red-400',
                    )}>
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Drill-Down */}
      {drill && drillData && (
        <section className="rounded-xl border border-border bg-card/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader
              title={`${STAGE_LABELS[drill.stage]} — ${bucketLabel(drill.bucket)}`}
              subtitle={`${drillData.rows.length} cases`}
            />
            <button
              onClick={() => setDrill(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-border"
            >
              Close
            </button>
          </div>
          {drillData.rows.length > 0 ? (
            <DataTable
              data={drillData.rows}
              columns={drillData.columns}
              keyField={drillData.keyField}
              maxRows={100}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No cases in this bucket.</p>
          )}
        </section>
      )}
    </div>
  );
}
