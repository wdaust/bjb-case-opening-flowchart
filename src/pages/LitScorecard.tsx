import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../utils/db.ts';
import { cn } from '../utils/cn.ts';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ─── LIT Scorecard data ─────────────────────────────────────────────────────

const LIT_ATTORNEYS = [
  'Bianca Pagani', 'Chris Bradley', 'Christopher Karounos', 'Eric Plantier',
  'Lisa Lehrer', 'Paul F Romano', 'Raymond Carroll', 'Stephen Devine',
  'Stephen Mennella', 'Brian Lehrer', 'David Rehe', 'Gregory Shaffer',
  'Heath Murphy', 'John VanDyken', 'Marc Borden', 'Matthew Futerfas',
  'Paul A Krauss', 'Bruce Cantin', 'Jason Richman', 'George Sabo',
  'Joel Moore', 'John Carucci', 'Mark Grodberg', 'Martha Vasquez',
  'Melissa Perrotta Marinelli', 'Ryan Veilleux', 'Todd Greenwell', 'William Firth',
];

const SCORECARD_KPIS: { key: string; label: string }[] = [
  { key: 'active-cases', label: 'Total Active Cases' },
  { key: 'settlements', label: 'Attorney Unit Settlements ($)' },
  { key: 'settlements-pct-goal', label: 'Settlements % to Goal' },
  { key: 'avg-settlement', label: 'Avg Settlement Value ($)' },
  { key: 'tod-days', label: 'TOD (Assigned → Resolution) Days' },
  { key: 'days-to-complaint', label: 'Avg Days: Assignment → Complaint Filed' },
  { key: 'filed-30-days', label: '% Filed ≤ 30 Days of Assignment' },
  { key: 'days-to-service', label: 'Avg Days: Filed → Service Completed' },
  { key: 'service-30-days', label: '% Service Completed ≤ 30 Days of Filed' },
  { key: 'answers-filed', label: 'All Answers Filed %' },
  { key: 'defaults-timely', label: 'Defaults Entered Timely %' },
  { key: 'plaintiff-disc', label: 'Plaintiff Discovery Served Timely %' },
  { key: 'defense-disc', label: 'Defense Discovery Received Timely %' },
  { key: '10day-letter', label: '10-Day Letter Sent When Past Due %' },
  { key: 'motions-compel', label: 'Motions to Compel Filed When Required %' },
  { key: 'days-to-motion', label: 'Avg Days: Past-Due → Motion Filed' },
  { key: 'motions-granted', label: 'Motions Granted / Substantially Granted %' },
  { key: 'ded-extensions', label: 'DED Extensions (#)' },
  { key: 'depos-1yr', label: 'Client Depos Completed ≤ 1 Year of Answer %' },
  { key: 'depos-180', label: 'Client Deps Outstanding 180+ Days (#)' },
  { key: 'expert-reports', label: 'Expert Reports Served Timely %' },
  { key: 'mediation', label: 'Mediation Scheduled When Eligible %' },
  { key: 'trial-ready', label: 'Trial-Ready Checklist Completion %' },
  { key: 'data-completeness', label: 'Data Completeness Score %' },
  { key: 'client-service', label: 'Client Service Score' },
  { key: 'sds-completion', label: 'SDS Completion %' },
  { key: 'overall-kpi', label: 'Overall KPI Score (0-100)' },
];

type LitScorecardData = Record<string, string>;
type SyncStatus = '' | 'saving' | 'saved' | 'error';

// ─── Debounced save ──────────────────────────────────────────────────────────

function useDebouncedSave(sectionId: string, data: LitScorecardData, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [status, setStatus] = useState<SyncStatus>('');

  useEffect(() => {
    if (!enabled) return;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ok = await saveGenericSection(sectionId, data);
      setStatus(ok ? 'saved' : 'error');
      if (ok) setTimeout(() => setStatus(''), 2000);
    }, 1200);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), sectionId, enabled]);

  return status;
}

// ─── Chart colors ────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8',
  '#7c3aed', '#5b21b6', '#4f46e5', '#4338ca', '#3730a3',
];

// ─── Dashboard charts ────────────────────────────────────────────────────────

function CompletionByAttorneyChart({ data }: { data: LitScorecardData }) {
  const chartData = LIT_ATTORNEYS.map((attorney, aIdx) => {
    let filled = 0;
    SCORECARD_KPIS.forEach(kpi => {
      const key = `lit-scorecard:${aIdx}:${kpi.key}`;
      if (data[key]?.trim()) filled++;
    });
    const pct = Math.round((filled / SCORECARD_KPIS.length) * 100);
    const lastName = attorney.split(' ').pop() || attorney;
    return { name: lastName, pct, filled, total: SCORECARD_KPIS.length };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Completion by Attorney</h3>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#ccc', fontSize: 10 }} width={75} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Completion']}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopPerformersChart({ data }: { data: LitScorecardData }) {
  const chartData = LIT_ATTORNEYS.map((attorney, aIdx) => {
    const key = `lit-scorecard:${aIdx}:overall-kpi`;
    const score = parseFloat(data[key] || '0') || 0;
    const lastName = attorney.split(' ').pop() || attorney;
    return { name: lastName, score };
  })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Top Performers (Overall KPI Score)</h3>
      <div className="h-[360px]">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No Overall KPI Score data entered yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fill: '#ccc', fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number | undefined) => [value ?? 0, 'KPI Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? '#22c55e' : i < 6 ? '#6366f1' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KpiDistributionChart({ data }: { data: LitScorecardData }) {
  const buckets = [
    { range: '90-100', min: 90, max: 100, count: 0, fill: '#22c55e' },
    { range: '75-89', min: 75, max: 89, count: 0, fill: '#6366f1' },
    { range: '50-74', min: 50, max: 74, count: 0, fill: '#eab308' },
    { range: '25-49', min: 25, max: 49, count: 0, fill: '#f97316' },
    { range: '0-24', min: 0, max: 24, count: 0, fill: '#ef4444' },
  ];

  let hasData = false;
  LIT_ATTORNEYS.forEach((_, aIdx) => {
    const key = `lit-scorecard:${aIdx}:overall-kpi`;
    const score = parseFloat(data[key] || '') || 0;
    if (!data[key]?.trim()) return;
    hasData = true;
    for (const b of buckets) {
      if (score >= b.min && score <= b.max) { b.count++; break; }
    }
  });

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-4">
      <h3 className="text-sm font-semibold text-white mb-3">KPI Score Distribution</h3>
      <div className="h-[360px]">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No Overall KPI Score data entered yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="range" tick={{ fill: '#ccc', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number | undefined) => [value ?? 0, 'Attorneys']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {buckets.map((b, i) => (
                  <Cell key={i} fill={b.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Summary cards ───────────────────────────────────────────────────────────

function LitScorecardSummary({ data }: { data: LitScorecardData }) {
  const totalCells = LIT_ATTORNEYS.length * SCORECARD_KPIS.length;
  const filled = Object.values(data).filter(v => v?.trim()).length;
  return (
    <DashboardGrid cols={3} className="mb-6">
      <StatCard label="Total Attorneys" value={LIT_ATTORNEYS.length} variant="glass" />
      <StatCard label="KPIs Tracked" value={SCORECARD_KPIS.length} variant="glass" />
      <StatCard
        label="Data Completion"
        value={`${filled}/${totalCells}`}
        delta={totalCells > 0 ? `${Math.round((filled / totalCells) * 100)}%` : '0%'}
        deltaType={filled / totalCells > 0.5 ? 'positive' : 'negative'}
        variant="glass"
      />
    </DashboardGrid>
  );
}

// ─── Scorecard table ─────────────────────────────────────────────────────────

function LitScorecardTable({
  data,
  onCellChange,
}: {
  data: LitScorecardData;
  onCellChange: (key: string, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="text-xs w-full" style={{ minWidth: SCORECARD_KPIS.length * 110 + 180 }}>
        <thead>
          <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-20 min-w-[180px]">
              Attorney
            </th>
            {SCORECARD_KPIS.map(kpi => (
              <th
                key={kpi.key}
                className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap min-w-[110px]"
                title={kpi.label}
              >
                {kpi.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIT_ATTORNEYS.map((attorney, aIdx) => (
            <tr
              key={aIdx}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                aIdx % 2 === 0 ? "bg-card" : "bg-table-stripe",
              )}
            >
              <td className="py-1.5 px-3 font-medium whitespace-nowrap sticky left-0 bg-inherit z-10 min-w-[180px]">
                {attorney}
              </td>
              {SCORECARD_KPIS.map(kpi => {
                const cellKey = `lit-scorecard:${aIdx}:${kpi.key}`;
                return (
                  <td key={kpi.key} className="py-0.5 px-0.5">
                    <input
                      type="text"
                      value={data[cellKey] ?? ''}
                      onChange={e => onCellChange(cellKey, e.target.value)}
                      className={cn(
                        "w-full text-center text-xs py-1 px-1 rounded bg-transparent border border-transparent",
                        "focus:border-primary/40 focus:bg-primary/5 focus:outline-none transition-colors",
                        "hover:border-border",
                      )}
                      placeholder="—"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function LitScorecard() {
  const [data, setData] = useState<LitScorecardData>({});
  const [loaded, setLoaded] = useState(false);
  const syncStatus = useDebouncedSave('mos-lit-scorecard', data, loaded);

  useEffect(() => {
    (async () => {
      await initDb();
      const saved = await loadGenericSection<LitScorecardData>('mos-lit-scorecard');
      if (saved) setData(saved);
      setLoaded(true);
    })();
  }, []);

  const handleCellChange = useCallback((key: string, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="LIT Attorney Scorecard"
          subtitle="Individual attorney KPI tracking — 28 attorneys × 27 metrics"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {syncStatus === 'saving' && <><Loader2 size={14} className="animate-spin" /> Saving...</>}
          {syncStatus === 'saved' && <><CheckCircle size={14} className="text-green-500" /> Saved</>}
          {syncStatus === 'error' && <><AlertCircle size={14} className="text-red-400" /> Save failed</>}
        </div>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading scorecard data...
        </div>
      ) : (
        <>
          <LitScorecardSummary data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CompletionByAttorneyChart data={data} />
            <TopPerformersChart data={data} />
            <KpiDistributionChart data={data} />
          </div>

          <LitScorecardTable data={data} onCellChange={handleCellChange} />
        </>
      )}
    </div>
  );
}
