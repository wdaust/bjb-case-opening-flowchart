/**
 * Composite query hooks — fetch multiple reports in parallel and return
 * a unified bundle. TanStack Query deduplicates by query key, so if
 * ControlTower already loaded OPEN_LIT, LDN gets it from cache instantly.
 */
import { useQuery } from '@tanstack/react-query';
import { reportQueries, dashboardQueries } from './reports';

// ── LDN Bundle (8 source reports + 5 LCI reports) ────────────────────

export function useLdnBundle() {
  const complaints = useQuery(reportQueries.complaints());
  const service = useQuery(reportQueries.pastDueService());
  const answers = useQuery(reportQueries.missingAnsServed());
  const formA = useQuery(reportQueries.formA());
  const formC = useQuery(reportQueries.formC());
  const deps = useQuery(reportQueries.depositions());
  const openLit = useQuery(reportQueries.openLit('full'));
  const service30Day = useQuery(reportQueries.service30Day());

  // LCI data sources
  const resolutions = useQuery(reportQueries.resolutions());
  const statsData = useQuery(dashboardQueries.stats());
  const timingData = useQuery(dashboardQueries.timing());
  const discovery = useQuery(reportQueries.discovery());
  const experts = useQuery(reportQueries.experts());

  const ldnLoading = complaints.isLoading || service.isLoading || answers.isLoading ||
    formA.isLoading || formC.isLoading || deps.isLoading || openLit.isLoading || service30Day.isLoading;
  const lciLoading = resolutions.isLoading || statsData.isLoading || timingData.isLoading ||
    discovery.isLoading || experts.isLoading;

  return {
    // LDN reports
    complaints: complaints.data ?? null,
    service: service.data ?? null,
    answers: answers.data ?? null,
    formA: formA.data ?? null,
    formC: formC.data ?? null,
    deps: deps.data ?? null,
    openLit: openLit.data ?? null,
    service30Day: service30Day.data ?? null,

    // LCI sources
    resData: resolutions.data ?? null,
    statsData: statsData.data ?? null,
    timingData: timingData.data ?? null,
    discData: discovery.data ?? null,
    expertsData: experts.data ?? null,

    loading: ldnLoading,
    lciLoading,
    allLoading: ldnLoading || lciLoading,
  };
}

// ── ControlTower Bundle ──────────────────────────────────────────────

export function useControlTowerBundle() {
  // Core 6 reports + dashboards
  const openLit = useQuery(reportQueries.openLit('summary'));
  const openLitFull = useQuery(reportQueries.openLit('full'));
  const resolutions = useQuery(reportQueries.resolutions());
  const statsData = useQuery(dashboardQueries.stats());
  const timingData = useQuery(dashboardQueries.timing());
  const discovery = useQuery(reportQueries.discovery());
  const experts = useQuery(reportQueries.experts());

  // Escalation source reports
  const missingAnswers = useQuery(reportQueries.missingAnswers());
  const complaints = useQuery(reportQueries.complaints());
  const formA = useQuery(reportQueries.formA());
  const formC = useQuery(reportQueries.formC());
  const deps = useQuery(reportQueries.depositions());

  const coreLoading = openLit.isLoading || resolutions.isLoading || statsData.isLoading ||
    timingData.isLoading || discovery.isLoading || experts.isLoading;

  return {
    openLitData: openLit.data ?? null,
    openLitFullData: openLitFull.data ?? null,
    resData: resolutions.data ?? null,
    statsData: statsData.data ?? null,
    timingData: timingData.data ?? null,
    discData: discovery.data ?? null,
    expertsData: experts.data ?? null,
    missingAnsReport: missingAnswers.data ?? null,
    complaintsReport: complaints.data ?? null,
    formAReport: formA.data ?? null,
    formCReport: formC.data ?? null,
    depReport: deps.data ?? null,

    coreLoading,
    allLoading: coreLoading,

    // Refresh helpers
    refreshOpenLit: () => openLit.refetch(),
    refreshRes: () => resolutions.refetch(),
    refreshStats: () => statsData.refetch(),
    refreshTiming: () => timingData.refetch(),
    refreshDisc: () => discovery.refetch(),
    refreshExperts: () => experts.refetch(),
    refreshAll: () => {
      openLit.refetch();
      openLitFull.refetch();
      resolutions.refetch();
      statsData.refetch();
      timingData.refetch();
      discovery.refetch();
      experts.refetch();
    },

    // Timestamps
    openLitTs: openLit.dataUpdatedAt ? new Date(openLit.dataUpdatedAt).toISOString() : null,
    resTs: resolutions.dataUpdatedAt ? new Date(resolutions.dataUpdatedAt).toISOString() : null,
    statsTs: statsData.dataUpdatedAt ? new Date(statsData.dataUpdatedAt).toISOString() : null,
    timingTs: timingData.dataUpdatedAt ? new Date(timingData.dataUpdatedAt).toISOString() : null,
    discTs: discovery.dataUpdatedAt ? new Date(discovery.dataUpdatedAt).toISOString() : null,
    expertsTs: experts.dataUpdatedAt ? new Date(experts.dataUpdatedAt).toISOString() : null,
  };
}

// ── LCI Report Bundle ────────────────────────────────────────────────

export function useLciBundle() {
  const resolutions = useQuery(reportQueries.resolutions());
  const statsData = useQuery(dashboardQueries.stats());
  const timingData = useQuery(dashboardQueries.timing());
  const discovery = useQuery(reportQueries.discovery());
  const experts = useQuery(reportQueries.experts());

  return {
    resData: resolutions.data ?? null,
    statsData: statsData.data ?? null,
    timingData: timingData.data ?? null,
    discData: discovery.data ?? null,
    expertsData: experts.data ?? null,
    loading: resolutions.isLoading || statsData.isLoading || timingData.isLoading ||
      discovery.isLoading || experts.isLoading,
  };
}
