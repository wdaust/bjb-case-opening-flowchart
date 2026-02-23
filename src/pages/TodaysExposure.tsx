import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, Legend, ReferenceLine,
} from 'recharts';
import { getActiveCases, getUpcomingDeadlines, parentStageLabels, stageLabels, type ParentStage, type Stage } from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { DeadlineList } from '../components/dashboard/DeadlineList';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const today = "2026-02-19";

export default function TodaysExposure() {
  const navigate = useNavigate();
  const activeCases = useMemo(() => getActiveCases(), []);
  const allDeadlines = useMemo(() => getUpcomingDeadlines(90), []);

  const totalExposure = activeCases.reduce((s, c) => s + c.exposureAmount, 0);
  const totalEV = activeCases.reduce((s, c) => s + c.expectedValue, 0);
  const avgConfidence = activeCases.length > 0
    ? Math.round(activeCases.reduce((s, c) => s + c.evConfidence, 0) / activeCases.length * 100) / 100
    : 0;

  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const deadlinesThisWeek = allDeadlines.filter(d => d.date <= sevenDaysOut.toISOString().split('T')[0]);

  // Exposure by Stage
  const exposureByStage = useMemo(() => {
    const map: Record<string, { stage: string; exposure: number; ev: number }> = {};
    activeCases.forEach(c => {
      const key = c.parentStage;
      const label = parentStageLabels[key as ParentStage] || key;
      if (!map[key]) map[key] = { stage: label, exposure: 0, ev: 0 };
      map[key].exposure += c.exposureAmount;
      map[key].ev += c.expectedValue;
    });
    return Object.values(map).filter(d => d.stage !== "Intake");
  }, [activeCases]);

  // Exposure by Case Type
  const exposureByCaseType = useMemo(() => {
    const map: Record<string, number> = {};
    activeCases.forEach(c => {
      map[c.caseType] = (map[c.caseType] || 0) + c.exposureAmount;
    });
    return Object.entries(map)
      .map(([type, exposure]) => ({ type, exposure }))
      .sort((a, b) => b.exposure - a.exposure);
  }, [activeCases]);

  // EV vs Exposure bubble data — grouped by sub-stage
  const evVsExposure = useMemo(() => {
    const map: Record<string, { stage: string; parentStage: string; exposure: number; ev: number; count: number }> = {};
    activeCases.forEach(c => {
      if (!c.subStage || c.parentStage === "intake") return;
      const key = c.subStage;
      const label = stageLabels[key as Stage] || key;
      if (!map[key]) map[key] = { stage: label, parentStage: c.parentStage, exposure: 0, ev: 0, count: 0 };
      map[key].exposure += c.exposureAmount;
      map[key].ev += c.expectedValue;
      map[key].count++;
    });
    return Object.values(map).map(d => ({
      ...d,
      ratio: d.exposure > 0 ? Math.round((d.ev / d.exposure) * 100) : 0,
      exposure: Math.round(d.exposure / 1_000_000),
      ev: Math.round(d.ev / 1_000_000),
    }));
  }, [activeCases]);

  const solDeadlines = useMemo(() =>
    allDeadlines
      .filter(d => d.type === "SOL")
      .map(d => {
        const daysLeft = Math.ceil((new Date(d.date).getTime() - new Date(today).getTime()) / 86400000);
        return { ...d, daysLeft };
      }),
    [allDeadlines]
  );

  const courtDeadlines = useMemo(() =>
    allDeadlines
      .filter(d => ["trial", "court", "depo"].includes(d.type))
      .map(d => {
        const daysUntil = Math.ceil((new Date(d.date).getTime() - new Date(today).getTime()) / 86400000);
        return { ...d, daysUntil };
      }),
    [allDeadlines]
  );

  const solColumns: Column<(typeof solDeadlines)[0]>[] = [
    { key: "caseId", label: "Case ID" },
    { key: "caseTitle", label: "Case Title" },
    { key: "attorney", label: "Attorney" },
    { key: "date", label: "Deadline Date" },
    {
      key: "daysLeft",
      label: "Days Left",
      render: (row) => {
        const color = row.daysLeft < 14 ? "text-red-500" : row.daysLeft < 30 ? "text-amber-500" : "text-green-500";
        return <span className={`font-semibold ${color}`}>{row.daysLeft}d</span>;
      },
    },
  ];

  const courtColumns: Column<(typeof courtDeadlines)[0]>[] = [
    { key: "caseId", label: "Case ID" },
    { key: "caseTitle", label: "Case Title" },
    { key: "attorney", label: "Attorney" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date" },
    {
      key: "daysUntil",
      label: "Days Until",
      render: (row) => {
        const color = row.daysUntil < 14 ? "text-red-500" : row.daysUntil < 30 ? "text-amber-500" : "text-green-500";
        return <span className={`font-semibold ${color}`}>{row.daysUntil}d</span>;
      },
    },
  ];

  const stageColors = ["#10b981", "#ef4444"];
  const caseTypeColors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <FilterBar />

      <SectionHeader title="Today's Exposure" subtitle="Portfolio exposure, expected value, and upcoming deadlines" />

      {/* Top row — 4 StatCards */}
      <DashboardGrid cols={4}>
        <StatCard
          label="Total Exposure"
          value={`$${(totalExposure / 1_000_000).toFixed(1)}M`}
          delta="all active cases"
          deltaType="neutral"
        />
        <StatCard
          label="Total EV"
          value={`$${(totalEV / 1_000_000).toFixed(1)}M`}
          delta={`ratio: ${totalExposure > 0 ? ((totalEV / totalExposure) * 100).toFixed(1) : 0}%`}
          deltaType="positive"
        />
        <StatCard
          label="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(0)}%`}
          delta="mean evConfidence"
          deltaType={avgConfidence > 0.5 ? "positive" : "negative"}
        />
        <StatCard
          label="Deadlines This Week"
          value={deadlinesThisWeek.length}
          delta="next 7 days"
          deltaType={deadlinesThisWeek.length > 10 ? "negative" : "neutral"}
        />
      </DashboardGrid>

      {/* Middle section — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Exposure by Stage" subtitle="Pre-Lit vs Lit total exposure" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exposureByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${((v ?? 0) / 1_000_000).toFixed(1)}M`, '']} />
                <Bar dataKey="exposure" name="Exposure" radius={[4, 4, 0, 0]}>
                  {exposureByStage.map((_, i) => (
                    <Cell key={i} fill={stageColors[i % stageColors.length]} />
                  ))}
                </Bar>
                <Bar dataKey="ev" name="Expected Value" radius={[4, 4, 0, 0]} opacity={0.6}>
                  {exposureByStage.map((_, i) => (
                    <Cell key={i} fill={stageColors[i % stageColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Exposure by Case Type" subtitle="Total exposure per case type" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exposureByCaseType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`} />
                <YAxis dataKey="type" type="category" width={80} stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`$${((v ?? 0) / 1_000_000).toFixed(1)}M`, 'Exposure']} />
                <Bar dataKey="exposure" radius={[0, 4, 4, 0]}>
                  {exposureByCaseType.map((_, i) => (
                    <Cell key={i} fill={caseTypeColors[i % caseTypeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="EV vs Exposure by Sub-Stage" subtitle="Bubble size = case count · Color = Pre-Lit vs Lit" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="exposure" name="Exposure ($M)" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'Exposure ($M)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis dataKey="ev" name="EV ($M)" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} label={{ value: 'EV ($M)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <ZAxis dataKey="count" range={[80, 600]} name="Cases" />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: Math.max(...evVsExposure.map(d => d.exposure), 10), y: Math.max(...evVsExposure.map(d => d.exposure), 10) }]} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { stage: string; exposure: number; ev: number; ratio: number; count: number };
                    return (
                      <div style={tooltipStyle} className="p-2 text-sm shadow-md">
                        <p className="font-semibold">{d.stage}</p>
                        <p>Exposure: ${d.exposure}M</p>
                        <p>EV: ${d.ev}M</p>
                        <p>Ratio: {d.ratio}%</p>
                        <p>Cases: {d.count}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Scatter
                  data={evVsExposure.filter(d => d.parentStage === "pre-lit")}
                  fill="#10b981"
                  name="Pre-Lit"
                />
                <Scatter
                  data={evVsExposure.filter(d => d.parentStage === "lit")}
                  fill="#6366f1"
                  name="Lit"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Deadline Timeline" subtitle="Next 7 days" />
          <DeadlineList deadlines={deadlinesThisWeek} maxItems={10} />
        </div>
      </div>

      {/* Tabs — SOL Countdown and Court Calendar */}
      <Tabs defaultValue="sol-countdown">
        <TabsList>
          <TabsTrigger value="sol-countdown">SOL Countdown</TabsTrigger>
          <TabsTrigger value="court-calendar">Court Date Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="sol-countdown" className="pt-4">
          <DataTable
            data={solDeadlines}
            columns={solColumns}
            keyField="caseId"
            onRowClick={(row) => navigate(`/case/${row.caseId}`)}
          />
        </TabsContent>
        <TabsContent value="court-calendar" className="pt-4">
          <DataTable
            data={courtDeadlines}
            columns={courtColumns}
            keyField="caseId"
            onRowClick={(row) => navigate(`/case/${row.caseId}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
