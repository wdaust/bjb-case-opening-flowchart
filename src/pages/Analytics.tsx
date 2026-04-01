import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { StatCard } from '../components/dashboard/StatCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  getResolutionTimingData,
  getComplaintFilingData,
  getDiscoveryTimingData,
  getExpertData,
  getInventorySnapshot,
  getTimingKPIs,
  type ResolutionRecord,
  type ComplaintRecord,
  type DiscoveryRecord,
  type MatterRecord,
} from '../data/analyticsData';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
const HEATMAP_COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'];

function durationBand(days: number): string {
  if (days < 180) return '<6mo';
  if (days < 365) return '6-12mo';
  if (days < 548) return '12-18mo';
  if (days < 730) return '18-24mo';
  return '24mo+';
}

// ─── Tab 1: Resolution Timing ────────────────────────────────────

function ResolutionTimingTab() {
  const resolutions = useMemo(() => getResolutionTimingData(), []);
  const kpis = useMemo(() => getTimingKPIs(), []);

  const byQuarter = useMemo(() => {
    const map: Record<string, { quarter: string; total: number; count: number }> = {};
    resolutions.forEach(r => {
      if (!map[r.quarter]) map[r.quarter] = { quarter: r.quarter, total: 0, count: 0 };
      map[r.quarter].total += r.daysToResolution;
      map[r.quarter].count++;
    });
    return Object.values(map)
      .map(d => ({ quarter: d.quarter, avgDays: Math.round(d.total / d.count) }))
      .sort((a, b) => {
        const [aq, ay] = a.quarter.split(' ');
        const [bq, by_] = b.quarter.split(' ');
        return (+ay - +by_) || (+aq.replace('Q', '') - +bq.replace('Q', ''));
      })
      .slice(-8);
  }, [resolutions]);

  const histogram = useMemo(() => {
    const bins: Record<number, number> = {};
    resolutions.forEach(r => {
      const bin = Math.floor(r.daysToResolution / 30) * 30;
      bins[bin] = (bins[bin] || 0) + 1;
    });
    return Object.entries(bins)
      .map(([bin, count]) => ({ bin: `${bin}-${+bin + 29}d`, binNum: +bin, count }))
      .sort((a, b) => a.binNum - b.binNum);
  }, [resolutions]);

  const heatmap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const bands = ['<6mo', '6-12mo', '12-18mo', '18-24mo', '24mo+'];
    resolutions.forEach(r => {
      const band = durationBand(r.daysToResolution);
      if (!map[r.attorney]) {
        map[r.attorney] = {};
        bands.forEach(b => map[r.attorney][b] = 0);
      }
      map[r.attorney][band]++;
    });
    return Object.entries(map)
      .map(([attorney, bandCounts]) => ({ attorney, ...bandCounts }))
      .sort((a, b) => {
        const aTotal = bands.reduce((s, band) => s + ((a as Record<string, number>)[band] || 0), 0);
        const bTotal = bands.reduce((s, band) => s + ((b as Record<string, number>)[band] || 0), 0);
        return bTotal - aTotal;
      })
      .slice(0, 15);
  }, [resolutions]);

  const longestOpen: Column<ResolutionRecord>[] = [
    { key: 'id', label: 'ID' },
    { key: 'matterName', label: 'Matter' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'incidentDate', label: 'Incident Date' },
    {
      key: 'daysToResolution',
      label: 'Days to Resolution',
      render: (row) => {
        const color = row.daysToResolution > 730 ? 'text-red-500' : row.daysToResolution > 548 ? 'text-amber-500' : 'text-green-500';
        return <span className={`font-semibold ${color}`}>{row.daysToResolution}d</span>;
      },
    },
  ];

  const bands = ['<6mo', '6-12mo', '12-18mo', '18-24mo', '24mo+'] as const;

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Median Days to Resolution" value={kpis.medianDaysToResolution} delta="all matters" deltaType="neutral" />
        <StatCard label="Complaint → Resolution" value={`${kpis.medianComplaintToResolution}d`} delta="median" deltaType="neutral" />
        <StatCard label="Assigned → Resolution" value={`${kpis.medianAssignedToResolution}d`} delta="median" deltaType="neutral" />
        <StatCard label="Resolutions (12mo)" value={kpis.totalResolutions12mo} delta="trailing 12 months" deltaType="positive" />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Avg Resolution Time by Quarter" subtitle="Last 8 quarters" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byQuarter}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="quarter" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} days`, 'Avg']} />
                <Bar dataKey="avgDays" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Resolution Duration Distribution" subtitle="30-day bins" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bin" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Resolution Timing by Attorney" subtitle="Duration band heatmap — top 15 attorneys" />
        <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left py-2 px-3">Attorney</th>
                {bands.map(b => <th key={b} className="text-center py-2 px-3">{b}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatmap.map(row => (
                <tr key={row.attorney} className="border-t border-border">
                  <td className="py-2 px-3 text-foreground font-medium whitespace-nowrap">{row.attorney}</td>
                  {bands.map(band => {
                    const val = (row as Record<string, number | string>)[band] as number || 0;
                    const maxVal = 40;
                    const intensity = Math.min(val / maxVal, 1);
                    const colorIdx = Math.min(Math.floor(intensity * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1);
                    return (
                      <td key={band} className="text-center py-2 px-3">
                        <span
                          className="inline-block w-10 h-7 rounded flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: HEATMAP_COLORS[colorIdx], color: intensity > 0.3 ? '#fff' : 'hsl(var(--muted-foreground))' }}
                        >
                          {val || ''}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SectionHeader title="Longest Resolutions" subtitle="Sorted by days to resolution" />
      <DataTable
        data={[...resolutions].sort((a, b) => b.daysToResolution - a.daysToResolution).slice(0, 25)}
        columns={longestOpen}
        keyField="id"
      />
    </div>
  );
}

// ─── Tab 2: Complaint & Filing ───────────────────────────────────

function ComplaintFilingTab() {
  const complaints = useMemo(() => getComplaintFilingData(), []);
  const kpis = useMemo(() => getTimingKPIs(), []);

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach(c => { map[c.status] = (map[c.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const byTeam = useMemo(() => {
    const map: Record<string, { team: string; total: number; count: number }> = {};
    complaints.filter(c => c.daysToFile != null).forEach(c => {
      if (!map[c.team]) map[c.team] = { team: c.team, total: 0, count: 0 };
      map[c.team].total += c.daysToFile!;
      map[c.team].count++;
    });
    return Object.values(map).map(d => ({ team: d.team, avgDays: Math.round(d.total / d.count) }));
  }, [complaints]);

  const overdueList = useMemo(() =>
    complaints.filter(c => c.status === 'Overdue').sort((a, b) => b.daysOverdue - a.daysOverdue),
  [complaints]);

  const overdueColumns: Column<ComplaintRecord>[] = [
    { key: 'id', label: 'ID' },
    { key: 'matterName', label: 'Matter' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'team', label: 'Team' },
    { key: 'assignedDate', label: 'Assigned' },
    {
      key: 'daysOverdue',
      label: 'Days Overdue',
      render: (row) => {
        const color = row.daysOverdue > 60 ? 'text-red-500' : row.daysOverdue > 30 ? 'text-amber-500' : 'text-yellow-500';
        return <span className={`font-semibold ${color}`}>{row.daysOverdue}d</span>;
      },
    },
  ];

  const donutColors = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Avg Days to File" value={`${kpis.avgDaysToFile}d`} delta="assigned → complaint" deltaType="neutral" />
        <StatCard label="Filed This Month" value={kpis.complaintsThisMonth} delta="March 2026" deltaType="positive" />
        <StatCard
          label="Overdue Complaints"
          value={kpis.overdueComplaints.reduce((s, b) => s + b.count, 0)}
          delta="past 60-day target"
          deltaType="negative"
          subMetrics={kpis.overdueComplaints.map(b => ({ label: b.band, value: b.count, deltaType: b.count > 5 ? 'negative' as const : 'neutral' as const }))}
        />
        <StatCard label="Filing Compliance" value={`${kpis.filingComplianceRate}%`} delta="filed / total" deltaType={kpis.filingComplianceRate > 70 ? 'positive' : 'negative'} />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Filing Status" subtitle="Current breakdown" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Filing Time by Team" subtitle="Average days to file complaint" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byTeam}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="team" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} days`, 'Avg']} />
                <Bar dataKey="avgDays" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SectionHeader title="Overdue Filings" subtitle="Sorted by days overdue" />
      <DataTable data={overdueList.slice(0, 25)} columns={overdueColumns} keyField="id" />
    </div>
  );
}

// ─── Tab 3: Discovery & Expert ───────────────────────────────────

function DiscoveryExpertTab() {
  const discovery = useMemo(() => getDiscoveryTimingData(), []);
  const experts = useMemo(() => getExpertData(), []);
  const kpis = useMemo(() => getTimingKPIs(), []);

  const byCourt = useMemo(() => {
    const map: Record<string, { court: string; formC: number; letter: number; motion: number; count: number }> = {};
    discovery.forEach(d => {
      if (!map[d.court]) map[d.court] = { court: d.court, formC: 0, letter: 0, motion: 0, count: 0 };
      if (d.daysToFormC != null) map[d.court].formC += d.daysToFormC;
      if (d.daysFormCToLetter != null) map[d.court].letter += d.daysFormCToLetter;
      if (d.daysLetterToMotion != null) map[d.court].motion += d.daysLetterToMotion;
      map[d.court].count++;
    });
    return Object.values(map).map(d => ({
      court: d.court,
      'Form C': Math.round(d.formC / Math.max(d.count, 1)),
      '10-Day Letter': Math.round(d.letter / Math.max(d.count, 1)),
      'Motion Filed': Math.round(d.motion / Math.max(d.count, 1)),
    }));
  }, [discovery]);

  const expertTop20 = useMemo(() => experts.slice(0, 20), [experts]);

  const discColumns: Column<DiscoveryRecord>[] = [
    { key: 'id', label: 'ID' },
    { key: 'matterName', label: 'Matter' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'court', label: 'Court' },
    { key: 'formCReceived', label: 'Form C', render: (r) => <span>{r.formCReceived || '—'}</span> },
    { key: 'tenDayLetterSent', label: '10-Day Letter', render: (r) => <span>{r.tenDayLetterSent || '—'}</span> },
    { key: 'motionFiledDate', label: 'Motion Filed', render: (r) => <span>{r.motionFiledDate || '—'}</span> },
    {
      key: 'daysToFormC',
      label: 'Gap (days)',
      render: (r) => {
        const total = (r.daysToFormC || 0) + (r.daysFormCToLetter || 0) + (r.daysLetterToMotion || 0);
        const color = total > 150 ? 'text-red-500' : total > 90 ? 'text-amber-500' : 'text-green-500';
        return <span className={`font-semibold ${color}`}>{total || '—'}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Avg Days to Form C" value={`${kpis.avgDaysToFormC}d`} delta="from case opening" deltaType="neutral" />
        <StatCard label="Form C → 10-Day Letter" value={`${kpis.avgFormCToLetter}d`} delta="average" deltaType="neutral" />
        <StatCard label="Letter → Motion Filed" value={`${kpis.avgLetterToMotion}d`} delta="average" deltaType="neutral" />
        <StatCard label="Experts Not Served" value={kpis.expertsNotServed} delta="total unserved" deltaType="negative" />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Discovery Milestone Timing by Court" subtitle="Average days per milestone" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCourt}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="court" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="Form C" stackId="a" fill="#6366f1" />
                <Bar dataKey="10-Day Letter" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="Motion Filed" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Experts Not Served by Attorney" subtitle="Top 20" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expertTop20} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="attorney" type="category" width={100} stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="unservedCount" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SectionHeader title="Discovery Trackers" subtitle="Milestone dates and gaps" />
      <DataTable data={discovery.slice(0, 25)} columns={discColumns} keyField="id" />
    </div>
  );
}

// ─── Tab 4: Inventory Snapshot ────────────────────────────────────

function InventorySnapshotTab() {
  const inventory = useMemo(() => getInventorySnapshot(), []);
  const kpis = useMemo(() => getTimingKPIs(), []);

  const byPIStatus = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(m => { map[m.piStatus] = (map[m.piStatus] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const byState = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(m => { map[m.state] = (map[m.state] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [inventory]);

  const byNegotiation = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach(m => { map[m.negotiationStatus] = (map[m.negotiationStatus] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
  }, [inventory]);

  const heatmap = useMemo(() => {
    const stages = ['Case Opening', 'Discovery', 'Expert', 'Deposition', 'Arb/Med', 'Trial Prep', 'Trial'];
    const map: Record<string, Record<string, number>> = {};
    inventory.forEach(m => {
      if (!map[m.attorney]) {
        map[m.attorney] = {};
        stages.forEach(s => map[m.attorney][s] = 0);
      }
      map[m.attorney][m.activeStage]++;
    });
    return Object.entries(map)
      .map(([attorney, stageCounts]) => ({ attorney, ...stageCounts }))
      .sort((a, b) => {
        const aT = stages.reduce((s, st) => s + ((a as Record<string, number>)[st] || 0), 0);
        const bT = stages.reduce((s, st) => s + ((b as Record<string, number>)[st] || 0), 0);
        return bT - aT;
      })
      .slice(0, 15);
  }, [inventory]);

  const stages = ['Case Opening', 'Discovery', 'Expert', 'Deposition', 'Arb/Med', 'Trial Prep', 'Trial'];

  const solColumns: Column<MatterRecord>[] = [
    { key: 'id', label: 'ID' },
    { key: 'matterName', label: 'Matter' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'activeStage', label: 'Stage' },
    { key: 'solDate', label: 'SOL Date' },
    {
      key: 'daysToSOL',
      label: 'Days to SOL',
      render: (row) => {
        const color = row.daysToSOL < 30 ? 'text-red-500' : row.daysToSOL < 60 ? 'text-amber-500' : 'text-yellow-500';
        return <span className={`font-semibold ${color}`}>{row.daysToSOL}d</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Active Inventory" value={kpis.activeInventory.toLocaleString()} delta="total matters" deltaType="neutral" />
        <StatCard
          label="By PI Status"
          value={byPIStatus.length}
          delta="categories"
          deltaType="neutral"
          subMetrics={byPIStatus.slice(0, 3).map(p => ({ label: p.name, value: p.value, deltaType: 'neutral' as const }))}
        />
        <StatCard label="SOL < 90 Days" value={kpis.mattersSOLUnder90} delta="urgent attention" deltaType={kpis.mattersSOLUnder90 > 50 ? 'negative' : 'neutral'} />
        <StatCard label="Avg Case Age" value={`${kpis.avgCaseAge}d`} delta="days since incident" deltaType="neutral" />
      </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Matters by PI Status" subtitle="Current distribution" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byPIStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byPIStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Matters by State" subtitle="Geographic distribution" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byState}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byState.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Negotiation Status" subtitle="Current breakdown" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byNegotiation}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <SectionHeader title="Attorney × Stage Heatmap" subtitle="Matter count — top 15 attorneys" />
          <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left py-2 px-2">Attorney</th>
                  {stages.map(s => <th key={s} className="text-center py-2 px-1 whitespace-nowrap">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmap.map(row => (
                  <tr key={row.attorney} className="border-t border-border">
                    <td className="py-1.5 px-2 text-foreground font-medium whitespace-nowrap text-xs">{row.attorney}</td>
                    {stages.map(stage => {
                      const val = (row as Record<string, number | string>)[stage] as number || 0;
                      const intensity = Math.min(val / 20, 1);
                      const colorIdx = Math.min(Math.floor(intensity * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1);
                      return (
                        <td key={stage} className="text-center py-1.5 px-1">
                          <span
                            className="inline-block w-8 h-6 rounded flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: HEATMAP_COLORS[colorIdx], color: intensity > 0.3 ? '#fff' : 'hsl(var(--muted-foreground))' }}
                          >
                            {val || ''}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SectionHeader title="SOL Approaching" subtitle="Matters with SOL < 90 days" />
      <DataTable
        data={inventory.filter(m => m.daysToSOL > 0 && m.daysToSOL < 90).sort((a, b) => a.daysToSOL - b.daysToSOL).slice(0, 25)}
        columns={solColumns}
        keyField="id"
      />
    </div>
  );
}

// ─── Main Analytics Page ─────────────────────────────────────────

export default function Analytics() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <FilterBar />
      <SectionHeader title="NJ LIT Analytics" subtitle="How long things take — timing analytics across resolution, filing, discovery, and inventory" />

      <Tabs defaultValue="resolution">
        <TabsList>
          <TabsTrigger value="resolution">Resolution Timing</TabsTrigger>
          <TabsTrigger value="complaint">Complaint & Filing</TabsTrigger>
          <TabsTrigger value="discovery">Discovery & Expert</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Snapshot</TabsTrigger>
        </TabsList>
        <TabsContent value="resolution" className="pt-4">
          <ResolutionTimingTab />
        </TabsContent>
        <TabsContent value="complaint" className="pt-4">
          <ComplaintFilingTab />
        </TabsContent>
        <TabsContent value="discovery" className="pt-4">
          <DiscoveryExpertTab />
        </TabsContent>
        <TabsContent value="inventory" className="pt-4">
          <InventorySnapshotTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
