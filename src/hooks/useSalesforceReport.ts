import { useState, useEffect, useCallback, useRef } from 'react';
import type { SfApiResponse, ReportSummaryResponse, DashboardResponse, ReportType } from '../types/salesforce.ts';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

interface UseSalesforceReportOptions {
  id: string;
  type: ReportType;
  mode?: 'summary' | 'full';
  enabled?: boolean;
}

interface UseSalesforceReportResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastFetched: string | null;
}

export function useSalesforceReport<T = ReportSummaryResponse | DashboardResponse>(
  opts: UseSalesforceReportOptions
): UseSalesforceReportResult<T> {
  const { id, type, mode = 'summary', enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cacheKey = `${type}:${id}:${mode}`;

  const fetchData = useCallback(async (skipCache = false) => {
    if (!id || !enabled) return;

    if (!skipCache) {
      const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
        setData(cached.data);
        setLastFetched(cached.fetchedAt);
        setError(null);
        return;
      }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'dashboard' ? 'get-dashboard' : 'get-report';
      const params = new URLSearchParams({ id });
      if (type === 'report') params.set('mode', mode);

      const res = await fetch(`${API_BASE}/${endpoint}?${params}`, {
        signal: controller.signal,
      });

      const json = await res.json() as SfApiResponse<T>;

      if (!json.ok) {
        throw new Error(json.error ?? `API error (${res.status})`);
      }

      const entry: CacheEntry<T> = {
        data: json.data,
        fetchedAt: json.fetchedAt,
        cachedAt: Date.now(),
      };
      cache.set(cacheKey, entry);

      setData(json.data);
      setLastFetched(json.fetchedAt);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id, type, mode, enabled, cacheKey]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh, lastFetched };
}
