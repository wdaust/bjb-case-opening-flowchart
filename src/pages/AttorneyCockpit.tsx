import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { cn } from "../utils/cn";
import { Breadcrumbs } from "../components/dashboard/Breadcrumbs";
import { DashboardGrid } from "../components/dashboard/DashboardGrid";
import { StatCard } from "../components/dashboard/StatCard";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { DataTable, type Column } from "../components/dashboard/DataTable";
import {
  attorneys,
  getCasesByAttorney,
  stageLabels,
  stageOrder,
  getDaysInStage,
  getSlaStatus,
  getWeeklyThroughput,
  type LitCase,
} from "../data/mockData";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default function AttorneyCockpit() {
  const { attorneyId } = useParams();
  const navigate = useNavigate();

  const att = useMemo(() => {
    if (attorneyId) {
      return attorneys.find((a) => a.id === attorneyId) ?? attorneys[0];
    }
    return attorneys[0];
  }, [attorneyId]);

  const attCases = useMemo(() => getCasesByAttorney(att.name), [att.name]);
  const activeCases = useMemo(() => attCases.filter((c) => c.status === "active"), [attCases]);

  const stageData = useMemo(() => {
    const counts: Record<string, { stage: string; label: string; count: number }> = {};
    for (const s of stageOrder) {
      counts[s] = { stage: s, label: stageLabels[s], count: 0 };
    }
    for (const c of attCases) {
      if (counts[c.stage]) counts[c.stage].count++;
    }
    return stageOrder.map((s) => counts[s]);
  }, [attCases]);

  const weeklyData = useMemo(() => getWeeklyThroughput(), []);

  const highPriorityCases = useMemo(
    () => [...activeCases].sort((a, b) => b.expectedValue - a.expectedValue),
    [activeCases]
  );

  const overdueCases = useMemo(() => {
    const today = "2026-02-19";
    return activeCases
      .filter((c) => c.nextActionDue < today)
      .map((c) => ({
        ...c,
        daysOverdue: Math.floor(
          (new Date(today).getTime() - new Date(c.nextActionDue).getTime()) / 86400000
        ),
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [activeCases]);

  type OverdueCase = LitCase & { daysOverdue: number };

  const caseColumns: Column<LitCase>[] = [
    { key: "id", label: "Case ID" },
    { key: "title", label: "Title" },
    {
      key: "stage",
      label: "Stage",
      render: (row: LitCase) => stageLabels[row.stage],
    },
    {
      key: "stageEntryDate",
      label: "Days in Stage",
      render: (row: LitCase) => getDaysInStage(row),
    },
    {
      key: "slaTarget",
      label: "SLA Status",
      render: (row: LitCase) => {
        const status = getSlaStatus(row);
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              status === "breach"
                ? "bg-red-500/20 text-red-500"
                : status === "warning"
                ? "bg-amber-500/20 text-amber-500"
                : "bg-emerald-500/20 text-emerald-500"
            )}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "expectedValue",
      label: "Expected Value",
      render: (row: LitCase) => fmtCurrency(row.expectedValue),
    },
    {
      key: "riskFlags",
      label: "Risk Flags",
      render: (row: LitCase) =>
        row.riskFlags.length > 0 ? row.riskFlags.join(", ") : "—",
    },
  ];

  const backlogColumns: Column<OverdueCase>[] = [
    { key: "id", label: "Case ID" },
    { key: "nextAction", label: "Next Action" },
    { key: "nextActionDue", label: "Due Date" },
    {
      key: "daysOverdue",
      label: "Days Overdue",
      render: (row: OverdueCase) => (
        <span className="text-red-500 font-medium">{row.daysOverdue}d</span>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Control Tower", path: "/control-tower" },
          { label: "Attorney Cockpit" },
        ]}
      />

      {/* Attorney Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="attorney-select" className="text-sm font-medium text-muted-foreground">
          Attorney
        </label>
        <select
          id="attorney-select"
          value={att.id}
          onChange={(e) => navigate(`/attorney/${e.target.value}`)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[240px]"
        >
          {attorneys.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.role}
            </option>
          ))}
        </select>
      </div>

      <DashboardGrid cols={4}>
        <StatCard label="Case Count" value={att.caseCount} />
        <StatCard
          label="Over SLA"
          value={att.overSlaCount}
          deltaType={att.overSlaCount > 0 ? "negative" : "neutral"}
        />
        <StatCard
          label="Silent Stalls"
          value={att.stallCount}
          deltaType={att.stallCount > 0 ? "negative" : "neutral"}
        />
        <StatCard
          label="Next-Action Coverage"
          value={`${(att.nextActionCoverage * 100).toFixed(0)}%`}
          deltaType={att.nextActionCoverage > 0.9 ? "positive" : "neutral"}
        />
      </DashboardGrid>

      <SectionHeader title="Portfolio by Stage" />
      <div className="bg-card border border-border rounded-xl p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis stroke="hsl(var(--foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="Throughput Trend" subtitle="Exits per week (13-week trailing)" />
      <div className="bg-card border border-border rounded-xl p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis stroke="hsl(var(--foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
            <Line type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="High Priority Cases" subtitle="High EV or high risk cases" />
      <DataTable
        columns={caseColumns}
        data={highPriorityCases}
        keyField="id"
        onRowClick={(row) => navigate(`/case/${row.id}`)}
        maxRows={20}
      />

      <SectionHeader title="Task Backlog" />
      {overdueCases.length > 0 ? (
        <DataTable
          columns={backlogColumns}
          data={overdueCases}
          keyField="id"
          onRowClick={(row) => navigate(`/case/${row.id}`)}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
          No overdue tasks. All caught up!
        </div>
      )}
    </div>
  );
}
