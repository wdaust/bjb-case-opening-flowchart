import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DeadlineList } from '../components/dashboard/DeadlineList';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { getUpcomingDeadlines } from '../data/mockData';

type DeadlineRow = ReturnType<typeof getUpcomingDeadlines>[number];

export default function RiskRadar() {
  const navigate = useNavigate();

  const allDeadlines = getUpcomingDeadlines(90);
  const solDeadlines = allDeadlines.filter((d) => d.type === 'SOL');
  const trialDeadlines = allDeadlines.filter((d) => d.type === 'trial');
  const expertDiscoveryDeadlines = allDeadlines.filter(
    (d) => d.type === 'expert' || d.type === 'discovery'
  );
  const courtDeadlines = allDeadlines.filter(
    (d) => d.type === 'trial' || d.type === 'court' || d.type === 'depo'
  );

  const solColumns: Column<DeadlineRow>[] = [
    { key: 'caseId', label: 'Case ID' },
    { key: 'caseTitle', label: 'Case' },
    { key: 'date', label: 'Date' },
    { key: 'attorney', label: 'Attorney' },
    {
      key: 'description',
      label: 'Days Left',
      render: (row: DeadlineRow) => {
        const daysLeft = Math.ceil(
          (new Date(row.date).getTime() - new Date('2026-02-19').getTime()) / 86400000
        );
        const colorClass = daysLeft < 14 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-emerald-500';
        return <span className={colorClass}>{daysLeft}</span>;
      },
    },
  ];

  const courtColumns: Column<DeadlineRow>[] = [
    { key: 'caseId', label: 'Case ID' },
    { key: 'caseTitle', label: 'Case' },
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'attorney', label: 'Attorney' },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Risk & Deadline Radar' },
      ]} />
      <FilterBar />

      <DashboardGrid cols={4}>
        <StatCard label="Total Deadlines (90d)" value={allDeadlines.length} />
        <StatCard label="SOL Deadlines" value={solDeadlines.length} />
        <StatCard label="Trial Dates" value={trialDeadlines.length} />
        <StatCard label="Expert/Discovery" value={expertDiscoveryDeadlines.length} />
      </DashboardGrid>

      <SectionHeader title="Deadline Timeline" subtitle="All deadlines in next 90 days" />
      <DeadlineList deadlines={allDeadlines} maxItems={30} />

      <SectionHeader title="SOL Countdown" subtitle="Statute of limitations approaching" />
      <DataTable
        data={solDeadlines}
        columns={solColumns}
        keyField="caseId"
        onRowClick={(row) => navigate(`/case/${row.caseId}`)}
      />

      <SectionHeader title="Court Date Calendar" subtitle="Upcoming trial and court dates" />
      <DataTable
        data={courtDeadlines}
        columns={courtColumns}
        keyField="caseId"
        onRowClick={(row) => navigate(`/case/${row.caseId}`)}
      />
    </div>
  );
}
