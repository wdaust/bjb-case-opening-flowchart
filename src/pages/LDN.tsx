import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
} from '../utils/ldnMetrics';
import { RiskPanel } from '../components/litprog/RiskPanel';
import { StageSection } from '../components/ldn/StageSection';
import { AttorneyProfile } from '../components/ldn/AttorneyProfile';

export default function LDN() {
  const [selectedAttorney, setSelectedAttorney] = useState<string>('');

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
            <HeroTitle title="Litigation Dashboard Navigator" subtitle="Attorney performance deep-dive with actionable intelligence" />
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
          onBack={() => setSelectedAttorney('')}
        />
      ) : (
        <>
          {/* Risk Summary */}
          <RiskPanel
            scores={riskPanelScores as never[]}
            onSelectAttorney={setSelectedAttorney}
          />

          {/* 7 Stage Sections */}
          {STAGE_ORDER.map(sn => (
            <StageSection
              key={sn}
              stageName={sn}
              stageMetrics={portfolioStages[sn]}
              scores={scores}
              onSelectAttorney={setSelectedAttorney}
            />
          ))}
        </>
      )}
    </div>
  );
}
