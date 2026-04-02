import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { sfFetch } from './sf-auth.js';

interface SfReportGrouping {
  key: string;
  label: string;
  value: unknown;
}

interface SfReportResult {
  attributes: { reportId: string; reportName: string };
  reportMetadata: {
    name: string;
    reportFormat: string;
    groupingsDown: Array<{ name: string; label: string }>;
  };
  factMap: Record<string, {
    aggregates: Array<{ label: string; value: number | null }>;
    rows?: Array<{ dataCells: Array<{ label: string; value: unknown }> }>;
  }>;
  groupingsDown?: {
    groupings: SfReportGrouping[];
  };
  reportExtendedMetadata?: {
    aggregateColumnInfo: Record<string, { label: string }>;
  };
  hasDetailRows: boolean;
}

function shapeReportSummary(raw: SfReportResult) {
  const grandTotals = raw.factMap['T!T']?.aggregates ?? raw.factMap['T']?.aggregates ?? [];
  const aggregateInfo = raw.reportExtendedMetadata?.aggregateColumnInfo ?? {};

  const totals = grandTotals.map((agg, i) => {
    const keys = Object.keys(aggregateInfo);
    const label = keys[i] ? aggregateInfo[keys[i]].label : agg.label;
    return { label, value: agg.value };
  });

  const groupings = raw.groupingsDown?.groupings?.map(g => ({
    key: g.key,
    label: g.label,
    aggregates: (raw.factMap[`${g.key}!T`]?.aggregates ?? []).map((a, i) => {
      const keys = Object.keys(aggregateInfo);
      const label = keys[i] ? aggregateInfo[keys[i]].label : a.label;
      return { label, value: a.value };
    }),
  })) ?? [];

  return {
    reportId: raw.attributes.reportId,
    reportName: raw.reportMetadata.name,
    format: raw.reportMetadata.reportFormat,
    grandTotals: totals,
    groupings,
    hasDetailRows: raw.hasDetailRows,
  };
}

function shapeReportFull(raw: SfReportResult) {
  const summary = shapeReportSummary(raw);
  const detailRows: Array<Record<string, unknown>> = [];

  for (const [key, fact] of Object.entries(raw.factMap)) {
    if (fact.rows) {
      for (const row of fact.rows) {
        const obj: Record<string, unknown> = { _groupKey: key };
        row.dataCells.forEach((cell, i) => {
          obj[`col_${i}`] = cell.label;
        });
        detailRows.push(obj);
      }
    }
  }

  return { ...summary, detailRows };
}

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const reportId = req.query.get('id');
  if (!reportId) {
    return { status: 400, jsonBody: { error: 'Missing required parameter: id' } };
  }

  const mode = req.query.get('mode') ?? 'summary';
  if (mode !== 'summary' && mode !== 'full') {
    return { status: 400, jsonBody: { error: 'Invalid mode. Use "summary" or "full".' } };
  }

  try {
    const includeDetails = mode === 'full' ? 'true' : 'false';
    const raw = await sfFetch(
      `/services/data/v62.0/analytics/reports/${reportId}?includeDetails=${includeDetails}`
    ) as SfReportResult;

    const shaped = mode === 'full' ? shapeReportFull(raw) : shapeReportSummary(raw);
    return {
      status: 200,
      jsonBody: { ok: true, data: shaped, mode, fetchedAt: new Date().toISOString() },
      headers: { 'Cache-Control': 'no-cache' },
    };
  } catch (err) {
    context.error('get-report error:', err);
    return {
      status: 502,
      jsonBody: { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
    };
  }
}

app.http('get-report', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'get-report',
  handler,
});
