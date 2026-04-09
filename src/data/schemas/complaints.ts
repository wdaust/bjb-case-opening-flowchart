import { z } from 'zod';
import { sfDate } from './fields';

export const ComplaintRowSchema = z.object({
  'Display Name': z.unknown(),
  'Matter Name': z.unknown(),
  'Date Assigned to Team to Today': z.unknown(),
  'Date Assigned To Litigation Unit': z.unknown(),
  'Blocker to Filing Complaint': z.unknown(),
  'Blocker': z.unknown(),
  'PI Status': z.unknown(),
  'Active Stage': z.unknown(),
  'Complaint Filed Date': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  daysAssigned: (() => {
    const v = raw['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    return isNaN(num) ? null : num;
  })(),
  assignedDate: sfDate.parse(raw['Date Assigned To Litigation Unit']),
  blocker: (() => {
    const b = raw['Blocker to Filing Complaint'] ?? raw['Blocker'];
    return typeof b === 'string' && b !== '-' ? b : '';
  })(),
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  complaintFiledDate: sfDate.parse(raw['Complaint Filed Date']),
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type ComplaintRow = z.infer<typeof ComplaintRowSchema>;
