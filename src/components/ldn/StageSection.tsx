import { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { SectionHeader } from '../dashboard/SectionHeader';
import { DashboardGrid } from '../dashboard/DashboardGrid';
import { StatCard } from '../dashboard/StatCard';
import { InfoTooltip } from '../dashboard/InfoTooltip';
import { DataTable } from '../dashboard/DataTable';
import { StageBulletGauge } from './StageBulletGauge';
import type { LdnStageMetrics, LdnAttorneyScore, StageName, RagColor } from '../../utils/ldnMetrics';
import { STAGE_INFO, CARD_INFO } from '../../utils/ldnMetrics';
import type { Column } from '../dashboard/DataTable';
import { cn } from '../../utils/cn';

interface Props {
  stageMetrics: LdnStageMetrics;
  scores: LdnAttorneyScore[];
  stageName: StageName;
  onSelectAttorney: (attorney: string) => void;
}

const RAG_DOT: Record<RagColor, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

interface RankRow {
  attorney: string;
  rag: RagColor;
  [key: string]: unknown;
}

export function StageSection({ stageMetrics, scores, stageName, onSelectAttorney }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Build ranking table data
  const rankData: RankRow[] = scores
    .map(s => {
      const sm = s.stages[stageName];
      const row: RankRow = { attorney: s.attorney, rag: sm.rag };
      sm.cards.forEach(c => { row[c.label] = c.value; });
      return row;
    })
    .sort((a, b) => {
      const pri: Record<RagColor, number> = { red: 0, amber: 1, green: 2 };
      return pri[a.rag] - pri[b.rag];
    });

  // Build columns dynamically from metric cards
  const columns: Column<RankRow>[] = [
    {
      key: 'attorney',
      label: 'Attorney',
      render: (row: RankRow) => (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectAttorney(row.attorney); }}
          className="text-blue-400 hover:text-blue-300 hover:underline text-left"
        >
          {row.attorney}
        </button>
      ),
    },
    {
      key: 'rag',
      label: 'Status',
      render: (row: RankRow) => (
        <span className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', RAG_DOT[row.rag])} />
          <span className="capitalize text-xs">{row.rag}</span>
        </span>
      ),
    },
    ...stageMetrics.cards.map(c => ({
      key: c.label,
      label: c.label,
      render: (row: RankRow) => <span>{String(row[c.label] ?? '-')}</span>,
    })),
  ];

  const ragBorder =
    stageMetrics.rag === 'red' ? 'border-red-500/30' :
    stageMetrics.rag === 'amber' ? 'border-amber-500/30' :
    'border-green-500/30';

  return (
    <section className={cn('rounded-xl border p-5', ragBorder, 'bg-card/50')}>
      <SectionHeader
        title={stageMetrics.label}
        info={STAGE_INFO[stageName]}
        actions={
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users size={14} />
            {expanded ? 'Collapse' : 'Attorney Rankings'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        }
      />

      {/* Metric cards with info tooltips */}
      <DashboardGrid cols={stageMetrics.cards.length <= 3 ? 3 : stageMetrics.cards.length <= 5 ? 5 : 4}>
        {stageMetrics.cards.map(c => (
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
            />
          </div>
        ))}
      </DashboardGrid>

      {/* Bullet gauge */}
      <div className="mt-4">
        <StageBulletGauge gauge={stageMetrics.gauge} />
      </div>

      {/* Expandable attorney ranking table */}
      {expanded && (
        <div className="mt-4">
          <DataTable
            data={rankData}
            columns={columns}
            keyField="attorney"
            maxRows={50}
            onRowClick={(row) => onSelectAttorney(row.attorney)}
          />
        </div>
      )}
    </section>
  );
}
