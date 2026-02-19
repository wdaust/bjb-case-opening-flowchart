import type { SectionData } from '../types/flowchart.ts';

interface Props {
  section: SectionData;
}

export function DetailTable({ section }: Props) {
  const columns = section.tableColumns || ['#', 'Phase', 'Quick Action Panel', 'Assigned To', 'Task', 'SLA'];
  const hasFunction = columns.includes('Function');
  const tableBanners = section.tableBanners || [];

  let num = 1;

  return (
    <div className="px-4 pb-4">
      <h3 className="mt-4 mb-3 text-sm font-semibold text-foreground tracking-tight">Detailed Task Reference</h3>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {section.tasks.map(task => {
              const rows: React.ReactNode[] = [];

              if (task.excludeFromTable) {
                if (task.bannerAfter) {
                  rows.push(
                    <tr key={`banner-${task.id}`} style={{ background: task.bannerBg || 'hsl(var(--card))' }}>
                      <td colSpan={columns.length} className="text-center font-bold px-4 py-3" style={{ color: task.bannerColor || '#e65100' }}>
                        {task.bannerAfter}
                      </td>
                    </tr>
                  );
                }
                return rows;
              }

              for (const banner of tableBanners) {
                if (banner.before === task.id) {
                  rows.push(
                    <tr key={`banner-before-${task.id}`} style={{ background: banner.bg }}>
                      <td colSpan={columns.length} className="text-center font-bold px-4 py-3" style={{ color: banner.color }}>
                        {banner.text}
                      </td>
                    </tr>
                  );
                }
              }

              const currentNum = num++;
              const taskLabel = task.label.split('\n')[0];

              rows.push(
                <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{currentNum}</td>
                  <td className="px-4 py-3">
                    <span className={`phase-tag ${task.phaseClass}`}>
                      {task.phase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{task.quickAction}</td>
                  <td className="px-4 py-3 font-medium">{task.assignedTo}</td>
                  <td className="px-4 py-3">{taskLabel}</td>
                  {hasFunction && (
                    <td className="px-4 py-3 text-muted-foreground">{task.function || ''}</td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground">{task.sla}</td>
                </tr>
              );

              for (const banner of tableBanners) {
                if (banner.after === task.id) {
                  rows.push(
                    <tr key={`banner-after-${task.id}`} style={{ background: banner.bg }}>
                      <td colSpan={columns.length} className="text-center font-bold px-4 py-3" style={{ color: banner.color }}>
                        {banner.text}
                      </td>
                    </tr>
                  );
                }
              }

              return rows;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
