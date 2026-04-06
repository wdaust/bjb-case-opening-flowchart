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

const shaped = {
  reportId,
  reportName: raw.reportMetadata.name,
  format: raw.reportMetadata.reportFormat,
  grandTotals: filteredTotals,
  groupings: filteredGroupings,
  hasDetailRows: raw.hasDetailRows,
};

console.log(JSON.stringify(shaped, null, 2));
