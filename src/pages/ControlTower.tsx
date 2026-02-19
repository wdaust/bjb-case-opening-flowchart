import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { getControlTowerData, getUpcomingDeadlines, stageLabels } from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { StageBar } from '../components/dashboard/StageBar';
import { DeadlineList } from '../components/dashboard/DeadlineList';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export default function ControlTower() {
  const navigate = useNavigate();
  const controlTowerData = getControlTowerData();
  const [exposureOpen, setExposureOpen] = useState(true);

  const formattedEV = `$${(controlTowerData.totalEV / 1_000_000).toFixed(1)}M`;

  const throughputRates = [3.2, 2.1, 1.8, 1.5, 2.4, 0.8];
  const bottleneckData = controlTowerData.stageCounts.map((sc, i) => ({
    stage: stageLabels[sc.stage],
    avgAge: sc.avgAge,
    throughput: throughputRates[i] ?? 1.0,
  }));

  const allDeadlines = useMemo(() => getUpcomingDeadlines(90), []);
  const today = "2026-02-19";

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

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <FilterBar />

      <DashboardGrid cols={5}>
        <StatCard
          label="Total Active Inventory"
          value={controlTowerData.totalActive}
          delta="+12 vs 30d ago"
          deltaType="positive"
        />
        <StatCard
          label="New In / Closed Out (30d)"
          value="42 in / 38 out"
          delta="net +4"
          deltaType="positive"
        />
        <StatCard
          label="Over-SLA %"
          value={`${controlTowerData.overSlaPct}%`}
          delta="by stage"
          deltaType={controlTowerData.overSlaPct > 10 ? "negative" : "positive"}
          onClick={() => navigate('/inventory-health')}
        />
        <StatCard
          label="Silent Stall %"
          value={`${controlTowerData.stallPct}%`}
          delta="no activity 21d+"
          deltaType={controlTowerData.stallPct > 5 ? "negative" : "positive"}
          sparklineData={[8, 7, 6, 7, 8, 9, 8, 7, 6, 5, 6, 7, 8]}
          onClick={() => navigate('/inventory-health')}
        />
        <StatCard
          label="Realizable EV"
          value={formattedEV}
          delta="+3.2% vs last month"
          deltaType="positive"
        />
      </DashboardGrid>

      <Tabs defaultValue="deadline-timeline">
        <TabsList>
          <TabsTrigger value="deadline-timeline">Deadline Timeline</TabsTrigger>
          <TabsTrigger value="sol-countdown">SOL Countdown</TabsTrigger>
          <TabsTrigger value="court-calendar">Court Date Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="deadline-timeline" className="pt-4">
          <DeadlineList deadlines={allDeadlines} maxItems={30} />
        </TabsContent>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="Inventory by Stage" />
          <StageBar stages={controlTowerData.stageCounts} />

          <SectionHeader
            title="Bottleneck Detector"
            subtitle="Avg age vs throughput by stage"
          />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={bottleneckData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="stage"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                <Bar yAxisId="left" dataKey="avgAge" fill="#6366f1" name="Avg Age (days)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} name="Throughput" dot={{ fill: '#10b981', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <button
            onClick={() => setExposureOpen(o => !o)}
            className="flex items-center gap-2 w-full text-left"
          >
            <SectionHeader title="Today's Exposure" />
            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform ${exposureOpen ? "" : "-rotate-90"}`}
            />
          </button>
          {exposureOpen && (
            <DeadlineList deadlines={controlTowerData.deadlines} />
          )}
        </div>
      </div>
    </div>
  );
}
