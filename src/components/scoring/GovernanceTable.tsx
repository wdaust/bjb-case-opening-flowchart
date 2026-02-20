
import type { GovernanceRow } from '../../data/scoringData.ts';

interface GovernanceTableProps {
  rows: GovernanceRow[];
}

export function GovernanceTable({ rows }: GovernanceTableProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Governance & Workflow
      </h3>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Stage</th>
              <th className="px-4 py-2 text-left font-medium">Who Scores</th>
              <th className="px-4 py-2 text-left font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2 text-foreground">{row.stage}</td>
                <td className="px-4 py-2 text-foreground">{row.whoScores}</td>
                <td className="px-4 py-2 text-foreground">{row.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
