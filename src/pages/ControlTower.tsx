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
import { getControlTowerData, stageLabels } from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { StageBar } from '../components/dashboard/StageBar';
import { DeadlineList } from '../components/dashboard/DeadlineList';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';

export default function ControlTower() {
  const navigate = useNavigate();
  const controlTowerData = getControlTowerData();

  const formattedEV = `$${(controlTowerData.totalEV / 1_000_000).toFixed(1)}M`;

  const throughputRates = [3.2, 2.1, 1.8, 1.5, 2.4, 0.8];
  const bottleneckData = controlTowerData.stageCounts.map((sc, i) => ({
    stage: stageLabels[sc.stage],
    avgAge: sc.avgAge,
    throughput: throughputRates[i] ?? 1.0,
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <FilterBar />

      <DashboardGrid cols={6}>
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
          <SectionHeader title="Today's Exposure" />
          <DeadlineList deadlines={controlTowerData.deadlines} />
        </div>
      </div>
    </div>
  );
}
