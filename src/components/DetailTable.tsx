import type { SectionData } from '../types/flowchart.ts';

interface Props {
  section: SectionData;
  visible: boolean;
}

export function DetailTable({ section, visible }: Props) {
  if (!visible) return null;

  const columns = section.tableColumns || ['#', 'Phase', 'Quick Action Panel', 'Assigned To', 'Task', 'SLA'];
  const hasFunction = columns.includes('Function');
  const tableBanners = section.tableBanners || [];

  let num = 1;

  return (
    <div style={{ padding: '0 16px 16px', overflow: 'auto' }}>
      <h3 style={{ color: section.themeColor, margin: '16px 0 10px' }}>Detailed Task Reference</h3>
      <div style={{ borderRadius: 8, border: '1px solid var(--border-color, #e0e0e0)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{
                  background: section.themeColor,
                  color: '#fff',
                  padding: '10px 12px',
                  textAlign: 'left',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.tasks.map(task => {
              const rows: React.ReactNode[] = [];

              if (task.excludeFromTable) {
                if (task.bannerAfter) {
                  rows.push(
                    <tr key={`banner-${task.id}`} style={{ background: task.bannerBg || 'var(--surface, #fff3e0)' }}>
                      <td colSpan={columns.length} style={{
                        textAlign: 'center', fontWeight: 700,
                        color: task.bannerColor || '#e65100', padding: '10px 12px',
                      }}>
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
                      <td colSpan={columns.length} style={{
                        textAlign: 'center', fontWeight: 700,
                        color: banner.color, padding: '10px 12px',
                      }}>
                        {banner.text}
                      </td>
                    </tr>
                  );
                }
              }

              const currentNum = num++;
              const taskLabel = task.label.split('\n')[0];

              rows.push(
                <tr key={task.id} style={{ background: currentNum % 2 === 0 ? 'var(--table-stripe, #f9f9f9)' : 'var(--surface, #fff)' }}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{currentNum}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
                    <span className={`phase-tag ${task.phaseClass}`} style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                      fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap',
                    }}>
                      {task.phase}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{task.quickAction}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{task.assignedTo}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{taskLabel}</td>
                  {hasFunction && (
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{task.function || ''}</td>
                  )}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>{task.sla}</td>
                </tr>
              );

              for (const banner of tableBanners) {
                if (banner.after === task.id) {
                  rows.push(
                    <tr key={`banner-after-${task.id}`} style={{ background: banner.bg }}>
                      <td colSpan={columns.length} style={{
                        textAlign: 'center', fontWeight: 700,
                        color: banner.color, padding: '10px 12px',
                      }}>
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
