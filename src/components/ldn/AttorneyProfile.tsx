import { useState } from 'react';
import { DashboardGrid } from '../dashboard/DashboardGrid';
import { StatCard } from '../dashboard/StatCard';
import { DataTable } from '../dashboard/DataTable';
import { StageBulletGauge } from './StageBulletGauge';
import { CardDrillDown } from './CardDrillDown';
import { SectionHeader } from '../dashboard/SectionHeader';
import { InfoTooltip } from '../dashboard/InfoTooltip';
import type { LdnAttorneyScore, ActionableIssue, StageName, RagColor, LdnReportBundle, DrillRow } from '../../utils/ldnMetrics';
import { STAGE_ORDER, STAGE_LABELS, STAGE_INFO, CARD_INFO, STAGE_DRILL_COLUMNS, CARD_FILTERS, topAttorney } from '../../utils/ldnMetrics';
import type { Column } from '../dashboard/DataTable';
import { cn } from '../../utils/cn';

interface Props {
  score: LdnAttorneyScore;
  bundle: LdnReportBundle;
  onBack: () => void;
}

const RAG_COLORS: Record<RagColor, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
};

const issueColumns: Column<ActionableIssue>[] = [
  { key: 'stage', label: 'Stage' },
  { key: 'description', label: 'Description' },
  {
    key: 'daysOverdue',
    label: 'Days Overdue',
    render: (row) => (
      <span className={cn(
        'font-semibold',
        row.daysOverdue >= 90 ? 'text-red-400' : row.daysOverdue >= 30 ? 'text-amber-400' : 'text-foreground',
      )}>
        {row.daysOverdue}d
      </span>
    ),
  },
  {
    key: 'priority',
    label: 'Priority',
    render: (row) => (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        RAG_COLORS[row.priority].bg,
        RAG_COLORS[row.priority].text,
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full', row.priority === 'red' ? 'bg-red-400' : row.priority === 'amber' ? 'bg-amber-400' : 'bg-green-400')} />
        {row.priority}
      </span>
    ),
  },
  { key: 'suggestedAction', label: 'Suggested Action' },
];

/** Filter bundle detail rows to a single attorney */
function getAttorneyStageRows(bundle: LdnReportBundle, stage: StageName, attorney: string): { rows: DrillRow[]; tenDayRows?: DrillRow[]; motionRows?: DrillRow[] } {
  const filterByGrouping = (rows: DrillRow[]) =>
    rows.filter(r => topAttorney(r._groupingLabel) === attorney);
  const filterByDisplayName = (rows: DrillRow[], allOpenLit: DrillRow[]) => {
    // Build lookup of Display Name → attorney from openLit groupings
    const lookup = new Map<string, string>();
    for (const r of allOpenLit) {
      const dn = String(r['Display Name'] ?? '');
      if (dn) lookup.set(dn, topAttorney(r._groupingLabel));
    }
    return rows.filter(r => {
      const dn = String(r['Display Name'] ?? '');
      return lookup.get(dn) === attorney;
    });
  };

  const openLitRows = (bundle.openLit?.detailRows ?? []) as DrillRow[];

  switch (stage) {
    case 'complaints':
      return { rows: filterByDisplayName((bundle.complaints?.detailRows ?? []) as DrillRow[], openLitRows) };
    case 'service':
      return { rows: filterByGrouping((bundle.service?.detailRows ?? []) as DrillRow[]) };
    case 'answers':
      return { rows: filterByGrouping((bundle.answers?.detailRows ?? []) as DrillRow[]) };
    case 'formA':
      return { rows: filterByDisplayName((bundle.formA?.detailRows ?? []) as DrillRow[], openLitRows) };
    case 'formC':
      return {
        rows: filterByDisplayName((bundle.formC?.detailRows ?? []) as DrillRow[], openLitRows),
        tenDayRows: ((bundle.tenDay?.detailRows ?? []) as DrillRow[]).filter(r => {
          // tenDay uses level2 grouping
          const label = r._groupingLabel as string;
          const parts = (label ?? '').split(' > ');
          return parts.length >= 2 ? parts[1].trim() === attorney : parts[0]?.trim() === attorney;
        }),
        motionRows: ((bundle.motions?.detailRows ?? []) as DrillRow[]).filter(r => {
          const label = r._groupingLabel as string;
          const parts = (label ?? '').split(' > ');
          return parts.length >= 2 ? parts[1].trim() === attorney : parts[0]?.trim() === attorney;
        }),
      };
    case 'depositions':
      return { rows: filterByDisplayName((bundle.deps?.detailRows ?? []) as DrillRow[], openLitRows) };
    case 'ded':
      return { rows: filterByGrouping(openLitRows) };
  }
}

export function AttorneyProfile({ score, bundle, onBack }: Props) {
  const [drillDown, setDrillDown] = useState<{ stage: StageName; card: string } | null>(null);

  const redStages = STAGE_ORDER.filter(s => score.stages[s].rag === 'red');
  const amberStages = STAGE_ORDER.filter(s => score.stages[s].rag === 'amber');
  const worstStage = redStages[0];
  const priorityText = worstStage
    ? `Priority: ${STAGE_LABELS[worstStage]} (${score.stages[worstStage].cards[0]?.value} items)`
    : 'No critical stages';

  // Get drill-down rows for the active card
  function getDrillRows(): DrillRow[] {
    if (!drillDown) return [];
    const { stage, card } = drillDown;
    const stageRows = getAttorneyStageRows(bundle, stage, score.attorney);
    if (stage === 'formC') {
      if (card === 'Need 10-Day Letter') return stageRows.tenDayRows ?? [];
      if (card === 'Need Motion') return stageRows.motionRows ?? [];
    }
    const filterFn = CARD_FILTERS[stage]?.[card];
    if (!filterFn) return stageRows.rows;
    return stageRows.rows.filter(filterFn);
  }

  return (
    <div className="space-y-6">
      {/* CTA Hero Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button
              onClick={onBack}
              className="text-xs text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              &larr; Back to Portfolio
            </button>
            <h2 className="text-xl font-bold text-foreground">{score.attorney}</h2>
          </div>
          <div className="flex items-center gap-2">
            {score.redCount > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                {score.redCount} red
              </span>
            )}
            {score.amberCount > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                {score.amberCount} amber
              </span>
            )}
            {score.greenCount > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                {score.greenCount} green
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {redStages.length} stages red, {amberStages.length} amber — {priorityText}
        </p>
      </div>

      {/* 7 Stage Detail Cards */}
      <div className="space-y-4">
        {STAGE_ORDER.map((sn: StageName) => {
          const sm = score.stages[sn];
          const ragStyle = RAG_COLORS[sm.rag];
          return (
            <div key={sn} className={cn('rounded-xl border p-4', ragStyle.border, 'bg-card/50')}>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('w-2.5 h-2.5 rounded-full', sm.rag === 'red' ? 'bg-red-500' : sm.rag === 'amber' ? 'bg-amber-500' : 'bg-green-500')} />
                <h3 className="text-sm font-semibold text-foreground">{sm.label}</h3>
                {STAGE_INFO[sn] && <InfoTooltip text={STAGE_INFO[sn]} />}
                <span className={cn('text-xs font-medium uppercase', ragStyle.text)}>{sm.rag}</span>
              </div>
              <DashboardGrid cols={sm.cards.length <= 3 ? 3 : sm.cards.length <= 5 ? 5 : 4}>
                {sm.cards.map(c => (
                  <div key={c.label} className="relative">
                    {CARD_INFO[c.label] && (
                      <div className="absolute top-2 right-2 z-10">
                        <InfoTooltip text={CARD_INFO[c.label]} />
                      </div>
                    )}
                    <StatCard
                      label={c.label}
                      value={c.value}
                      delta={c.rag}
                      deltaType={c.rag === 'green' ? 'positive' : c.rag === 'red' ? 'negative' : 'neutral'}
                      onClick={() => setDrillDown({ stage: sn, card: c.label })}
                    />
                  </div>
                ))}
              </DashboardGrid>
              <div className="mt-3">
                <StageBulletGauge gauge={sm.gauge} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Issues Table */}
      <section>
        <SectionHeader
          title="Actionable Issues"
          subtitle={`${score.issues.length} issues across all stages`}
        />
        {score.issues.length > 0 ? (
          <DataTable
            data={score.issues}
            columns={issueColumns}
            keyField="description"
            maxRows={100}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No actionable issues found.</p>
        )}
      </section>

      {/* Drill-down dialog */}
      {drillDown && (
        <CardDrillDown
          open={true}
          onClose={() => setDrillDown(null)}
          title={`${score.attorney} — ${STAGE_LABELS[drillDown.stage]} — ${drillDown.card}`}
          rows={getDrillRows()}
          columns={STAGE_DRILL_COLUMNS[drillDown.stage] ?? []}
        />
      )}
    </div>
  );
}
