import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { HeroSummaryTicker } from '../components/dashboard/HeroSummaryTicker';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
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
  computeAllAttorneyStageMetrics,
  computeStageAggregates,
  buildAttorneyList,
  STAGE_LABELS,
  type StageName,
  type ReportBundle,
} from '../utils/litProgMetrics';
import { StageCard } from '../components/litprog/StageCard';
import { AttorneyRankingTable } from '../components/litprog/AttorneyRankingTable';
import { RiskPanel } from '../components/litprog/RiskPanel';
import { AttorneyDetailView } from '../components/litprog/AttorneyDetailView';

export default function LitProgression() {
  const [selectedAttorney, setSelectedAttorney] = useState<string>('');
  const [expandedStage, setExpandedStage] = useState<StageName | null>(null);

  // ── Data fetching (same 9 reports) ──
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

  // ── Bundle & compute ──
  const bundle: ReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay, motions, openLit,
  }), [complaints, service, answers, formA, formC, deps, tenDay, motions, openLit]);

  const attorneyList = useMemo(() => buildAttorneyList(bundle), [bundle]);
  const allScores = useMemo(() => computeAllAttorneyStageMetrics(bundle), [bundle]);
  const stageAggregates = useMemo(() => computeStageAggregates(allScores), [allScores]);

  const selectedScore = useMemo(
    () => allScores.find(s => s.attorney === selectedAttorney) ?? null,
    [allScores, selectedAttorney],
  );

  // ── Ticker stats ──
  const totalRedFlags = useMemo(() => allScores.reduce((sum, s) => sum + s.redCount, 0), [allScores]);
  const worstStage = useMemo(() => {
    const agg = [...stageAggregates].sort((a, b) => b.redCount - a.redCount);
    return agg[0]?.label ?? '-';
  }, [stageAggregates]);

  // ── Chart data ──
  const chartData = useMemo(() => stageAggregates.map(a => ({
    name: a.label,
    Green: a.greenCount,
    Amber: a.amberCount,
    Red: a.redCount,
  })), [stageAggregates]);

  // ── Handlers ──
  const handleStageClick = (stage: StageName) => {
    setExpandedStage(prev => prev === stage ? null : stage);
  };

  const handleSelectAttorney = (attorney: string) => {
    setSelectedAttorney(attorney);
    setExpandedStage(null);
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading litigation data…</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Hero */}
      <HeroSection>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <HeroTitle
              title="Litigation Progression"
              subtitle={selectedAttorney
                ? `Attorney view: ${selectedAttorney}`
                : 'Attorney performance across 7 litigation stages'}
            />
            <HeroSummaryTicker items={[
              { label: 'attorneys', value: attorneyList.length },
              { label: 'red flags', value: totalRedFlags },
              { label: `Worst: ${worstStage}`, value: '' },
            ]} />
          </div>
          <select
            value={selectedAttorney}
            onChange={e => handleSelectAttorney(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white backdrop-blur-sm max-w-xs"
          >
            <option value="" className="bg-[#111] text-white">All Attorneys</option>
            {attorneyList.map(a => (
              <option key={a} value={a} className="bg-[#111] text-white">{a}</option>
            ))}
          </select>
        </div>
      </HeroSection>

      {/* Attorney Detail View (replaces overview when filtered) */}
      {selectedAttorney && selectedScore ? (
        <AttorneyDetailView score={selectedScore} />
      ) : (
        <>
          {/* Stage Cards */}
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
                scores={allScores}
                stage={expandedStage}
                onSelectAttorney={handleSelectAttorney}
              />
            </section>
          )}

          {/* Risk Analysis */}
          <section>
            <SectionHeader title="Risk Analysis" subtitle="Composite scoring: (red×30) + (amber×10) + min(issues, 10)" />
            <RiskPanel scores={allScores} onSelectAttorney={handleSelectAttorney} />
          </section>

          {/* Stage Health Chart */}
          <section>
            <SectionHeader title="Stage Health" subtitle="Attorney RAG distribution per stage" />
            <div className="bg-card rounded-xl border border-border p-4" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#ccc', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="Green" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Amber" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Red" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
