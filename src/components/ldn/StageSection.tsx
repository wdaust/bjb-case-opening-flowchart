import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { SectionHeader } from '../dashboard/SectionHeader';
import { DashboardGrid } from '../dashboard/DashboardGrid';
import { StatCard } from '../dashboard/StatCard';
import { InfoTooltip } from '../dashboard/InfoTooltip';
import { DataTable } from '../dashboard/DataTable';
import { StageBulletGauge } from './StageBulletGauge';
import { CardDrillDown } from './CardDrillDown';
import type { LdnStageMetrics, LdnAttorneyScore, StageName, RagColor, DrillRow } from '../../data/metrics';
import { STAGE_INFO, CARD_INFO, STAGE_DRILL_COLUMNS, CARD_FILTERS } from '../../data/metrics';
import type { Column } from '../dashboard/DataTable';
import { cn } from '../../utils/cn';

/** Controlled number input that allows clearing/retyping without snapping to 1 */
function SlaInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  // Sync from parent when not focused (e.g. reset)
  const display = focused ? draft : String(value);

  return (
    <input
      type="number"
      min={1}
      max={365}
      value={display}
      onChange={e => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (n >= 1 && n <= 365) onChange(n);
      }}
      onFocus={e => { setFocused(true); setDraft(e.target.value); e.target.select(); }}
      onBlur={() => {
        setFocused(false);
        const n = Math.max(1, Math.min(365, Math.round(Number(draft) || value)));
        setDraft(String(n));
        onChange(n);
      }}
      className="w-14 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-foreground tabular-nums text-center"
    />
  );
}

interface Props {
  stageMetrics: LdnStageMetrics;
  scores: LdnAttorneyScore[];
  stageName: StageName;
  onSelectAttorney: (attorney: string) => void;
  detailRows?: DrillRow[];
  complaintsMode?: 'excludeBlockers' | 'includeBlockers';
  onComplaintsModeChange?: (mode: 'excludeBlockers' | 'includeBlockers') => void;
  slaOverride?: number;
  onSlaChange?: (value: number) => void;
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

export function StageSection({ stageMetrics, scores, stageName, onSelectAttorney, detailRows, complaintsMode, onComplaintsModeChange, slaOverride, onSlaChange }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [drillDownCard, setDrillDownCard] = useState<string | null>(null);

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

  // Drill-down: determine which rows to show for the clicked card
  function getDrillRows(cardLabel: string): DrillRow[] {
    if (!detailRows) return [];
    const filterFn = CARD_FILTERS[stageName]?.[cardLabel];
    if (!filterFn) return detailRows;
    return detailRows.filter(filterFn);
  }

  const drillColumns = STAGE_DRILL_COLUMNS[stageName] ?? [];

  return (
    <section id={`stage-${stageName}`} className={cn('rounded-xl border p-5', 'border-border', 'bg-card/50')}>
      <SectionHeader
        title={stageMetrics.label}
        info={STAGE_INFO[stageName]}
        actions={
          <div className="flex items-center gap-2">
            {stageName === 'complaints' && complaintsMode && onComplaintsModeChange && (
              <>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => onComplaintsModeChange('excludeBlockers')}
                    className={cn(
                      'px-3 py-1.5 text-xs transition-colors',
                      complaintsMode === 'excludeBlockers'
                        ? 'bg-white/15 text-foreground font-medium'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10',
                    )}
                  >
                    Excluding Blockers
                  </button>
                  <button
                    onClick={() => onComplaintsModeChange('includeBlockers')}
                    className={cn(
                      'px-3 py-1.5 text-xs transition-colors',
                      complaintsMode === 'includeBlockers'
                        ? 'bg-white/15 text-foreground font-medium'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10',
                    )}
                  >
                    Including Blockers
                  </button>
                </div>
                <button
                  onClick={() => navigate('/ldn/blockers')}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blocker Report &rarr;
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users size={14} />
              {expanded ? 'Collapse' : 'Attorney Rankings'}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        }
      />

      {/* Metric cards with info tooltips — now clickable for drill-down */}
      <DashboardGrid cols={stageMetrics.cards.length <= 3 ? 3 : stageMetrics.cards.length <= 5 ? 5 : 4}>
        {stageMetrics.cards.map(c => (
          <div key={c.label} className={cn('relative', c.disabled && 'opacity-50 cursor-not-allowed')}>
            {CARD_INFO[c.label] && (
              <div className="absolute top-2 right-2 z-10">
                <InfoTooltip text={CARD_INFO[c.label]} />
              </div>
            )}
            {c.badge && (
              <span className="absolute top-2 left-2 z-10 text-[10px] font-medium bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                v{c.badge}
              </span>
            )}
            <StatCard
              label={c.label}
              value={c.value}
              onClick={!c.disabled && detailRows ? () => setDrillDownCard(c.label) : undefined}
            />
          </div>
        ))}
      </DashboardGrid>

      {/* Bullet gauge (hidden for answers — no usable aging data) */}
      {stageName !== 'answers' && (
        <div className="mt-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <StageBulletGauge gauge={stageMetrics.gauge} slaOverride={slaOverride} />
            </div>
            {onSlaChange && slaOverride != null && (
              <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
                <label className="text-[10px] text-muted-foreground whitespace-nowrap">SLA target</label>
                <SlaInput value={slaOverride} onChange={onSlaChange} />
                <span className="text-[10px] text-muted-foreground">days</span>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Drill-down dialog */}
      {drillDownCard && (
        <CardDrillDown
          open={true}
          onClose={() => setDrillDownCard(null)}
          title={`${stageMetrics.label} — ${drillDownCard}`}
          rows={getDrillRows(drillDownCard)}
          columns={drillColumns}
        />
      )}
    </section>
  );
}
