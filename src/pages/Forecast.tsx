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
  const highValueCases = [...activeCases]
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, 20);

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
      </Tabs>
    </div>
  );
}
