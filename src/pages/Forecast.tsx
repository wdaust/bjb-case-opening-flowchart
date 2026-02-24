import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import {
  getSettlementForecasts,
  getWeeklyForecastPipeline,
  getTop20MostLikely,
  type SettlementForecast,
} from '../data/forecastUtils';
import {
  getForecastData,
  getActiveCases,
  stageLabels,
  type LitCase,
} from '../data/mockData';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const formatMillions = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

export default function Forecast() {
  const navigate = useNavigate();
  const forecastData = getForecastData();

  const activeCases = getActiveCases();

  // Settlement forecast data
  const settlementForecasts = useMemo(() => getSettlementForecasts(), []);
  const weeklyPipeline = useMemo(() => getWeeklyForecastPipeline(), []);
  const top20 = useMemo(() => getTop20MostLikely(), []);
  const totalPipelineValue = useMemo(() => settlementForecasts.reduce((s, f) => s + f.expectedValue, 0), [settlementForecasts]);
  const totalWeightedValue = useMemo(() => settlementForecasts.reduce((s, f) => s + f.weightedValue, 0), [settlementForecasts]);
  const top20Value = useMemo(() => top20.reduce((s, f) => s + f.weightedValue, 0), [top20]);
  const avgProbability = useMemo(() => {
    if (settlementForecasts.length === 0) return 0;
    return Math.round(settlementForecasts.reduce((s, f) => s + f.probability, 0) / settlementForecasts.length * 100);
  }, [settlementForecasts]);
  const highValueCases = [...activeCases]
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, 20);

  const settlementColumns: Column<SettlementForecast>[] = [
    { key: 'caseId', label: 'Case ID' },
    { key: 'attorney', label: 'Attorney' },
    {
      key: 'expectedValue',
      label: 'EV',
      render: (row: SettlementForecast) => currencyFormatter.format(row.expectedValue),
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (row: SettlementForecast) => `${Math.round(row.probability * 100)}%`,
    },
    {
      key: 'weightedValue',
      label: 'Weighted Value',
      render: (row: SettlementForecast) => currencyFormatter.format(row.weightedValue),
    },
    {
      key: 'estimatedWeek',
      label: 'Est. Week',
      render: (row: SettlementForecast) => `W${row.estimatedWeek}`,
    },
  ];

  const highValueColumns: Column<LitCase>[] = [
    { key: 'id', label: 'Case ID' },
    { key: 'title', label: 'Title' },
    { key: 'attorney', label: 'Attorney' },
    {
      key: 'stage',
      label: 'Stage',
      render: (row: LitCase) => stageLabels[row.stage],
    },
    {
      key: 'expectedValue',
      label: 'Expected Value',
      render: (row: LitCase) => currencyFormatter.format(row.expectedValue),
    },
    {
      key: 'evConfidence',
      label: 'Confidence',
      render: (row: LitCase) => `${Math.round(row.evConfidence * 100)}%`,
    },
    {
      key: 'exposureAmount',
      label: 'Exposure',
      render: (row: LitCase) => currencyFormatter.format(row.exposureAmount),
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Forecast & Yield' },
      ]} />
      <FilterBar />

      <DashboardGrid cols={4}>
        <StatCard
          label="Total Portfolio EV"
          value={formatMillions(forecastData.totalEV)}
          delta="+3.2% vs last month"
          deltaType="positive"
        />
        <StatCard
          label="Expected Fees"
          value={formatMillions(forecastData.expectedFees)}
          deltaType="positive"
        />
        <StatCard
          label="Close-Month Forecast"
          value={`${forecastData.closeMonthForecast} cases`}
        />
        <StatCard
          label="Historical Accuracy"
          value="92%"
          deltaType="positive"
        />
      </DashboardGrid>

      <Tabs defaultValue="ev-trend">
        <TabsList>
          <TabsTrigger value="ev-trend">EV Trend</TabsTrigger>
          <TabsTrigger value="close-accuracy">Close Accuracy</TabsTrigger>
          <TabsTrigger value="high-value-cases">High-Value Cases</TabsTrigger>
          <TabsTrigger value="settlement-pipeline">Settlement Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="ev-trend" className="space-y-4">
          <SectionHeader title="Portfolio EV Trend" subtitle="Monthly expected value" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecastData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="ev" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="close-accuracy" className="space-y-4">
          <SectionHeader title="Close Forecast Accuracy" subtitle="Predicted vs actual closures" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forecastData.historicalAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                <Legend />
                <Bar dataKey="predicted" fill="#6366f1" name="Predicted" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="high-value-cases" className="space-y-4">
          <SectionHeader title="High-Value Cases" subtitle="Top cases by expected value" />
          <DataTable
            data={highValueCases}
            columns={highValueColumns}
            keyField="id"
            onRowClick={(row) => navigate(`/case/${row.id}`)}
            maxRows={20}
          />
        </TabsContent>

        <TabsContent value="settlement-pipeline" className="space-y-4">
          <DashboardGrid cols={4}>
            <StatCard label="Total Pipeline Value" value={formatMillions(totalPipelineValue)} />
            <StatCard label="Weighted Value" value={formatMillions(totalWeightedValue)} />
            <StatCard label="Top 20 Value" value={formatMillions(top20Value)} />
            <StatCard label="Avg Probability" value={`${avgProbability}%`} />
          </DashboardGrid>

          <SectionHeader title="Weekly Forecast Pipeline" subtitle="13-week settlement forecast" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyPipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="weekLabel" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="weightedValue" fill="#6366f1" name="Weighted Value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionHeader title="Top 20 Most Likely Settlements" subtitle="Ranked by probability and weighted value" />
          <DataTable
            data={top20}
            columns={settlementColumns}
            keyField="caseId"
            onRowClick={(row) => navigate(`/case/${row.caseId}`)}
            maxRows={20}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
