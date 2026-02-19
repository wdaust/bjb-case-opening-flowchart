import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { AgingHeatmap } from '../components/dashboard/AgingHeatmap';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import {
  getActiveCases,
  getOverSlaCases,
  getStalledCases,
  stageOrder,
  stageLabels,
  getAgingDistribution,
  getCasesByStage,
  getDaysInStage,
  type Stage,
  type AgingBand,
  type LitCase,
} from '../data/mockData';

export default function InventoryHealth() {
  const navigate = useNavigate();

  const activeCases = getActiveCases();
  const overSlaCases = getOverSlaCases();
  const stalledCases = getStalledCases();

  const overSlaPercent = activeCases.length > 0
    ? `${((overSlaCases.length / activeCases.length) * 100).toFixed(1)}%`
    : '0%';

  const agingData = stageOrder.reduce((acc, stage) => {
    const casesInStage = getCasesByStage(stage);
    acc[stage] = getAgingDistribution(casesInStage);
    return acc;
  }, {} as Record<Stage, Record<AgingBand, number>>);

  const stalledColumns: Column<LitCase>[] = [
    { key: 'id', label: 'Case ID' },
    { key: 'title', label: 'Title' },
    { key: 'attorney', label: 'Attorney' },
    {
      key: 'stage',
      label: 'Stage',
      render: (row: LitCase) => stageLabels[row.stage],
    },
    {
      key: 'lastActivityDate',
      label: 'Days Since Activity',
      render: (row: LitCase) => {
        const days = Math.floor(
          (new Date('2026-02-19').getTime() - new Date(row.lastActivityDate).getTime()) / 86400000
        );
        return days;
      },
    },
    { key: 'nextAction', label: 'Next Action' },
  ];

  const overSlaColumns: Column<LitCase>[] = [
    { key: 'id', label: 'Case ID' },
    { key: 'title', label: 'Title' },
    { key: 'attorney', label: 'Attorney' },
    {
      key: 'stage',
      label: 'Stage',
      render: (row: LitCase) => stageLabels[row.stage],
    },
    {
      key: 'stageEntryDate',
      label: 'Days in Stage',
      render: (row: LitCase) => getDaysInStage(row),
    },
    {
      key: 'slaTarget',
      label: 'SLA Target',
      render: (row: LitCase) => `${row.slaTarget}d`,
    },
    {
      key: 'openDate',
      label: 'Over By',
      render: (row: LitCase) => `${getDaysInStage(row) - row.slaTarget}d`,
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Inventory Health' },
      ]} />
      <FilterBar />

      <DashboardGrid cols={4}>
        <StatCard label="Active Cases" value={activeCases.length} />
        <StatCard
          label="Over SLA"
          value={overSlaCases.length}
          delta={overSlaPercent}
          deltaType="negative"
        />
        <StatCard
          label="Silent Stalls"
          value={stalledCases.length}
          delta="21+ days inactive"
          deltaType="negative"
        />
        <StatCard
          label="Next-Action Coverage"
          value="91%"
          deltaType="positive"
        />
      </DashboardGrid>

      <SectionHeader title="Aging Heatmap" subtitle="All stages x aging bands" />
      <AgingHeatmap data={agingData} />

      <SectionHeader title="Silent Stall Cases" subtitle="No activity for 21+ days" />
      <DataTable
        data={stalledCases}
        columns={stalledColumns}
        keyField="id"
        onRowClick={(row) => navigate(`/case/${row.id}`)}
        maxRows={25}
      />

      <SectionHeader title="Over-SLA Cases" subtitle="Cases exceeding stage time limits" />
      <DataTable
        data={overSlaCases}
        columns={overSlaColumns}
        keyField="id"
        onRowClick={(row) => navigate(`/case/${row.id}`)}
        maxRows={25}
      />
    </div>
  );
}
