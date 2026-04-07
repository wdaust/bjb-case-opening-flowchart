// shape-dashboard.mjs — Shapes raw SF Analytics dashboard JSON
// Matches the output format used by api/src/functions/get-dashboard.ts
import { stdin } from 'process';

const chunks = [];
for await (const chunk of stdin) chunks.push(chunk);
const raw = JSON.parse(Buffer.concat(chunks).toString());

const meta = raw.dashboardMetadata;
const compMeta = meta?.components ?? [];

// Build lookup: component ID → metadata
const metaById = {};
for (const cm of compMeta) {
  metaById[cm.id] = cm;
}

const components = [];

// componentData is keyed by numeric index (0, 1, 2, ...)
for (const [, cd] of Object.entries(raw.componentData ?? {})) {
  if (!cd || !cd.reportResult) continue;

  const cm = metaById[cd.componentId];
  if (!cm || !cm.header) continue;

  const vizType = cm.properties?.visualizationType ?? cm.componentType ?? 'table';
  if (vizType === 'RichText') continue;

  const rr = cd.reportResult;
  const aggInfo = rr.reportExtendedMetadata?.aggregateColumnInfo ?? {};
  const aggKeys = Object.keys(aggInfo);
  const columnLabels = aggKeys.map(k => aggInfo[k].label);

  const groupings = rr.groupingsDown?.groupings ?? [];

  let rows;
  if (groupings.length > 0) {
    rows = groupings.map(g => {
      const aggs = rr.factMap[`${g.key}!T`]?.aggregates ?? [];
      return {
        label: g.label,
        values: aggs.map((a, i) => ({
          label: columnLabels[i] ?? a.label,
          value: a.value,
        })),
      };
    });
  } else {
    const aggs = rr.factMap['T!T']?.aggregates ?? rr.factMap['T']?.aggregates ?? [];
    rows = [{
      label: cm.header,
      values: aggs.map((a, i) => ({
        label: columnLabels[i] ?? a.label,
        value: a.value,
      })),
    }];
  }

  // Extract source report ID from embedded reportResult metadata
  const sourceReportId = cd.reportResult?.reportMetadata?.id
    ?? cd.reportResult?.attributes?.reportId
    ?? undefined;

  components.push({
    title: cm.header,
    chartType: vizType.toLowerCase(),
    columns: columnLabels,
    rows,
    ...(sourceReportId ? { sourceReportId } : {}),
  });
}

// Disambiguate duplicate titles by appending "(Value)" to currency/amount metrics
const titleCounts = {};
for (const c of components) {
  titleCounts[c.title] = (titleCounts[c.title] || 0) + 1;
}
for (const title of Object.keys(titleCounts)) {
  if (titleCounts[title] <= 1) continue;
  const dupes = components.filter(c => c.title === title);
  for (const c of dupes) {
    const hasAmount = c.columns.some(col =>
      /sum|amount|value|midpoint|fee|revenue/i.test(col) && !/count/i.test(col)
    );
    if (hasAmount) c.title = `${c.title} (Value)`;
  }
}

const shaped = {
  dashboardId: meta.id,
  dashboardName: meta.name,
  components,
};

console.log(JSON.stringify(shaped, null, 2));
