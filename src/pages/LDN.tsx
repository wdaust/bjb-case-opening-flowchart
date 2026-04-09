import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';

import { useSalesforceReport } from '../hooks/useSalesforceReport';
import {
  COMPLAINTS_REPORT_ID,
  PAST_DUE_SERVICE_ID,
  MISSING_ANS_SERVED_ID,
  FORM_A_REPORT_ID,
  FORM_C_REPORT_ID,
  DEP_REPORT_ID,
  OPEN_LIT_ID,
  RESOLUTIONS_ID,
  STATS_ID,
  TIMING_ID,
  DISCOVERY_ID,
  EXPERTS_ID,
  SERVICE_30DAY_ID,
} from '../data/sfReportIds';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import {
  computeAllLdnMetrics,
  computeComplaints,
  computeService,
  computeAnswers,
  computeFormA,
  computeFormC,
  computeDepositions,
  computeDED,
  buildAttorneyList,
  computeStageAggregatesFromLdn,
  STAGE_ORDER,
  SLA_TARGETS,
  type LdnReportBundle,
  type StageName,
  type LdnStageMetrics,
  type DrillRow,
  filterLitOnly,
  buildFixedAttorneyLookup,
  topAttorney,
} from '../utils/ldnMetrics';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { RiskPanel } from '../components/litprog/RiskPanel';
import { StageCard } from '../components/litprog/StageCard';
import { StageSection } from '../components/ldn/StageSection';
import { AttorneyProfile } from '../components/ldn/AttorneyProfile';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import { LCIBadge } from '../components/dashboard/LCIBadge';
import { computeRealLCI } from '../data/lciEngineReal';
import { cn } from '../utils/cn';

function bandBadgeClasses(band: string) {
  if (band === 'green') return 'bg-green-500/20 text-green-400';
  if (band === 'amber') return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

export default function LDN() {
  const navigate = useNavigate();
  const [selectedAttorney, setSelectedAttorney] = useState<string>('');
  const [expandedStage, setExpandedStage] = useState<StageName | null>(null);
  const [complaintsMode, setComplaintsMode] = useState<'excludeBlockers' | 'includeBlockers'>('excludeBlockers');
  const [stateFilter, setStateFilter] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState('');
  const [slaOverrides, setSlaOverrides] = useState<Record<StageName, number>>({ ...SLA_TARGETS });

  // ── Data fetching (9 LDN reports) ──
  const { data: complaints, loading: l1 } = useSalesforceReport<ReportSummaryResponse>({
    id: COMPLAINTS_REPORT_ID, type: 'report', mode: 'full',
  });
  const { data: service, loading: l2 } = useSalesforceReport<ReportSummaryResponse>({
    id: PAST_DUE_SERVICE_ID, type: 'report', mode: 'full',
  });
  const { data: answers, loading: l3 } = useSalesforceReport<ReportSummaryResponse>({
    id: MISSING_ANS_SERVED_ID, type: 'report', mode: 'full',
  });
  const { data: formA, loading: l4 } = useSalesforceReport<ReportSummaryResponse>({
    id: FORM_A_REPORT_ID, type: 'report', mode: 'full',
  });
  const { data: formC, loading: l5 } = useSalesforceReport<ReportSummaryResponse>({
    id: FORM_C_REPORT_ID, type: 'report', mode: 'full',
  });
  const { data: deps, loading: l6 } = useSalesforceReport<ReportSummaryResponse>({
    id: DEP_REPORT_ID, type: 'report', mode: 'full',
  });
  const { data: openLit, loading: l9 } = useSalesforceReport<ReportSummaryResponse>({
    id: OPEN_LIT_ID, type: 'report', mode: 'full',
  });
  const { data: service30Day, loading: l15 } = useSalesforceReport<ReportSummaryResponse>({
    id: SERVICE_30DAY_ID, type: 'report', mode: 'full',
  });

  // ── LCI data fetching (5 additional sources) ──
  const { data: resData, loading: l10 } = useSalesforceReport<ReportSummaryResponse>({
    id: RESOLUTIONS_ID, type: 'report',
  });
  const { data: statsData, loading: l11 } = useSalesforceReport<DashboardResponse>({
    id: STATS_ID, type: 'dashboard',
  });
  const { data: timingData, loading: l12 } = useSalesforceReport<DashboardResponse>({
    id: TIMING_ID, type: 'dashboard',
  });
  const { data: discData, loading: l13 } = useSalesforceReport<ReportSummaryResponse>({
    id: DISCOVERY_ID, type: 'report',
  });
  const { data: expertsData, loading: l14 } = useSalesforceReport<ReportSummaryResponse>({
    id: EXPERTS_ID, type: 'report',
  });

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l9 || l15;
  const lciLoading = l10 || l11 || l12 || l13 || l14;

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay: null, motions: null, openLit, service30Day,
  }), [complaints, service, answers, formA, formC, deps, openLit, service30Day]);

  const attorneys = useMemo(() => buildAttorneyList(bundle), [bundle]);
  const scores = useMemo(() => computeAllLdnMetrics(bundle), [bundle]);
  // Cross-ref lookup for complaints (Display Name → attorney)
  const complaintLookup = useMemo(() => buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []), [bundle.openLit]);

  // Attorney-scoped service 30-day rows (needed for service stage metrics)
  const attySvc30Rows = useMemo(() => {
    const attorneySet = new Set(scores.map(s => s.attorney));
    return (bundle.service30Day?.detailRows ?? []).filter(r => {
      const atty = topAttorney(r._groupingLabel);
      if (atty && attorneySet.has(atty)) return true;
      const dn = String(r['Display Name'] ?? r['Matter Name'] ?? '');
      const mapped = complaintLookup.get(dn);
      return mapped ? attorneySet.has(mapped) : false;
    }) as DrillRow[];
  }, [scores, bundle.service30Day, complaintLookup]);

  // ── Stage Overview aggregates from LDN scores (no litProgMetrics dependency) ──
  const stageAggregates = useMemo(() => computeStageAggregatesFromLdn(scores), [scores]);

  // ── Complaints toggle: recompute metrics for unfiled vs all mode ──
  // Both modes derive from the drill-down rows so card values always match
  const complaintMetrics = useMemo((): LdnStageMetrics => {
    const drillRows = getStageDetailRows(bundle, 'complaints', complaintsMode, scores, complaintLookup).rows;
    return computeComplaints(drillRows).metrics;
  }, [complaintsMode, bundle, scores, complaintLookup]);

  // ── LCI Computation ──
  const lci = useMemo(
    () => computeRealLCI({ resData, statsData, timingData, discData, expertsData }),
    [resData, statsData, timingData, discData, expertsData],
  );

  const handleStageClick = (stage: StageName) => {
    setExpandedStage(prev => prev === stage ? null : stage);
    document.getElementById(`stage-${stage}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stageHealthData = useMemo(() =>
    STAGE_ORDER.map(sn => ({
      name: scores[0]?.stages[sn]?.label ?? sn,
      Green: scores.filter(s => s.stages[sn].rag === 'green').length,
      Amber: scores.filter(s => s.stages[sn].rag === 'amber').length,
      Red: scores.filter(s => s.stages[sn].rag === 'red').length,
    })),
  [scores]);

  // Selected attorney data
  const selectedScore = useMemo(
    () => scores.find(s => s.attorney === selectedAttorney),
    [scores, selectedAttorney],
  );

  // For RiskPanel compatibility — map LdnAttorneyScore to the shape RiskPanel expects
  const riskPanelScores = useMemo(() => scores.map(s => ({
    attorney: s.attorney,
    redCount: s.redCount,
    amberCount: s.amberCount,
    greenCount: s.greenCount,
    riskScore: s.riskScore,
    totalIssues: s.totalIssues,
    actionableText: s.actionableText,
    stages: Object.fromEntries(
      STAGE_ORDER.map(sn => [sn, {
        stage: sn,
        label: s.stages[sn].label,
        primary: typeof s.stages[sn].cards[0]?.value === 'number' ? s.stages[sn].cards[0].value : 0,
        overdue: 0,
        subMetrics: {},
        pctTimely: 0,
        rag: s.stages[sn].rag,
      }]),
    ) as Record<string, { stage: string; label: string; primary: number; overdue: number; subMetrics: Record<string, number>; pctTimely: number; rag: 'green' | 'amber' | 'red' }>,
  })), [scores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading litigation data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Hero */}
      <HeroSection>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <HeroTitle title="Lit Disruptor Model" subtitle="Attorney performance deep-dive with actionable intelligence" />
            {/* Inline Pipeline */}
            {(() => {
              const openLitCount = filterLitOnly(bundle.openLit?.detailRows ?? []).length;
              const noComplaint = stageAggregates.find(a => a.stage === 'complaints')?.totalItems ?? 0;
              const noService = stageAggregates.find(a => a.stage === 'service')?.totalItems ?? 0;
              const noAnswer = stageAggregates.find(a => a.stage === 'answers')?.totalItems ?? 0;
              const noDiscovery = (stageAggregates.find(a => a.stage === 'formA')?.totalItems ?? 0) + (stageAggregates.find(a => a.stage === 'formC')?.totalItems ?? 0);
              const pastDed = stageAggregates.find(a => a.stage === 'ded')?.totalItems ?? 0;
              const items = [
                { label: 'Open Lit', value: openLitCount, color: 'text-white/90' },
                { label: 'No Complaint', value: noComplaint, color: noComplaint > 0 ? 'text-red-400' : 'text-green-400' },
                { label: 'No Service', value: noService, color: noService > 0 ? 'text-red-400' : 'text-green-400' },
                { label: 'No Answer', value: noAnswer, color: noAnswer > 0 ? 'text-red-400' : 'text-green-400' },
                { label: 'No Discovery', value: noDiscovery, color: noDiscovery > 0 ? 'text-amber-400' : 'text-green-400' },
                { label: 'Past DED', value: pastDed, color: pastDed > 0 ? 'text-red-400' : 'text-green-400' },
              ];
              return (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-medium text-white/50 mr-2 shrink-0">Pipeline:</span>
                  {items.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-1 shrink-0">
                      {i > 0 && <span className="text-white/30 mx-1">/</span>}
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                      <span className="text-xs text-white/60">{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedAttorney}
              onChange={e => setSelectedAttorney(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white backdrop-blur-sm max-w-xs"
            >
              <option value="" className="bg-[#111] text-white">All Attorneys</option>
              {attorneys.map(a => (
                <option key={a} value={a} className="bg-[#111] text-white">{a}</option>
              ))}
            </select>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white backdrop-blur-sm"
            >
              <option value="" className="bg-[#111] text-white">All States</option>
              {['NJ', 'NY', 'PA', 'CT', 'FL'].map(s => (
                <option key={s} value={s} className="bg-[#111] text-white">{s}</option>
              ))}
            </select>
            <select
              value={caseTypeFilter}
              onChange={e => setCaseTypeFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white backdrop-blur-sm"
            >
              <option value="" className="bg-[#111] text-white">All Case Types</option>
              {['MVA', 'Premises', 'Trucking', 'Ride Share'].map(ct => (
                <option key={ct} value={ct} className="bg-[#111] text-white">{ct}</option>
              ))}
            </select>
          </div>
        </div>
      </HeroSection>

      {/* Conditional: Attorney Profile vs Portfolio Overview */}
      {selectedAttorney && selectedScore ? (
        <AttorneyProfile
          score={selectedScore}
          bundle={bundle}
          onBack={() => setSelectedAttorney('')}
        />
      ) : (
        <>
          {/* Stage Overview Cards (LCI + 7 stages = 8 cards in 4x2 grid) */}
          <section>
            <SectionHeader title="Stage Overview" subtitle="Click a stage to expand details" />
            <DashboardGrid cols={4}>
              {/* LCI Card */}
              <button
                onClick={() => navigate('/lci-report')}
                className={cn(
                  'relative bg-card rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] cursor-pointer',
                  'border-green-500/30',
                )}
              >
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  LCI
                </div>
                {lciLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <ScoreGauge score={lci.score} maxScore={100} size={48} label="" />
                      <div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{Math.round(lci.score)}</div>
                        <LCIBadge score={Math.round(lci.score)} size="sm" />
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', bandBadgeClasses(lci.band))}>
                      {lci.band === 'green' ? 'Healthy' : lci.band === 'amber' ? 'Watch' : 'Critical'}
                    </span>
                  </>
                )}
              </button>

              {stageAggregates.map(agg => (
                <StageCard
                  key={agg.stage}
                  aggregate={agg}
                  isExpanded={expandedStage === agg.stage}
                  onClick={() => handleStageClick(agg.stage)}
                />
              ))}
            </DashboardGrid>
          </section>

          {/* Risk Summary */}
          <RiskPanel
            scores={riskPanelScores as never[]}
            onSelectAttorney={setSelectedAttorney}
          />

          {/* Stage Health Chart */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <SectionHeader
              title="Stage Health Overview"
              info="Stacked bar chart showing how many attorneys are Green, Amber, or Red in each litigation stage."
            />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stageHealthData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#ccc', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Green" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Amber" stackId="a" fill="#eab308" />
                <Bar dataKey="Red" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* LIT Deep Dive — 7 Stage Sections with detail rows for drill-down */}
          <section className="space-y-6">
            <SectionHeader title="LIT Deep Dive" subtitle="Stage-by-stage metrics with editable SLA targets" />
            {STAGE_ORDER.map(sn => {
              const detailRows = getStageDetailRows(bundle, sn, complaintsMode, scores, complaintLookup);
              // Derive metrics FROM the drill-down rows so card values always match row counts
              const metrics = sn === 'complaints'
                ? complaintMetrics
                : computeMetricsFromRows(sn, detailRows.rows, attySvc30Rows);
              return (
                <StageSection
                  key={sn}
                  stageName={sn}
                  stageMetrics={metrics}
                  scores={scores}
                  onSelectAttorney={setSelectedAttorney}
                  detailRows={detailRows.rows}
                  complaintsMode={sn === 'complaints' ? complaintsMode : undefined}
                  onComplaintsModeChange={sn === 'complaints' ? setComplaintsMode : undefined}
                  slaOverride={slaOverrides[sn]}
                  onSlaChange={val => setSlaOverrides(prev => ({ ...prev, [sn]: val }))}
                />
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

// ─── Helper: compute stage metrics from the same rows used for drill-down ───

function computeMetricsFromRows(stage: StageName, rows: DrillRow[], svc30Rows: DrillRow[]): LdnStageMetrics {
  switch (stage) {
    case 'complaints': return computeComplaints(rows).metrics;
    case 'service': return computeService(rows, svc30Rows).metrics;
    case 'answers': return computeAnswers(rows).metrics;
    case 'formA': return computeFormA(rows).metrics;
    case 'formC': return computeFormC(rows).metrics;
    case 'depositions': return computeDepositions(rows).metrics;
    case 'ded': return computeDED(rows).metrics;
  }
}

// ─── Helper: map stage name to the right detail rows from the bundle ────────

function getStageDetailRows(
  bundle: LdnReportBundle,
  stage: StageName,
  complaintsMode: 'excludeBlockers' | 'includeBlockers',
  scores: { attorney: string }[],
  lookup: Map<string, string>,
): { rows: DrillRow[] } {
  const attorneySet = new Set(scores.map(s => s.attorney));

  // Match computePortfolioFromScores filtering: grouping = topAttorney(_groupingLabel)
  function filterByGrouping(rows: DrillRow[]): DrillRow[] {
    return rows.filter(r => {
      const atty = topAttorney(r._groupingLabel);
      return atty && attorneySet.has(atty);
    });
  }

  // Match computePortfolioFromScores filtering: crossref = try _groupingLabel then Display Name lookup
  function filterByCrossref(rows: DrillRow[]): DrillRow[] {
    return rows.filter(r => {
      const atty = topAttorney(r._groupingLabel);
      if (atty && attorneySet.has(atty)) return true;
      const dn = String(r['Display Name'] ?? r['Matter Name'] ?? '');
      const mapped = lookup.get(dn);
      return mapped ? attorneySet.has(mapped) : false;
    });
  }

  switch (stage) {
    case 'complaints': {
      const allRows = (bundle.complaints?.detailRows ?? []) as DrillRow[];
      const attorneyRows = filterByCrossref(allRows);
      // Always filter to Pre-Lit
      const preLitRows = attorneyRows.filter(r => r['PI Status'] === 'Pre-Lit' || r['PI Status'] == null);
      if (complaintsMode === 'includeBlockers') return { rows: preLitRows };
      // Exclude rows with a blocker
      return { rows: preLitRows.filter(r => {
        const b = r['Blocker to Filing Complaint'] ?? r['Blocker'];
        return !b || b === '-';
      }) };
    }
    case 'service':
      return { rows: filterByGrouping((bundle.service?.detailRows ?? []) as DrillRow[]) };
    case 'answers':
      return { rows: filterByGrouping((bundle.answers?.detailRows ?? []) as DrillRow[]) };
    case 'formA':
      return { rows: filterByCrossref(filterLitOnly(bundle.formA?.detailRows ?? []) as DrillRow[]) };
    case 'formC':
      return { rows: filterByCrossref(filterLitOnly(bundle.formC?.detailRows ?? []) as DrillRow[]) };
    case 'depositions':
      return { rows: filterByCrossref(filterLitOnly(bundle.deps?.detailRows ?? []) as DrillRow[]) };
    case 'ded':
      return { rows: filterByGrouping(filterLitOnly(bundle.openLit?.detailRows ?? []) as DrillRow[]) };
  }
}

