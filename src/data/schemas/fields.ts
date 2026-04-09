/**
 * Shared Salesforce field name mappings and reusable Zod parsers.
 * Central dictionary: raw SF field names → clean camelCase property names.
 */
import { z } from 'zod';

// ── Raw SF field name → clean property name ──────────────────────────────

export const SF_FIELDS = {
  // Matter identity
  'Display Name': 'displayName',
  'Matter Name': 'matterName',
  'Matter State': 'matterState',
  'Case Type': 'caseType',
  'Client Name': 'clientName',
  'Defendant': 'defendant',

  // Status & stage
  'PI Status': 'piStatus',
  'Active Stage': 'activeStage',
  'Active Defendant?': 'isActiveDefendant',

  // Dates & aging
  'Date Assigned to Team to Today': 'daysAssigned',
  'Date Assigned To Litigation Unit': 'assignedDate',
  'Complaint Filed Date': 'complaintFiledDate',
  'Date Motion Filed': 'dateMotionFiled',
  'Answer Filed': 'answerFiled',
  'Answer Date to Today': 'daysSinceAnswer',
  'Open Date': 'openDate',
  'Resolution Date': 'resolutionDate',
  'Discovery End Date': 'discoveryEndDate',
  'Days to Service': 'daysToService',
  'Time from Filed Date': 'daysFromFiled',
  'Time from Filed': 'daysFromFiledAlt',
  'Service complete date': 'serviceCompleteDate',
  'Default Entered Date': 'defaultEnteredDate',

  // Deposition
  'Client Deposition': 'clientDeposition',
  'Client Depo Date': 'clientDepoDate',
  'Defendant Deposition': 'defendantDeposition',

  // Blocker
  'Blocker to Filing Complaint': 'blocker',
  'Blocker': 'blockerAlt',

  // Form fields
  'Form A Served': 'formAServed',
  'Date Form A Sent to Attorney for Review': 'formASentToReview',
  'Form C Received': 'formCReceived',
  '10 Day Letter Sent': 'tenDayLetterSent',

  // Inventory
  'Age in Litigation': 'ageInLitigation',
  'Statute of Limitations': 'statuteOfLimitations',

  // Internal
  '_groupingLabel': 'groupingLabel',
} as const;

export type SfFieldName = keyof typeof SF_FIELDS;

// ── Reusable Zod parsers ─────────────────────────────────────────────────

/** Parse SF date strings; returns null for '-' or empty. */
export function parseDate(s: unknown): Date | null {
  if (typeof s !== 'string' || s === '-' || !s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Days between a date and today. */
export function daysSinceToday(d: Date): number {
  return Math.round((Date.now() - d.getTime()) / 86_400_000);
}

/** Days from today to a future date. */
export function daysFromToday(d: Date): number {
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

/** Zod: coerce string|number to number, defaulting to null on failure. */
export const sfDays = z.union([
  z.number(),
  z.string().transform(s => {
    const n = Number(s);
    return isNaN(n) ? null : n;
  }),
]).nullable().optional().catch(null);

/** Zod: parse a SF date string to Date | null. */
export const sfDate = z.unknown().transform(v => parseDate(v));

/** Zod: check if a field is "present" (non-empty, non-dash). */
export const sfPresent = z.unknown().transform(v =>
  v != null && v !== '' && v !== '-',
);

/** Optional string that defaults to empty. */
export const sfStr = z.unknown().transform(v =>
  typeof v === 'string' ? v : '',
);

/** Optional string that preserves raw value or defaults to empty. */
export const sfStrOpt = z.unknown().transform(v =>
  typeof v === 'string' && v !== '-' ? v : '',
);
