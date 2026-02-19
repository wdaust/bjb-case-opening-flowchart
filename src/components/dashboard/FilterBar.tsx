import { useDashboardFilters } from '../../contexts/DashboardFilterContext';
import { cn } from '../../utils/cn';
import { Filter, X } from 'lucide-react';
import { attorneys } from '../../data/mockData';

const offices = ["all", "Hartford", "NYC", "Chicago"];
const pods = ["all", "Hartford Lit Team", "NYC Lit Team", "Chicago Lit Team"];
const caseTypes = ["all", "PI", "Med Mal", "Product Liability", "Premises Liability", "Auto Accident", "Wrongful Death"];
const venues = ["all", "CT Superior", "SDNY", "NDIL", "EDNY", "CT Federal", "NJ Superior", "NY Supreme"];
const dateRanges = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

interface Props {
  className?: string;
}

export function FilterBar({ className }: Props) {
  const { filters, setFilter, resetFilters } = useDashboardFilters();
  const hasFilters = Object.entries(filters).some(([k, v]) => {
    if (k === "dateRange") return v !== "30d";
    return v !== "all";
  });

  const selectClass = "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-card/50", className)}>
      <Filter size={14} className="text-muted-foreground shrink-0" />

      <select value={filters.office} onChange={e => setFilter("office", e.target.value)} className={selectClass}>
        {offices.map(o => <option key={o} value={o}>{o === "all" ? "All Offices" : o}</option>)}
      </select>

      <select value={filters.pod} onChange={e => setFilter("pod", e.target.value)} className={selectClass}>
        {pods.map(p => <option key={p} value={p}>{p === "all" ? "All Pods" : p}</option>)}
      </select>

      <select value={filters.attorney} onChange={e => setFilter("attorney", e.target.value)} className={selectClass}>
        <option value="all">All Attorneys</option>
        {attorneys.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
      </select>

      <select value={filters.caseType} onChange={e => setFilter("caseType", e.target.value)} className={selectClass}>
        {caseTypes.map(t => <option key={t} value={t}>{t === "all" ? "All Case Types" : t}</option>)}
      </select>

      <select value={filters.venue} onChange={e => setFilter("venue", e.target.value)} className={selectClass}>
        {venues.map(v => <option key={v} value={v}>{v === "all" ? "All Venues" : v}</option>)}
      </select>

      <div className="flex gap-1 ml-auto">
        {dateRanges.map(dr => (
          <button
            key={dr.value}
            onClick={() => setFilter("dateRange", dr.value)}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              filters.dateRange === dr.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {dr.label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <button onClick={resetFilters} className="p-1 rounded hover:bg-accent text-muted-foreground" title="Clear filters">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
