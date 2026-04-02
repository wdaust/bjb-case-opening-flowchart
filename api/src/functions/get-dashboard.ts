import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { sfFetch } from './sf-auth.js';

interface SfDashboardComponent {
  componentData: {
    columns: Array<{ label: string }>;
    values: Array<{
      label: { label: string };
      dataCells: Array<{ label: string; value: number | null }>;
    }>;
  };
  header: string;
  type: string;
  properties?: {
    visualizationType?: string;
  };
}

interface SfDashboardResult {
  id: string;
  name: string;
  components: SfDashboardComponent[];
}

function shapeDashboard(raw: SfDashboardResult) {
  const components = raw.components.map(comp => {
    const chartType = comp.properties?.visualizationType ?? comp.type ?? 'table';
    const columnLabels = comp.componentData.columns.map(c => c.label);

    const rows = comp.componentData.values.map(row => ({
      label: row.label.label,
      values: row.dataCells.map(cell => ({
        label: cell.label,
        value: cell.value,
      })),
    }));

    return {
      title: comp.header,
      chartType,
      columns: columnLabels,
      rows,
    };
  });

  return {
    dashboardId: raw.id,
    dashboardName: raw.name,
    components,
  };
}

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const dashboardId = req.query.get('id');
  if (!dashboardId) {
    return { status: 400, jsonBody: { error: 'Missing required parameter: id' } };
  }

  try {
    const raw = await sfFetch(
      `/services/data/v62.0/analytics/dashboards/${dashboardId}`
    ) as SfDashboardResult;

    const shaped = shapeDashboard(raw);
    return {
      status: 200,
      jsonBody: { ok: true, data: shaped, fetchedAt: new Date().toISOString() },
      headers: { 'Cache-Control': 'no-cache' },
    };
  } catch (err) {
    context.error('get-dashboard error:', err);
    return {
      status: 502,
      jsonBody: { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
    };
  }
}

app.http('get-dashboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'get-dashboard',
  handler,
});
