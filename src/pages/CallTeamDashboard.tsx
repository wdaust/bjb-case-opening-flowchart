import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { DataTable, type Column } from '../components/dashboard/DataTable.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.tsx';
import { cn } from '../utils/cn.ts';
import {
  getCallAgents,
  getAgentCallData,
  getCallTeamOverview,
  type CallSession,
  type DispositionRow,
  type DailyCallStats,
} from '../data/callTeamMockData.ts';
import { ChevronDown } from 'lucide-react';

// ── Session Heatmap ────────────────────────────────────────────────

function SessionHeatmap({ session }: { session: CallSession }) {
  const [open, setOpen] = useState(true);

  // Compute column totals
  const colTotals = useMemo(() => {
    const blockCount = session.grid[0]?.blocks.length ?? 0;
    const totals: number[] = Array(blockCount).fill(0);
    for (const row of session.grid) {
      for (let i = 0; i < row.blocks.length; i++) {
        totals[i] += row.blocks[i].calls;
      }
    }
    return totals;
  }, [session]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground text-sm">
            Session {session.sessionNumber}
          </span>
          <span className="text-xs text-muted-foreground">{session.timeRange}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-medium">
            {session.contactsMade} contacts
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
            {session.totalZeros} zeros
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
            {session.callAttempts} attempts
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-1 px-1.5 text-muted-foreground font-medium sticky left-0 bg-card min-w-[70px]">
                  Day
                </th>
                {session.grid[0]?.blocks.map((block) => (
                  <th
                    key={block.time}
                    className="py-1 px-0.5 text-muted-foreground font-normal text-center min-w-[32px]"
                  >
                    {block.time.replace(/^0/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.grid.map((row) => (
                <tr key={row.day}>
                  <td className="py-0.5 px-1.5 text-foreground font-medium sticky left-0 bg-card">
                    {row.day.slice(0, 3)}
                  </td>
                  {row.blocks.map((block, bIdx) => (
                    <td key={bIdx} className="py-0.5 px-0.5 text-center">
                      <div
                        className={cn(
                          "w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium mx-auto",
                          block.status === "no-calls" && "bg-red-500/20 text-red-400",
                          block.status === "calls" && "bg-card border border-border text-foreground",
                          block.status === "contact" && "bg-amber-400/15 ring-2 ring-amber-400 text-amber-300",
                          block.status === "appointment" && "bg-purple-500/25 text-purple-300",
                          block.status === "time-off" && "bg-blue-500/20 text-blue-400",
                        )}
                      >
                        {block.status === "time-off" ? "—" : block.calls}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t border-border">
                <td className="py-1 px-1.5 text-foreground font-bold sticky left-0 bg-card">
                  Total
                </td>
                {colTotals.map((total, i) => (
                  <td key={i} className="py-1 px-0.5 text-center">
                    <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold text-foreground mx-auto bg-muted/50">
                      {total}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-card border border-border" /> Normal
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/20" /> No Calls
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-400/15 ring-1 ring-amber-400" /> Contact
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500/25" /> Appointment
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500/20" /> Time Off
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Disposition Table ──────────────────────────────────────────────

function DispositionTable({ dispositions }: { dispositions: DispositionRow[] }) {
  const grandTotal = dispositions.reduce((s, d) => s + d.total, 0);
  const sessionTotals: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const d of dispositions) {
    for (let i = 0; i < 5; i++) sessionTotals[i] += d.bySession[i];
  }

  const maxVal = Math.max(...dispositions.flatMap(d => d.bySession), 1);

  function cellBg(val: number) {
    if (val === 0) return "";
    const intensity = Math.min(val / maxVal, 1);
    const alpha = Math.round(intensity * 25 + 5);
    return `rgba(20, 184, 166, ${alpha / 100})`;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
              Disposition Code
            </th>
            {[1, 2, 3, 4, 5].map(s => (
              <th key={s} className="text-center py-2 px-3 text-xs font-medium text-muted-foreground min-w-[60px]">
                SES {s}
              </th>
            ))}
            <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground min-w-[60px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {dispositions.map((d, i) => (
            <tr
              key={d.code}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                i % 2 === 0 ? "bg-card" : "bg-table-stripe"
              )}
            >
              <td className="py-2 px-3 text-foreground text-xs whitespace-nowrap">{d.code}</td>
              {d.bySession.map((val, sIdx) => (
                <td
                  key={sIdx}
                  className="py-2 px-3 text-center text-foreground text-xs"
                  style={{ backgroundColor: cellBg(val) }}
                >
                  {val}
                </td>
              ))}
              <td className="py-2 px-3 text-center text-foreground text-xs font-semibold">
                {d.total}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr className="border-t-2 border-border bg-muted/30">
            <td className="py-2 px-3 text-foreground text-xs font-bold">Total</td>
            {sessionTotals.map((val, i) => (
              <td key={i} className="py-2 px-3 text-center text-foreground text-xs font-bold">
                {val}
              </td>
            ))}
            <td className="py-2 px-3 text-center text-foreground text-xs font-bold">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

const dailyColumns: Column<DailyCallStats & { key: string }>[] = [
  { key: "day", label: "Day" },
  { key: "totalCalls", label: "Total Calls", sortable: true },
  { key: "contactsMade", label: "Contacts Made", sortable: true },
  { key: "contactRate", label: "Contact Rate", render: (row) => `${row.contactRate}%` },
  { key: "appointments", label: "Appointments", sortable: true },
  { key: "avgCallTime", label: "Avg Call Time" },
];

export default function CallTeamDashboard() {
  const agents = useMemo(() => getCallAgents(), []);
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0].id);

  const teamOverview = useMemo(() => getCallTeamOverview(), []);
  const agentData = useMemo(() => getAgentCallData(selectedAgentId), [selectedAgentId]);

  const teamDailyRows = useMemo(
    () => teamOverview.dailyStats.map(d => ({ ...d, key: d.day })),
    [teamOverview]
  );
  const agentDailyRows = useMemo(
    () => agentData.dailyStats.map(d => ({ ...d, key: d.day })),
    [agentData]
  );

  const teamChartData = useMemo(
    () => teamOverview.dailyStats.map(d => ({ name: d.day.slice(0, 3), calls: d.totalCalls })),
    [teamOverview]
  );
  const agentChartData = useMemo(
    () => agentData.dailyStats.map(d => ({ name: d.day.slice(0, 3), calls: d.totalCalls })),
    [agentData]
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Development", path: "/performance-infrastructure" },
          { label: "Call Team Dashboard" },
        ]}
      />
      <h1 className="text-2xl font-bold text-foreground">Call Team Dashboard</h1>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team Overview</TabsTrigger>
          <TabsTrigger value="agent">Individual Agent</TabsTrigger>
        </TabsList>

        {/* ── Team Overview ── */}
        <TabsContent value="team" className="space-y-6 mt-4">
          {/* KPI Row */}
          <DashboardGrid cols={6}>
            <StatCard label="Total Calls" value={teamOverview.totalCalls.toLocaleString()} />
            <StatCard label="Avg Calls/Day" value={teamOverview.avgCallsPerDay.toLocaleString()} />
            <StatCard label="Zero-Call Blocks" value={teamOverview.zeroCallBlocks} />
            <StatCard label="Appointments Set" value={teamOverview.appointmentsSet} />
            <StatCard label="Active Calling %" value={`${teamOverview.activeCallingPct}%`} />
            <StatCard label="Active Call Time" value={teamOverview.activeCallTime} />
          </DashboardGrid>

          {/* Session Heatmaps */}
          <div>
            <SectionHeader title="Session Performance" subtitle={`${teamOverview.totalAgents} agents across 5 daily sessions`} />
            <div className="space-y-3">
              {teamOverview.sessions.map(session => (
                <SessionHeatmap key={session.sessionNumber} session={session} />
              ))}
            </div>
          </div>

          {/* Daily Performance */}
          <div>
            <SectionHeader title="Daily Summary" />
            <DataTable
              data={teamDailyRows}
              columns={dailyColumns}
              keyField="key"
            />
          </div>

          {/* Dispositions */}
          <div>
            <SectionHeader title="Dispositions" />
            <DispositionTable dispositions={teamOverview.dispositions} />
          </div>

          {/* Weekly Trend */}
          <div>
            <SectionHeader title="Weekly Trend" />
            <div className="rounded-lg border border-border bg-card p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={teamChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── Individual Agent ── */}
        <TabsContent value="agent" className="space-y-6 mt-4">
          {/* Agent Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Agent:</label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.team}
                </option>
              ))}
            </select>
          </div>

          {/* KPI Row */}
          <DashboardGrid cols={6}>
            <StatCard label="Total Calls" value={agentData.totalCalls.toLocaleString()} />
            <StatCard label="Avg Calls/Day" value={agentData.avgCallsPerDay.toLocaleString()} />
            <StatCard label="Zero-Call Blocks" value={agentData.zeroCallBlocks} />
            <StatCard label="Appointments Set" value={agentData.appointmentsSet} />
            <StatCard label="Active Calling %" value={`${agentData.activeCallingPct}%`} />
            <StatCard label="Active Call Time" value={agentData.activeCallTime} />
          </DashboardGrid>

          {/* Pay Breakdown */}
          <div>
            <SectionHeader title="Pay Breakdown" />
            <DashboardGrid cols={4}>
              <StatCard label="Pay for Calling" value={`$${agentData.pay.payForCalling.toLocaleString()}`} />
              <StatCard label="Apt Pay Bonus" value={`$${agentData.pay.aptPayBonus.toLocaleString()}`} />
              <StatCard label="Calling Bonus" value={`$${agentData.pay.callingBonus.toLocaleString()}`} />
              <StatCard label="Total Pay" value={`$${agentData.pay.totalPay.toLocaleString()}`} />
            </DashboardGrid>
          </div>

          {/* Session Heatmaps */}
          <div>
            <SectionHeader title="Session Performance" subtitle={`${agentData.agent.name} — ${agentData.agent.team}`} />
            <div className="space-y-3">
              {agentData.sessions.map(session => (
                <SessionHeatmap key={session.sessionNumber} session={session} />
              ))}
            </div>
          </div>

          {/* Daily Performance */}
          <div>
            <SectionHeader title="Daily Summary" />
            <DataTable
              data={agentDailyRows}
              columns={dailyColumns}
              keyField="key"
            />
          </div>

          {/* Dispositions */}
          <div>
            <SectionHeader title="Dispositions" />
            <DispositionTable dispositions={agentData.dispositions} />
          </div>

          {/* Weekly Trend */}
          <div>
            <SectionHeader title="Weekly Trend" />
            <div className="rounded-lg border border-border bg-card p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
