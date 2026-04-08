import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { HeroSummaryTicker } from '../components/dashboard/HeroSummaryTicker';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import {
  COMPLAINTS_REPORT_ID,
  PAST_DUE_SERVICE_ID,
  MISSING_ANS_SERVED_ID,
  FORM_A_REPORT_ID,
  FORM_C_REPORT_ID,
  DEP_REPORT_ID,
  FORM_C_10DAY_ID,
  NEED_FORM_C_MOTION_ID,
  OPEN_LIT_ID,
} from '../data/sfReportIds';
import type { ReportSummaryResponse } from '../types/salesforce';
import {
  computeAllLdnMetrics,
  computePortfolioStages,
  buildAttorneyList,
  STAGE_ORDER,
  type LdnReportBundle,
  type StageName,
  type DrillRow,
} from '../utils/ldnMetrics';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { RiskPanel } from '../components/litprog/RiskPanel';
import { StageCard } from '../components/litprog/StageCard';
import { AttorneyRankingTable } from '../components/litprog/AttorneyRankingTable';
import { StageSection } from '../components/ldn/StageSection';
import { AttorneyProfile } from '../components/ldn/AttorneyProfile';
import {
  computeAllAttorneyStageMetrics,
  computeStageAggregates,
  STAGE_LABELS,
  type StageName as LitProgStageName,
  type ReportBundle,
} from '../utils/litProgMetrics';

export default function LDN() {
  const [selectedAttorney, setSelectedAttorney] = useState<string>('');
  const [expandedStage, setExpandedStage] = useState<LitProgStageName | null>(null);

  // ── Data fetching (same 9 reports as LitProgression) ──
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
  const { data: tenDay, loading: l7 } = useSalesforceReport<ReportSummaryResponse>({
    id: FORM_C_10DAY_ID, type: 'report', mode: 'full',
  });
  const { data: motions, loading: l8 } = useSalesforceReport<ReportSummaryResponse>({
    id: NEED_FORM_C_MOTION_ID, type: 'report', mode: 'full',
  });
  const { data: openLit, loading: l9 } = useSalesforceReport<ReportSummaryResponse>({
    id: OPEN_LIT_ID, type: 'report', mode: 'full',
  });

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9;

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay, motions, openLit,
  }), [complaints, service, answers, formA, formC, deps, tenDay, motions, openLit]);

  const attorneys = useMemo(() => buildAttorneyList(bundle), [bundle]);
  const scores = useMemo(() => computeAllLdnMetrics(bundle), [bundle]);
  const portfolioStages = useMemo(() => computePortfolioStages(bundle), [bundle]);

  // ── LitProg Stage Overview metrics (reuse existing bundle) ──
  const allLitProgScores = useMemo(() => computeAllAttorneyStageMetrics(bundle as unknown as ReportBundle), [bundle]);
  const stageAggregates = useMemo(() => computeStageAggregates(allLitProgScores), [allLitProgScores]);

  const handleStageClick = (stage: LitProgStageName) => {
    setExpandedStage(prev => prev === stage ? null : stage);
  };

  const handleSelectAttorneyFromStage = (attorney: string) => {
    setSelectedAttorney(attorney);
    setExpandedStage(null);
  };

  const stageHealthData = useMemo(() =>
    STAGE_ORDER.map(sn => ({
      name: portfolioStages[sn]?.label ?? sn,
      Green: scores.filter(s => s.stages[sn].rag === 'green').length,
      Amber: scores.filter(s => s.stages[sn].rag === 'amber').length,
      Red: scores.filter(s => s.stages[sn].rag === 'red').length,
    })),
  [scores, portfolioStages]);

  const totalRedFlags = useMemo(() => scores.reduce((sum, s) => sum + s.redCount, 0), [scores]);
  const worstStage = useMemo(() => {
    const stageCounts = STAGE_ORDER.map(sn => ({
      stage: sn,
      label: portfolioStages[sn]?.label ?? sn,
      redCount: scores.filter(s => s.stages[sn].rag === 'red').length,
    }));
    return stageCounts.sort((a, b) => b.redCount - a.redCount)[0];
  }, [scores, portfolioStages]);

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
            <HeroTitle title="Litigation Dashboard Manager" subtitle="Attorney performance deep-dive with actionable intelligence" />
            <HeroSummaryTicker items={[
              { label: 'attorneys', value: attorneys.length },
              { label: 'red flags', value: totalRedFlags },
              { label: `Worst: ${worstStage?.label ?? '-'}`, value: worstStage?.redCount ?? 0 },
            ]} />
          </div>
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
          {/* Stage Overview Cards */}
          <section>
            <SectionHeader title="Stage Overview" subtitle="Click a stage to see attorney rankings" />
            <DashboardGrid cols={4}>
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

          {/* Expanded Stage Drill-Down */}
          {expandedStage && (
            <section>
              <SectionHeader
                title={`${STAGE_LABELS[expandedStage]} — Attorney Rankings`}
                subtitle="Click an attorney row for detail view"
              />
              <AttorneyRankingTable
                scores={allLitProgScores}
                stage={expandedStage}
                onSelectAttorney={handleSelectAttorneyFromStage}
              />
            </section>
          )}

          {/* Pipeline Summary Bar */}
          <PipelineSummaryBar bundle={bundle} />

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

          {/* 7 Stage Sections — with detail rows for drill-down */}
          {STAGE_ORDER.map(sn => {
            const detailRows = getStageDetailRows(bundle, sn);
            return (
              <StageSection
                key={sn}
                stageName={sn}
                stageMetrics={portfolioStages[sn]}
                scores={scores}
                onSelectAttorney={setSelectedAttorney}
                detailRows={detailRows.rows}
                tenDayRows={detailRows.tenDayRows}
                motionRows={detailRows.motionRows}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Helper: map stage name to the right detail rows from the bundle ────────

function getStageDetailRows(
  bundle: LdnReportBundle,
  stage: StageName,
): { rows: DrillRow[]; tenDayRows?: DrillRow[]; motionRows?: DrillRow[] } {
  switch (stage) {
    case 'complaints':
      return { rows: (bundle.complaints?.detailRows ?? []) as DrillRow[] };
    case 'service':
      return { rows: (bundle.service?.detailRows ?? []) as DrillRow[] };
    case 'answers':
      return { rows: (bundle.answers?.detailRows ?? []) as DrillRow[] };
    case 'formA':
      return { rows: (bundle.formA?.detailRows ?? []) as DrillRow[] };
    case 'formC':
      return {
        rows: (bundle.formC?.detailRows ?? []) as DrillRow[],
        tenDayRows: (bundle.tenDay?.detailRows ?? []) as DrillRow[],
        motionRows: (bundle.motions?.detailRows ?? []) as DrillRow[],
      };
    case 'depositions':
      return { rows: (bundle.deps?.detailRows ?? []) as DrillRow[] };
    case 'ded':
      return { rows: (bundle.openLit?.detailRows ?? []) as DrillRow[] };
  }
}

// ─── Pipeline Summary Bar ───────────────────────────────────────────────────

function PipelineSummaryBar({ bundle }: { bundle: LdnReportBundle }) {
  const openLitCount = bundle.openLit?.detailRows?.length ?? 0;
  const noComplaint = bundle.complaints?.detailRows?.length ?? 0;
  const noService = bundle.service?.detailRows?.length ?? 0;
  const noAnswer = bundle.answers?.detailRows?.length ?? 0;
  const noDiscovery = (bundle.formA?.detailRows?.length ?? 0) + (bundle.formC?.detailRows?.length ?? 0);
  const pastDed = (bundle.openLit?.detailRows ?? []).filter(r => {
    const v = r['Discovery End Date'];
    if (!v || v === '-') return false;
    const d = new Date(v as string);
    return !isNaN(d.getTime()) && d < new Date();
  }).length;

  const items = [
    { label: 'Open Lit', value: openLitCount, color: 'text-foreground' },
    { label: 'No Complaint', value: noComplaint, color: noComplaint > 0 ? 'text-red-400' : 'text-green-400' },
    { label: 'No Service', value: noService, color: noService > 0 ? 'text-red-400' : 'text-green-400' },
    { label: 'No Answer', value: noAnswer, color: noAnswer > 0 ? 'text-red-400' : 'text-green-400' },
    { label: 'No Discovery', value: noDiscovery, color: noDiscovery > 0 ? 'text-amber-400' : 'text-green-400' },
    { label: 'Past DED', value: pastDed, color: pastDed > 0 ? 'text-red-400' : 'text-green-400' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card/50 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground mr-2 shrink-0">Pipeline:</span>
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1 shrink-0">
          {i > 0 && <span className="text-muted-foreground/40 mx-1">/</span>}
          <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
