/**
 * Shared escalation filter logic — extracted from escalationFilters.ts.
 */
export const ESCALATION_FILTERS = {
  complaints: (label: string) =>
    label.startsWith('Overdue') && !label.startsWith('Overdue 0-14'),

  formA: (label: string) =>
    label.includes('60-89') || label.includes('90+'),

  formC: (label: string) =>
    label.startsWith('Need to File Motion') || label.startsWith('Need a 10-Day Letter'),

  deps: (label: string) =>
    label.includes('90-179') || label.includes('180+'),
};

/** Count detail rows whose `_groupingLabel` matches the given filter. */
export function countOverdue(
  rows: Array<Record<string, unknown>>,
  filter: (label: string) => boolean,
): number {
  return rows.filter(r => {
    const lbl = r._groupingLabel;
    return typeof lbl === 'string' && filter(lbl);
  }).length;
}
