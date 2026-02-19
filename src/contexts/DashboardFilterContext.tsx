import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DashboardFilters {
  office: string;
  pod: string;
  attorney: string;
  caseType: string;
  venue: string;
  dateRange: "7d" | "30d" | "90d" | "all";
}

const defaultFilters: DashboardFilters = {
  office: "all",
  pod: "all",
  attorney: "all",
  caseType: "all",
  venue: "all",
  dateRange: "30d",
};

interface FilterContextValue {
  filters: DashboardFilters;
  setFilter: (key: keyof DashboardFilters, value: string) => void;
  resetFilters: () => void;
}

const DashboardFilterContext = createContext<FilterContextValue | null>(null);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    office: searchParams.get("office") || defaultFilters.office,
    pod: searchParams.get("pod") || defaultFilters.pod,
    attorney: searchParams.get("attorney") || defaultFilters.attorney,
    caseType: searchParams.get("caseType") || defaultFilters.caseType,
    venue: searchParams.get("venue") || defaultFilters.venue,
    dateRange: (searchParams.get("dateRange") as DashboardFilters["dateRange"]) || defaultFilters.dateRange,
  }));

  const setFilter = useCallback((key: keyof DashboardFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v !== "all" && v !== defaultFilters[k as keyof DashboardFilters]) {
          params.set(k, v);
        }
      });
      setSearchParams(params, { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within DashboardFilterProvider");
  return ctx;
}
