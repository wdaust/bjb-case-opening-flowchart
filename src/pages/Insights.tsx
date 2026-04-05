import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { cn } from '../utils/cn';
import { InsightsSkeleton } from '../components/dashboard/InsightsSkeleton';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import { fmt$, fmtNum, getDashMetric, getTimingCompliance, compliancePct, complianceColor } from '../utils/sfHelpers';
import { STATS_ID, TIMING_ID, RESOLUTIONS_ID, DISCOVERY_ID, MATTERS_ID, EXPERTS_ID } from '../data/sfReportIds';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

function pct(n: number, d: number): string {
  if (d === 0) return '0%';
  return `${Math.round((n / d) * 100)}%`;
}

// ── Attorney row type ──────────────────────────────────────────────
interface AttorneyRow {
  name: string;
  cases: number;
  settlement: number;
  avgSettlement: number;
  netFee: number;
  feePercent: number;
}

// ── Main component ─────────────────────────────────────────────────
export default function Insights() {
  const { data: statsData, loading: statsLoading } = useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });
  const { data: timingData, loading: timingLoading } = useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });
  const { data: resData, loading: resLoading } = useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { data: discData, loading: discLoading } = useSalesforceReport<ReportSummaryResponse>({ id: DISCOVERY_ID, type: 'report' });
  const { data: mattersData, loading: mattersLoading } = useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: expertsData, loading: expertsLoading } = useSalesforceReport<ReportSummaryResponse>({ id: EXPERTS_ID, type: 'report' });

  const allLoading = statsLoading || timingLoading || resLoading || discLoading || mattersLoading || expertsLoading;

  // ── KPIs ──────────────────────────────────────────────────────────
  const totalSettlement = resData?.grandTotals.find(g => g.label.includes('Settlement'))?.value ?? 0;
  const totalCases = resData?.grandTotals.find(g => g.label === 'Record Count')?.value ?? 0;
  const avgSettlement = totalCases ? (totalSettlement as number) / (totalCases as number) : 0;
  const njInventory = getDashMetric(statsData, 'NJ Lit Inventory');
  const portfolioValue = getDashMetric(statsData, 'NJ Lit Inventory (Value)');
  const complaint = getTimingCompliance(timingData, 'Complaint Timing NJ');
  const njResolutions = getDashMetric(timingData, 'NJ Resolutions');

  // ── Attorney rankings ─────────────────────────────────────────────
  const attorneys: AttorneyRow[] = useMemo(() => {
    if (!resData) return [];
    return resData.groupings.map(g => {
      const cases = g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0;
      const settlement = g.aggregates.find(a => a.label.includes('Settlement'))?.value ?? 0;
      const netFee = g.aggregates.find(a => a.label.includes('Fee'))?.value ?? 0;
      return {
        name: g.label,
        cases: cases as number,
        settlement: settlement as number,
        avgSettlement: cases ? (settlement as number) / (cases as number) : 0,
        netFee: netFee as number,
        feePercent: settlement ? ((netFee as number) / (settlement as number)) * 100 : 0,
      };
    }).sort((a, b) => b.settlement - a.settlement);
  }, [resData]);

  const top15 = attorneys.slice(0, 15);
  const q1Threshold = attorneys.length > 0 ? attorneys[Math.floor(attorneys.length * 0.25)]?.settlement ?? 0 : 0;
  const q3Threshold = attorneys.length > 0 ? attorneys[Math.floor(attorneys.length * 0.75)]?.settlement ?? 0 : 0;

  const attorneyColumns: Column<AttorneyRow>[] = [
    { key: 'name', label: 'Attorney', sortable: true },
    { key: 'cases', label: 'Cases', sortable: true, render: r => fmtNum(r.cases), className: 'text-right' },
    { key: 'settlement', label: 'Total Settlement', sortable: true, render: r => fmt$(r.settlement), className: 'text-right' },
    { key: 'avgSettlement', label: 'Avg/Case', sortable: true, render: r => fmt$(r.avgSettlement), className: 'text-right' },
    { key: 'netFee', label: 'Net Fee', sortable: true, render: r => fmt$(r.netFee), className: 'text-right' },
    { key: 'feePercent', label: 'Fee %', sortable: true, render: r => `${r.feePercent.toFixed(1)}%`, className: 'text-right' },
  ];

  // ── Discovery workload ────────────────────────────────────────────
  const discoveryTop20 = useMemo(() => {
    if (!discData) return [];
    return discData.groupings
      .map(g => ({ name: g.label, count: (g.aggregates[0]?.value ?? 0) as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [discData]);

  const discP75 = useMemo(() => {
    if (!discData) return 0;
    const sorted = discData.groupings
      .map(g => (g.aggregates[0]?.value ?? 0) as number)
      .sort((a, b) => b - a);
    return sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  }, [discData]);

  // ── Case pipeline ─────────────────────────────────────────────────
  const pipeline = useMemo(() => {
    if (!mattersData) return [];
    return mattersData.groupings
      .filter(g => g.label !== 'No Stage')
      .map(g => {
        const total = (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number;
        const open = (g.aggregates.find(a => a.label === 'Open')?.value ?? 0) as number;
        const closed = (g.aggregates.find(a => a.label === 'Closed')?.value ?? 0) as number;
        return { stage: g.label, total, open, closed, openRatio: total ? open / total : 0 };
      })
      .sort((a, b) => b.total - a.total);
  }, [mattersData]);

  // ── Timing compliance cards ───────────────────────────────────────
  const formA = getTimingCompliance(timingData, 'Form A Timing NJ in Days from Answer');
  const formC = getTimingCompliance(timingData, 'Form C Timing NJ in Days from Answer');
  const deps = getTimingCompliance(timingData, 'Dep Timing NJ in Days from Form A');


  // ── Experts not served ────────────────────────────────────────────
  const expertsTop10 = useMemo(() => {
    if (!expertsData) return [];
    return expertsData.groupings
      .map(g => ({ name: g.label, count: (g.aggregates[0]?.value ?? 0) as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [expertsData]);

  const expertsTotal = (expertsData?.grandTotals[0]?.value ?? 0) as number;

  // ── Loading state ─────────────────────────────────────────────────
  if (allLoading) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <SectionHeader
        title="Performance Insights"
        subtitle="Actionable metrics derived from 6 Salesforce reports"
        info="Key performance indicators: settlements, average per case, NJ inventory, complaint timeliness, resolutions, and portfolio value."
      />

      {/* ── 1. Hero KPI Strip ──────────────────────────────────────── */}
      <DashboardGrid cols={3}>
        <StatCard
          label="Total Settlements"
          value={fmt$(totalSettlement as number)}
          delta={`${fmtNum(totalCases as number)} cases`}
          deltaType="neutral"
          variant="glass"
        />
        <StatCard
          label="Avg Settlement / Case"
          value={fmt$(avgSettlement)}
          variant="glass"
        />
        <StatCard
          label="NJ LIT Inventory"
          value={njInventory != null ? fmtNum(njInventory) : '—'}
          delta={portfolioValue != null ? `${fmt$(portfolioValue)} value` : undefined}
          deltaType="neutral"
          variant="glass"
        />
        <StatCard
          label="Complaint Timeliness"
          value={pct(complaint.timely, complaint.timely + complaint.late)}
          delta={`${fmtNum(complaint.timely)} / ${fmtNum(complaint.timely + complaint.late)}`}
          deltaType={compliancePct(complaint) >= 50 ? 'positive' : 'negative'}
          variant="glass"
        />
        <StatCard
          label="NJ Resolutions"
          value={njResolutions != null ? fmtNum(njResolutions) : '—'}
          variant="glass"
        />
        <StatCard
          label="Portfolio Value"
          value={portfolioValue != null ? fmt$(portfolioValue) : '—'}
          variant="glass"
        />
      </DashboardGrid>

      {/* ── 2. Attorney Settlement Rankings ─────────────────────────── */}
      <section>
        <SectionHeader title="Attorney Settlement Rankings" subtitle="Top 15 by total settlement amount" info="Attorneys ranked by total settlement value. Green = top quartile, amber = bottom quartile." />
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 mb-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top15} layout="vertical" margin={{ left: 120, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={v => fmt$(v)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={110} />
              <Tooltip formatter={(v: number | undefined) => fmt$(v ?? 0)} contentStyle={tooltipStyle} />
              <Bar dataKey="settlement" radius={[0, 4, 4, 0]}>
                {top15.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.settlement >= q1Threshold ? '#22c55e' : entry.settlement <= q3Threshold ? '#f59e0b' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DataTable
          data={attorneys}
          columns={attorneyColumns}
          keyField="name"
        />
      </section>

      {/* ── 3. Discovery Workload Distribution ──────────────────────── */}
      <section>
        <SectionHeader title="Discovery Workload Distribution" subtitle="Top 20 attorneys by tracker count — highlighted if above 75th percentile" info="Discovery tracker counts by attorney. Red highlights attorneys above the 75th percentile workload." />
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={discoveryTop20} layout="vertical" margin={{ left: 120, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {discoveryTop20.map((entry, i) => (
                  <Cell key={i} fill={entry.count >= discP75 ? '#ef4444' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 4. Case Pipeline Health ─────────────────────────────────── */}
      <section>
        <SectionHeader title="Case Pipeline Health" subtitle="Open vs Closed by stage — high open ratios indicate bottlenecks" info="Open vs closed matters by stage showing pipeline flow and stage completion rates." />
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
          <ResponsiveContainer width="100%" height={Math.max(300, pipeline.length * 36)}>
            <BarChart data={pipeline} layout="vertical" margin={{ left: 140, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={130} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="open" stackId="a" fill="#f59e0b" name="Open" radius={[0, 0, 0, 0]} />
              <Bar dataKey="closed" stackId="a" fill="#22c55e" name="Closed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#f59e0b]" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22c55e]" /> Closed</span>
          </div>
        </div>
      </section>

      {/* ── 5. NJ Timing Compliance ─────────────────────────────────── */}
      <section>
        <SectionHeader title="NJ Timing Compliance" subtitle="Percentage meeting compliance windows" info="Percentage of NJ matters meeting timing deadlines for each compliance milestone." />
        <DashboardGrid cols={4}>
          {([
            { label: 'Complaint Filing', data: complaint },
            { label: 'Form A', data: formA },
            { label: 'Form C', data: formC },
            { label: 'Depositions', data: deps },
          ] as const).map(({ label, data }) => {
            const p = compliancePct(data);
            return (
              <div key={label} className={cn('rounded-xl border p-5 text-center', complianceColor(p))}>
                <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                <p className="text-4xl font-bold">{p}%</p>
                <p className="text-[11px] mt-1 opacity-60">
                  {fmtNum(data.timely)} timely / {fmtNum(data.timely + data.late)} total
                </p>
              </div>
            );
          })}
        </DashboardGrid>
      </section>

      {/* ── 6. Experts Not Served — Concentration Risk ──────────────── */}
      <section>
        <SectionHeader
          title="Experts Not Served — Concentration Risk"
          subtitle={`${fmtNum(expertsTotal)} total unserved across all experts`}
          info="Expert service gaps concentrated by attorney. Higher counts indicate potential bottlenecks."
        />
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={expertsTop10} layout="vertical" margin={{ left: 120, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
