import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { cn } from "../utils/cn";
import { Breadcrumbs } from "../components/dashboard/Breadcrumbs";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { DataTable, type Column } from "../components/dashboard/DataTable";
import { useSalesforceReport } from "../hooks/useSalesforceReport";
import { STATS_ID, TIMING_ID } from "../data/sfReportIds";
import type { DashboardResponse } from "../types/salesforce";
import {
  getDashMetric,
  getTimingCompliance,
  compliancePct,
  fmtNum,
} from "../utils/sfHelpers";

interface Issue {
  id: number;
  issue: string;
  owner: string;
  status: "Open" | "In Progress" | "Resolved";
  raised: string;
}

interface Todo {
  task: string;
  owner: string;
  due: string;
  done: boolean;
}

const issues: Issue[] = [
  { id: 1, issue: "Discovery backlog growing in Hartford office", owner: "Marcus Rivera", status: "Open", raised: "2026-02-10" },
  { id: 2, issue: "Expert retention delays in med-mal cases", owner: "Rachel Thompson", status: "In Progress", raised: "2026-02-05" },
  { id: 3, issue: "Client communication gaps in NYC pod", owner: "David Kim", status: "Open", raised: "2026-02-12" },
  { id: 4, issue: "SLA breach trend in Case Opening stage", owner: "Sarah Chen", status: "Resolved", raised: "2026-01-28" },
  { id: 5, issue: "Budget overrun on expert costs Q1", owner: "Robert Chen", status: "In Progress", raised: "2026-02-01" },
];

const initialTodos: Todo[] = [
  { task: "Review Hartford SLA improvement plan", owner: "Daniel Brooks", due: "2026-02-21", done: false },
  { task: "Finalize expert panel contracts", owner: "Rachel Thompson", due: "2026-02-25", done: false },
  { task: "Complete Q1 litigation forecast", owner: "Robert Chen", due: "2026-02-28", done: false },
  { task: "Update case assignment protocol", owner: "Marcus Rivera", due: "2026-02-14", done: true },
  { task: "Train new associates on discovery process", owner: "Maria Santos", due: "2026-02-20", done: false },
];

/* ---------- Metric row definitions ---------- */

type MetricKind = "count" | "compliance";

interface MetricDef {
  label: string;
  target: string;
  kind: MetricKind;
  /** Dashboard component title used with getDashMetric or getTimingCompliance */
  componentTitle: string;
  /** Which dashboard provides the data */
  source: "stats" | "timing";
  /** For count metrics: value that is "green" (0 = green when 0, -1 = no target) */
  greenValue?: number;
}

const metricDefs: MetricDef[] = [
  { label: "NJ Inventory",        target: "-",    kind: "count",      componentTitle: "NJ PI Inventory",          source: "stats",  greenValue: -1 },
  { label: "Missing Trackers",    target: "0",    kind: "count",      componentTitle: "Missing Trackers",         source: "stats",  greenValue: 0 },
  { label: "No Service 35+",      target: "0",    kind: "count",      componentTitle: "No Service 35+",           source: "stats",  greenValue: 0 },
  { label: "Missing Answers",     target: "0",    kind: "count",      componentTitle: "Missing Answers",          source: "stats",  greenValue: 0 },
  { label: "DED Extensions",      target: "-",    kind: "count",      componentTitle: "DED Extensions",           source: "timing", greenValue: -1 },
  { label: "NJ Resolutions",      target: "-",    kind: "count",      componentTitle: "NJ Resolutions",           source: "timing", greenValue: -1 },
  { label: "Complaint Filing %",  target: "≥80%", kind: "compliance", componentTitle: "Complaint Filing Timing",  source: "timing" },
  { label: "Form A %",            target: "≥80%", kind: "compliance", componentTitle: "Form A Timing",            source: "timing" },
  { label: "Form C %",            target: "≥80%", kind: "compliance", componentTitle: "Form C Timing",            source: "timing" },
  { label: "Deps %",              target: "≥80%", kind: "compliance", componentTitle: "Deps Timing",              source: "timing" },
];

function ragBadge(kind: MetricKind, value: number | null, greenValue?: number) {
  if (value === null) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">N/A</span>;
  }

  let color: string;
  let label: string;

  if (kind === "compliance") {
    if (value >= 80) { color = "bg-emerald-500/20 text-emerald-500"; label = "Green"; }
    else if (value >= 50) { color = "bg-amber-500/20 text-amber-500"; label = "Amber"; }
    else { color = "bg-red-500/20 text-red-500"; label = "Red"; }
  } else {
    // count metric
    if (greenValue === -1) {
      // no target — always neutral
      color = "bg-zinc-500/20 text-zinc-400";
      label = "-";
    } else if (value === (greenValue ?? 0)) {
      color = "bg-emerald-500/20 text-emerald-500";
      label = "Green";
    } else {
      color = "bg-red-500/20 text-red-500";
      label = "Red";
    }
  }

  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", color)}>{label}</span>;
}

/* ---------- Issue table columns ---------- */

const issueColumns: Column<Issue>[] = [
  { key: "id", label: "#" },
  { key: "issue", label: "Issue" },
  { key: "owner", label: "Owner" },
  {
    key: "status",
    label: "Status",
    render: (row: Issue) => {
      const colors =
        row.status === "Open"
          ? "bg-amber-500/20 text-amber-500"
          : row.status === "In Progress"
          ? "bg-blue-500/20 text-blue-500"
          : "bg-emerald-500/20 text-emerald-500";
      return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colors)}>
          {row.status}
        </span>
      );
    },
  },
  { key: "raised", label: "Raised" },
];

/* ---------- Component ---------- */

export default function ManagerRhythm() {
  const { data: statsData, loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: "dashboard" });
  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: "dashboard" });
  const loading = statsLoading || timingLoading;

  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const toggleTodo = (index: number) => {
    setTodos((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)));
  };

  function resolveValue(def: MetricDef): number | null {
    const dash = def.source === "stats" ? statsData : timingData;
    if (def.kind === "compliance") {
      return compliancePct(getTimingCompliance(dash, def.componentTitle));
    }
    return getDashMetric(dash, def.componentTitle);
  }

  function formatValue(def: MetricDef, value: number | null): string {
    if (value === null) return "-";
    if (def.kind === "compliance") return `${value}%`;
    return fmtNum(value);
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Control Tower", path: "/control-tower" },
          { label: "Manager Rhythm" },
        ]}
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeader title="Operating Scorecard" subtitle="Current snapshot from Salesforce" />

          {loading ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">Metric</th>
                    <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">Target</th>
                    <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">Current</th>
                    <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metricDefs.map((def) => {
                    const value = resolveValue(def);
                    return (
                      <tr key={def.label} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{def.label}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">{def.target}</td>
                        <td className="px-3 py-2 text-center font-mono text-foreground whitespace-nowrap">{formatValue(def, value)}</td>
                        <td className="px-3 py-2 text-center">{ragBadge(def.kind, value, def.greenValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader title="Issues List" subtitle="Open items requiring resolution" />
          <DataTable columns={issueColumns} data={issues} keyField="id" />
        </div>

        <div className="space-y-4">
          <SectionHeader title="To-Do Tracking" />
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            {todos.map((todo, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer" onClick={() => toggleTodo(i)}>
                {todo.done ? <CheckSquare className="h-4 w-4 text-emerald-500 flex-shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className={cn("text-sm", todo.done ? "line-through text-muted-foreground" : "text-foreground")}>{todo.task}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{todo.owner}</span>
                <span className={cn("text-xs whitespace-nowrap", todo.done ? "text-muted-foreground" : todo.due < "2026-02-19" ? "text-red-500" : "text-muted-foreground")}>{todo.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
