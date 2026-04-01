import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { StatCard } from '../dashboard/StatCard.tsx';
import { DashboardGrid } from '../dashboard/DashboardGrid.tsx';
import type { DashboardComponent } from '../../types/salesforce.ts';
import { cn } from '../../utils/cn.ts';

interface Props {
  components: DashboardComponent[];
  className?: string;
}

const COLORS = ['#22c55e', '#22c55ecc', '#22c55e99', '#22c55e66', '#22c55e33', '#555555', '#444444', '#333333'];

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(220,15%,10%)', border: '1px solid hsl(220,10%,20%)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#fff' },
  itemStyle: { color: '#a1a1aa' },
};

function MetricChart({ comp }: { comp: DashboardComponent }) {
  if (comp.rows.length === 1 && comp.rows[0].values.length === 1) {
    const val = comp.rows[0].values[0].value;
    return (
      <StatCard
        label={comp.title}
        value={val !== null ? val.toLocaleString() : '—'}
        variant="glass"
      />
    );
  }

  const chartData = comp.rows.map(r => ({
    name: r.label,
    ...Object.fromEntries(r.values.map((v, i) => [comp.columns[i] ?? `val_${i}`, v.value ?? 0])),
  }));

  if (comp.chartType.toLowerCase().includes('donut') || comp.chartType.toLowerCase().includes('pie')) {
    const dataKey = comp.columns[0] ?? 'val_0';
    return (
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
        <p className="text-xs font-medium text-white/60 mb-3">{comp.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={chartData} dataKey={dataKey} nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
      <p className="text-xs font-medium text-white/60 mb-3">{comp.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
          <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
          <Tooltip {...tooltipStyle} />
          {comp.columns.map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardRenderer({ components, className }: Props) {
  const cols = Math.min(components.length, 3) as 1 | 2 | 3;
  return (
    <DashboardGrid cols={cols} className={cn("gap-4", className)}>
      {components.map((comp, i) => (
        <MetricChart key={i} comp={comp} />
      ))}
    </DashboardGrid>
  );
}
