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

const RED_KEYWORDS = ['overdue', 'late', 'not compliant', 'past due', 'no attempt', 'no service', 'missing'];
const AMBER_KEYWORDS = ['15-30 days', 'pending', 'within 30 days', '0-14 days'];
const GREEN_KEYWORDS = ['timely', 'compliant', 'completed', 'on track', 'connection'];

function getRowColor(label: string): string {
  const lower = label.toLowerCase();
  if (RED_KEYWORDS.some(k => lower.includes(k))) return '#ef4444';
  if (AMBER_KEYWORDS.some(k => lower.includes(k))) return '#f59e0b';
  if (GREEN_KEYWORDS.some(k => lower.includes(k))) return '#22c55e';
  return '#6b7280';
}

const URGENCY_KEYWORDS = ['missing', 'overdue', 'past due', 'no service', 'not served'];

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(220,15%,10%)', border: '1px solid hsl(220,10%,20%)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#fff' },
  itemStyle: { color: '#a1a1aa' },
};

function MetricChart({ comp }: { comp: DashboardComponent }) {
  if (comp.rows.length === 1 && comp.rows[0].values.length === 1) {
    const val = comp.rows[0].values[0].value;
    const titleLower = comp.title.toLowerCase();
    const isUrgent = val !== null && val > 0 && URGENCY_KEYWORDS.some(k => titleLower.includes(k));
    return (
      <StatCard
        label={comp.title}
        value={val !== null ? val.toLocaleString() : '—'}
        variant="glass"
        className={isUrgent ? 'bg-red-500/10 border-l-2 border-l-red-500' : undefined}
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
            <Pie data={chartData} dataKey={dataKey} nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getRowColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#a1a1aa' }}
              formatter={(value: string) => value.length > 28 ? value.slice(0, 26) + '…' : value}
            />
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
          {comp.columns.map((col) => (
            <Bar key={col} dataKey={col} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, j) => (
                <Cell key={j} fill={getRowColor(entry.name)} />
              ))}
            </Bar>
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
