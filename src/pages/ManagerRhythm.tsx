import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, CheckSquare, Square } from "lucide-react";
import { cn } from "../utils/cn";
import { Breadcrumbs } from "../components/dashboard/Breadcrumbs";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { DataTable, type Column } from "../components/dashboard/DataTable";
import { getWeeklyThroughput, type WeeklyMetric } from "../data/mockData";

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

interface MetricRow {
  metric: string;
  owner: string;
  target: string;
  targetNum: number;
  comparator: "lte" | "gte" | "lt" | "gt";
  dataKey: string;
  format?: (v: number) => string;
}

const metricRows: MetricRow[] = [
  { metric: "New In", owner: "Intake", target: "10", targetNum: 10, comparator: "lte", dataKey: "newIn" },
  { metric: "Closed Out", owner: "Lit Team", target: "8", targetNum: 8, comparator: "gte", dataKey: "closedOut" },
  { metric: "Over SLA", owner: "Partners", target: "<15", targetNum: 15, comparator: "lt", dataKey: "overSla" },
  { metric: "Stall Count", owner: "Associates", target: "<8", targetNum: 8, comparator: "lt", dataKey: "stallCount" },
  { metric: "Next-Action %", owner: "All Attorneys", target: ">90%", targetNum: 90, comparator: "gt", dataKey: "nextActionPct", format: (v) => `${v}%` },
  { metric: "EV ($M)", owner: "CFO", target: ">$120M", targetNum: 120, comparator: "gt", dataKey: "ev", format: (v) => `$${v}` },
  { metric: "Throughput", owner: "Lit Team", target: ">5", targetNum: 5, comparator: "gt", dataKey: "throughput" },
];

function meetsTarget(value: number, targetNum: number, comparator: string): boolean {
  switch (comparator) {
    case "lte": return value <= targetNum;
    case "gte": return value >= targetNum;
    case "lt": return value < targetNum;
    case "gt": return value > targetNum;
    default: return false;
  }
}

function getMetricValue(w: WeeklyMetric, key: string): number {
  return (w as unknown as Record<string, number>)[key] ?? 0;
}

function isOnTrack(weeklyData: WeeklyMetric[], row: MetricRow): boolean {
  if (row.comparator === "lte" || row.comparator === "gte") {
    const last4 = weeklyData.slice(-4);
    const avg = last4.reduce((sum, w) => sum + getMetricValue(w, row.dataKey), 0) / last4.length;
    return meetsTarget(avg, row.targetNum, row.comparator);
  }
  const lastVal = weeklyData.length > 0 ? getMetricValue(weeklyData[weeklyData.length - 1], row.dataKey) : 0;
  return meetsTarget(lastVal, row.targetNum, row.comparator);
}

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

export default function ManagerRhythm() {
  const weeklyData = useMemo(() => getWeeklyThroughput(), []);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const toggleTodo = (index: number) => {
    setTodos((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)));
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Control Tower", path: "/control-tower" },
          { label: "Manager Rhythm" },
        ]}
      />

      <SectionHeader title="Weekly Operating Scorecard" subtitle="13-week trailing metrics" />
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">Metric</th>
              <th className="sticky left-[100px] z-10 bg-card px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">Owner</th>
              <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">Target</th>
              {weeklyData.map((_, i) => (
                <th key={i} className="px-2 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap">W{i + 1}</th>
              ))}
              <th className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">On Track?</th>
            </tr>
          </thead>
          <tbody>
            {metricRows.map((row) => {
              const onTrack = isOnTrack(weeklyData, row);
              return (
                <tr key={row.dataKey} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground whitespace-nowrap">{row.metric}</td>
                  <td className="sticky left-[100px] z-10 bg-card px-3 py-2 text-muted-foreground whitespace-nowrap">{row.owner}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">{row.target}</td>
                  {weeklyData.map((w, i) => {
                    const val = (w as unknown as Record<string, number>)[row.dataKey] ?? 0;
                    const meets = meetsTarget(val, row.targetNum, row.comparator);
                    const formatted = row.format ? row.format(val) : val;
                    return (
                      <td key={i} className={cn("px-2 py-2 text-center whitespace-nowrap font-mono", meets ? "text-emerald-500" : "text-red-500")}>
                        {formatted}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    {onTrack ? <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" /> : <XCircle className="inline-block h-4 w-4 text-red-500" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionHeader title="Issues List" subtitle="Open items requiring resolution" />
      <DataTable columns={issueColumns} data={issues} keyField="id" />

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
  );
}
