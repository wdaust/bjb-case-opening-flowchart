// ── Department Config Registry ───────────────────────────────────────────
// Maps deptId/pageId URL params to DeptPageConfig objects.

import type { DeptPageConfig } from './types';
import { intakePages } from './intake';
import { preLitPages } from './preLit';
import { medRecordsPages } from './medRecords';
import { claimsPages } from './claims';
import { litPages } from './lit';
import { pipArbsPages } from './pipArbs';
import { medMarketingPages } from './medMarketing';
import { legalMarketingPages } from './legalMarketing';

const allPages: DeptPageConfig[] = [
  ...intakePages,
  ...preLitPages,
  ...medRecordsPages,
  ...claimsPages,
  ...litPages,
  ...pipArbsPages,
  ...medMarketingPages,
  ...legalMarketingPages,
];

const registry = new Map<string, DeptPageConfig>();
for (const page of allPages) {
  registry.set(`${page.deptId}/${page.pageId}`, page);
}

export function getDeptPageConfig(deptId: string, pageId: string): DeptPageConfig | undefined {
  return registry.get(`${deptId}/${pageId}`);
}

export function getAllDeptPages(): DeptPageConfig[] {
  return allPages;
}
