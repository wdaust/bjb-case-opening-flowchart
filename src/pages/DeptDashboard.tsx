// ── DeptDashboard ────────────────────────────────────────────────────────
// Generic renderer for all department dashboard sub-pages.
// Reads deptId + pageId from URL params, looks up config, renders stat cards,
// charts, and a data table. Falls back to /control-tower for invalid routes.

import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from 'recharts';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { DataTable } from '../components/dashboard/DataTable';
import { getDeptPageConfig } from '../data/dept';
import { getActiveCases } from '../data/mockData';
import { useDashboardFilters } from '../contexts/DashboardFilterContext';
import type { ChartConfig } from '../data/dept/types';

const CHART_HEIGHT = 280;
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#f43f5e', '#14b8a6'];

function ConfigChart({ config, cases, accent }: { config: ChartConfig; cases: any[]; accent: string }) {
  const data = useMemo(() => config.getData(cases), [config, cases]);
  const xKey = config.xAxisKey || 'name';

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
  };

  switch (config.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            {config.series.length > 1 && <Legend />}
            {config.series.map(s => (
              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color || accent} name={s.name || s.dataKey} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'stacked-bar':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {config.series.map(s => (
              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color || accent} name={s.name || s.dataKey} stackId="stack" radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'horizontal-bar':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis type="category" dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            {config.series.map(s => (
              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color || accent} name={s.name || s.dataKey} radius={[0, 3, 3, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            {config.series.length > 1 && <Legend />}
            {config.series.map(s => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color || accent} name={s.name || s.dataKey} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            {config.series.length > 1 && <Legend />}
            {config.series.map(s => (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} fill={s.color || accent} stroke={s.color || accent} fillOpacity={0.3} name={s.name || s.dataKey} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={data}
              dataKey={config.series[0]?.dataKey || 'value'}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={11}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}

export default function DeptDashboard() {
  const { deptId, pageId } = useParams<{ deptId: string; pageId: string }>();
  const { filters } = useDashboardFilters();

  const config = deptId && pageId ? getDeptPageConfig(deptId, pageId) : undefined;

  const filteredCases = useMemo(() => {
    if (!config) return [];
    let c = getActiveCases();

    // Apply global filters
    if (filters.office !== 'all') c = c.filter(x => x.office === filters.office);
    if (filters.pod !== 'all') c = c.filter(x => x.pod === filters.pod);
    if (filters.attorney !== 'all') c = c.filter(x => x.attorney === filters.attorney);
    if (filters.caseType !== 'all') c = c.filter(x => x.caseType === filters.caseType);
    if (filters.venue !== 'all') c = c.filter(x => x.venue === filters.venue);

    // Apply page-specific filter
    return config.filterCases(c);
  }, [config, filters]);

  if (!config) {
    return <Navigate to="/control-tower" replace />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs crumbs={[
        { label: config.deptLabel, path: `/dept/${deptId}/dashboard` },
        { label: config.title },
      ]} />

      <FilterBar />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: config.accentColor }}>
          {config.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{config.deptLabel} Department</p>
      </div>

      {/* Stat Cards */}
      <DashboardGrid cols={config.statCards.length <= 4 ? 4 : config.statCards.length <= 5 ? 5 : 6}>
        {config.statCards.map((sc, i) => (
          <StatCard
            key={i}
            label={sc.label}
            value={sc.compute(filteredCases)}
            delta={sc.computeDelta?.(filteredCases)?.value}
            deltaType={sc.computeDelta?.(filteredCases)?.type}
            sparklineData={sc.sparkline?.(filteredCases)}
          />
        ))}
      </DashboardGrid>

      {/* Charts */}
      <div className={`grid gap-6 ${config.charts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {config.charts.map((chart, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <SectionHeader title={chart.title} subtitle={chart.subtitle} />
            <div className="mt-4">
              <ConfigChart config={chart} cases={filteredCases} accent={config.accentColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader title={config.table.title} />
        <div className="mt-4">
          <DataTable
            data={config.table.getData(filteredCases)}
            columns={config.table.columns}
            keyField={config.table.keyField}
            maxRows={config.table.maxRows || 15}
          />
        </div>
      </div>
    </div>
  );
}
