// shape-report.mjs — Shapes raw SF Analytics report JSON
// Same logic as api/src/functions/get-report.ts shapeReportSummary()
import { stdin } from 'process';

const chunks = [];
for await (const chunk of stdin) chunks.push(chunk);
const raw = JSON.parse(Buffer.concat(chunks).toString());

const grandTotals = raw.factMap['T!T']?.aggregates ?? raw.factMap['T']?.aggregates ?? [];
const aggregateInfo = raw.reportExtendedMetadata?.aggregateColumnInfo ?? {};

// Use reportMetadata.aggregates for correct ordering (matches factMap aggregate order)
const aggOrder = raw.reportMetadata?.aggregates ?? Object.keys(aggregateInfo);

function labelForIndex(i) {
  const key = aggOrder[i];
  return key && aggregateInfo[key] ? aggregateInfo[key].label : null;
}

const totals = grandTotals.map((agg, i) => ({
  label: labelForIndex(i) ?? agg.label,
  value: agg.value,
}));

const groupings = (raw.groupingsDown?.groupings ?? []).map(g => ({
  key: g.key,
  label: g.label,
  aggregates: (raw.factMap[`${g.key}!T`]?.aggregates ?? []).map((a, i) => ({
    label: labelForIndex(i) ?? a.label,
    value: a.value,
  })),
}));

// ── Post-processing filters ──────────────────────────────────────────
// Resolutions: exclude Adam Greenspan and adjust grand totals
const RESOLUTIONS_ID = '00OPp000003OOCLMA4';
const reportId = raw.attributes.reportId;

let filteredGroupings = groupings;
let filteredTotals = totals;

if (reportId === RESOLUTIONS_ID) {
  const excluded = groupings.filter(g => g.label === 'Adam Greenspan');
  filteredGroupings = groupings.filter(g => g.label !== 'Adam Greenspan');
  filteredGroupings.forEach((g, i) => g.key = String(i));
  if (excluded.length) {
    filteredTotals = totals.map(gt => {
      const sub = excluded[0].aggregates.find(a => a.label === gt.label);
      return sub ? { ...gt, value: +(gt.value - sub.value).toFixed(2) } : gt;
    });
  }
}

// ── Detail row extraction ────────────────────────────────────────────
// SF Reports API returns detail rows in two possible formats:
//   1. Separate factMap entries keyed as `groupKey!rowIdx` (older/smaller reports)
//   2. A `rows` array inside each factMap entry like `groupKey!T` (common format)
// We try both approaches.
let detailRows = undefined;
const detailCols = raw.reportMetadata?.detailColumns ?? [];
const detailColInfo = raw.reportExtendedMetadata?.detailColumnInfo ?? {};

function extractDataCells(dataCells) {
  const row = {};
  (dataCells ?? []).forEach((dc, ci) => {
    const colKey = detailCols[ci];
    const colInfo = detailColInfo[colKey];
    const colLabel = colInfo?.label ?? colKey ?? `col_${ci}`;
    row[colLabel] = dc.label ?? dc.value;
  });
  return row;
}

if (detailCols.length > 0) {
  detailRows = [];

  // Build a lookup from grouping key → label for all grouping levels.
  // groupingsDown can be nested: each grouping has sub-groupings.
  const keyToLabel = {};
  function walkGroupings(groups, parentLabel) {
    for (const g of groups) {
      keyToLabel[g.key] = parentLabel ? `${parentLabel} > ${g.label}` : g.label;
      if (g.groupings?.length) walkGroupings(g.groupings, keyToLabel[g.key]);
    }
  }
  walkGroupings(raw.groupingsDown?.groupings ?? [], '');

  // Scan ALL factMap entries for rows[] arrays (handles nested groupings)
  for (const [fmKey, entry] of Object.entries(raw.factMap)) {
    if (!entry?.rows?.length) continue;

    // Determine grouping label from the factMap key (e.g., "3_2!T" → key "3_2")
    const groupKey = fmKey.replace(/!.*$/, '');
    const label = keyToLabel[groupKey] ?? groupKey;

    for (const r of entry.rows) {
      detailRows.push({ _groupingLabel: label, ...extractDataCells(r.dataCells) });
    }
  }

  // Fallback: try separate factMap entries (key!0, key!1, ...) for top-level groupings
  if (detailRows.length === 0 && filteredGroupings.length > 0) {
    for (const g of filteredGroupings) {
      let rowIdx = 0;
      while (true) {
        const cell = raw.factMap[`${g.key}!${rowIdx}`];
        if (!cell) break;
        detailRows.push({ _groupingLabel: g.label, ...extractDataCells(cell.dataCells) });
        rowIdx++;
      }
    }
  }

  // Fallback for ungrouped: T!0, T!1, ...
  if (detailRows.length === 0) {
    let rowIdx = 0;
    while (true) {
      const cell = raw.factMap[`T!${rowIdx}`];
      if (!cell) break;
      detailRows.push(extractDataCells(cell.dataCells));
      rowIdx++;
    }
  }

  if (detailRows.length === 0) detailRows = undefined;
}

const shaped = {
  reportId,
  reportName: raw.reportMetadata.name,
  format: raw.reportMetadata.reportFormat,
  grandTotals: filteredTotals,
  groupings: filteredGroupings,
  hasDetailRows: raw.hasDetailRows,
  ...(detailRows ? { detailRows } : {}),
};

console.log(JSON.stringify(shaped, null, 2));
