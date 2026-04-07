/**
 * Cross-reference utility: maps Display Name → attorney using Open Lit report data.
 * Open Lit is grouped by attorney, so _groupingLabel contains "Attorney > ..." or just "Attorney".
 * Detail rows have a "Display Name" field we can match against.
 */

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

/**
 * Build a Map of Display Name → attorney name from Open Lit detail rows.
 * Open Lit _groupingLabel is the attorney name (top-level grouping).
 */
export function buildAttorneyLookup(openLitRows: DetailRow[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const row of openLitRows) {
    const attorney = row._groupingLabel;
    const displayName = row['Display Name'] as string | undefined;
    if (typeof attorney === 'string' && typeof displayName === 'string' && displayName) {
      // Only set if not already mapped (first occurrence wins)
      if (!lookup.has(displayName)) {
        lookup.set(displayName, attorney);
      }
    }
  }
  return lookup;
}

/**
 * Filter detail rows to only those belonging to the given attorney,
 * using a Display Name → attorney lookup built from Open Lit data.
 */
export function filterRowsByAttorney(
  rows: DetailRow[],
  lookup: Map<string, string>,
  attorney: string,
  displayNameKey = 'Display Name',
): DetailRow[] {
  return rows.filter(row => {
    const dn = row[displayNameKey];
    return typeof dn === 'string' && lookup.get(dn) === attorney;
  });
}
