/**
 * Discovery Flow — computes Sankey data and pipeline stats from the LDN bundle.
 * Determines where each matter sits in the discovery lifecycle by cross-referencing
 * stage reports against the Open Lit universe.
 */
import type { LdnReportBundle, StageName } from './types';
import { formCBucket, formABucket, parseDate, daysFromToday, uniqueMatterCount, median } from './shared';
import { filterLitOnlyRaw } from './shared';

type Row = Record<string, unknown>;

export interface FlowNode {
  id: string;
  nodeColor: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
  startColor?: string;
  endColor?: string;
}

export interface SankeyData {
  nodes: FlowNode[];
  links: FlowLink[];
}

export interface PipelineStage {
  stage: string;
  stageKey: StageName | 'complete';
  count: number;
  medianDays: number;
  stuck: number;
  onTrackPct: number;
}

export interface BlockedMatter {
  matter: string;
  stage: string;
  days: number;
  blocker: string;
}

export interface DiscoveryFlowData {
  sankey: SankeyData;
  pipeline: PipelineStage[];
  blocked: BlockedMatter[];
  totalOpen: number;
  totalStuck: number;
  medianPipeDays: number;
}

// Stage order for the pipeline
const FLOW_STAGES = ['Complaints', 'Service', 'Answers', 'Form A', 'Form C', 'Depositions', 'DED'] as const;
const FLOW_STAGE_KEYS: Record<string, StageName> = {
  'Complaints': 'complaints',
  'Service': 'service',
  'Answers': 'answers',
  'Form A': 'formA',
  'Form C': 'formC',
  'Depositions': 'depositions',
  'DED': 'ded',
};


/** Build a set of matter names present in a report's detail rows. */
function matterSet(rows: Row[] | undefined, key = 'Display Name'): Set<string> {
  const s = new Set<string>();
  if (!rows) return s;
  for (const r of rows) {
    const v = r[key];
    if (v != null && v !== '' && v !== '-') s.add(String(v));
  }
  return s;
}

/** Check if a matter is "stuck" at a stage based on SLA thresholds. */
function isStuck(stage: string, row: Row): boolean {
  switch (stage) {
    case 'Complaints': {
      const v = row['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num > 14;
    }
    case 'Service': return true; // All past-due service items are stuck
    case 'Answers': return true; // Missing answers are stuck
    case 'Form A': {
      const b = formABucket(String(row._groupingLabel ?? ''));
      return b.startsWith('Form A Overdue');
    }
    case 'Form C': {
      const b = formCBucket(String(row._groupingLabel ?? ''));
      return b === 'Need to File Motion' || b === 'Need a 10-Day Letter';
    }
    case 'Depositions': {
      const v = row['Time from Filed Date'] ?? row['Time from Filed'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num >= 180;
    }
    case 'DED': {
      const d = parseDate(row['Discovery End Date']);
      return d ? daysFromToday(d) < 0 : false;
    }
    default: return false;
  }
}

/** Get days-in-stage for a row. */
function getDaysInStage(stage: string, row: Row): number {
  switch (stage) {
    case 'Complaints': {
      const v = row['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? 0 : num;
    }
    case 'Form A':
    case 'Form C': {
      const v = row['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? 0 : num;
    }
    case 'Depositions': {
      const v = row['Time from Filed Date'] ?? row['Time from Filed'];
      const num = typeof v === 'number' ? v : Number(v);
      return isNaN(num) ? 0 : num;
    }
    case 'DED': {
      const d = parseDate(row['Discovery End Date']);
      return d ? Math.abs(daysFromToday(d)) : 0;
    }
    default: return 0;
  }
}

/** Get blocker description for a stuck matter. */
function getBlocker(stage: string, row: Row): string {
  switch (stage) {
    case 'Complaints': {
      const b = row['Blocker to Filing Complaint'] ?? row['Blocker'];
      return b && b !== '-' ? String(b) : 'Overdue >14d';
    }
    case 'Service': return 'Past-due service';
    case 'Answers': {
      const def = row['Default Entered Date'];
      return def && def !== '-' ? 'Default entered' : 'No answer filed';
    }
    case 'Form A': return 'Form A overdue';
    case 'Form C': {
      const b = formCBucket(String(row._groupingLabel ?? ''));
      if (b === 'Need to File Motion') return 'Needs motion to compel';
      if (b === 'Need a 10-Day Letter') {
        const fa = row['Form A Served'];
        return (fa != null && fa !== '' && fa !== '-') ? 'Needs 10-day letter' : 'Awaiting our Form A';
      }
      return 'Form C overdue';
    }
    case 'Depositions': return 'Deposition 180+ days';
    case 'DED': return 'Past DED';
    default: return '';
  }
}

export function computeDiscoveryFlow(bundle: LdnReportBundle): DiscoveryFlowData {
  // Universe: Open Lit
  const openLitRows = filterLitOnlyRaw(bundle.openLit?.detailRows ?? []);
  const totalOpen = uniqueMatterCount(openLitRows);

  // Build matter sets for each stage report
  const complaintMatters = matterSet(bundle.complaints?.detailRows);
  const serviceMatters = matterSet(bundle.service?.detailRows, 'Matter Name');
  const answerMatters = matterSet(bundle.answers?.detailRows, 'Matter Name');
  const formAMatters = matterSet(filterLitOnlyRaw(bundle.formA?.detailRows ?? []) as Row[]);
  const formCMatters = matterSet(filterLitOnlyRaw(bundle.formC?.detailRows ?? []) as Row[]);
  const depMatters = matterSet(filterLitOnlyRaw(bundle.deps?.detailRows ?? []) as Row[]);

  // Map each open lit matter to its earliest incomplete stage
  const matterStage = new Map<string, string>();
  const seen = new Set<string>();

  for (const r of openLitRows) {
    const name = String(r['Display Name'] ?? r['Matter Name'] ?? '');
    if (!name || seen.has(name)) continue;
    seen.add(name);

    if (complaintMatters.has(name)) { matterStage.set(name, 'Complaints'); continue; }
    if (serviceMatters.has(name)) { matterStage.set(name, 'Service'); continue; }
    if (answerMatters.has(name)) { matterStage.set(name, 'Answers'); continue; }
    if (formAMatters.has(name)) { matterStage.set(name, 'Form A'); continue; }
    if (formCMatters.has(name)) { matterStage.set(name, 'Form C'); continue; }
    if (depMatters.has(name)) { matterStage.set(name, 'Depositions'); continue; }
    // Check DED
    const ded = r['Discovery End Date'];
    if (ded && ded !== '-') {
      const d = parseDate(ded);
      if (d && daysFromToday(d) <= 60) { matterStage.set(name, 'DED'); continue; }
    }
    // No active stage issues — considered progressing normally
  }

  // Count matters per stage
  const stageCounts = new Map<string, number>();
  for (const stage of FLOW_STAGES) stageCounts.set(stage, 0);
  for (const [, stage] of matterStage) {
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  // Build report row lookups for stuck/blocker analysis
  const stageRows = new Map<string, Row[]>();
  stageRows.set('Complaints', bundle.complaints?.detailRows ?? []);
  stageRows.set('Service', bundle.service?.detailRows ?? []);
  stageRows.set('Answers', bundle.answers?.detailRows ?? []);
  stageRows.set('Form A', filterLitOnlyRaw(bundle.formA?.detailRows ?? []) as Row[]);
  stageRows.set('Form C', filterLitOnlyRaw(bundle.formC?.detailRows ?? []) as Row[]);
  stageRows.set('Depositions', filterLitOnlyRaw(bundle.deps?.detailRows ?? []) as Row[]);
  stageRows.set('DED', openLitRows);

  // Build pipeline stats and blocked matters
  const pipeline: PipelineStage[] = [];
  const blocked: BlockedMatter[] = [];
  let totalStuck = 0;
  const allDays: number[] = [];

  for (const stage of FLOW_STAGES) {
    const count = stageCounts.get(stage) ?? 0;
    const rows = stageRows.get(stage) ?? [];
    const daysArr: number[] = [];
    let stuckCount = 0;

    for (const r of rows) {
      const name = String(r['Display Name'] ?? r['Matter Name'] ?? '');
      if (!matterStage.has(name) || matterStage.get(name) !== stage) continue;

      const days = getDaysInStage(stage, r);
      daysArr.push(days);
      allDays.push(days);

      if (isStuck(stage, r)) {
        stuckCount++;
        blocked.push({
          matter: name,
          stage,
          days,
          blocker: getBlocker(stage, r),
        });
      }
    }

    totalStuck += stuckCount;
    pipeline.push({
      stage,
      stageKey: FLOW_STAGE_KEYS[stage] ?? 'complaints',
      count,
      medianDays: median(daysArr),
      stuck: stuckCount,
      onTrackPct: count > 0 ? Math.round(((count - stuckCount) / count) * 100) : 100,
    });
  }

  // Sort blocked by days descending
  blocked.sort((a, b) => b.days - a.days);

  // Build Sankey data — color nodes by health, not stage
  const pipelineMap = new Map(pipeline.map(p => [p.stage, p]));
  const nodes: FlowNode[] = FLOW_STAGES.map(s => {
    const p = pipelineMap.get(s);
    const pct = p?.onTrackPct ?? 100;
    const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
    return { id: s, nodeColor: color };
  });

  const nodeColorMap = new Map(nodes.map(n => [n.id, n.nodeColor]));
  const links: FlowLink[] = [];
  for (let i = 0; i < FLOW_STAGES.length - 1; i++) {
    const from = FLOW_STAGES[i];
    const to = FLOW_STAGES[i + 1];
    // Flow = matters that have passed through this stage (total open minus those stuck at or before)
    let flowBefore = 0;
    for (let j = 0; j <= i; j++) flowBefore += stageCounts.get(FLOW_STAGES[j]) ?? 0;
    const flowThrough = Math.max(1, totalOpen - flowBefore);
    links.push({
      source: from,
      target: to,
      value: flowThrough,
      startColor: nodeColorMap.get(from),
      endColor: nodeColorMap.get(to),
    });
  }

  return {
    sankey: { nodes, links },
    pipeline,
    blocked,
    totalOpen,
    totalStuck,
    medianPipeDays: median(allDays),
  };
}
