import { z } from 'zod';
import { sfDate } from './fields';

export const OpenLitRowSchema = z.object({
  'Display Name': z.unknown(),
  'Matter Name': z.unknown(),
  'Case Type': z.unknown(),
  'Active Stage': z.unknown(),
  'PI Status': z.unknown(),
  'Discovery End Date': z.unknown(),
  'Age in Litigation': z.unknown(),
  'Statute of Limitations': z.unknown(),
  'Matter State': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  caseType: typeof raw['Case Type'] === 'string' ? raw['Case Type'] : '',
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  discoveryEndDate: sfDate.parse(raw['Discovery End Date']),
  discoveryEndDateRaw: typeof raw['Discovery End Date'] === 'string' ? raw['Discovery End Date'] : '',
  ageInLitigation: (() => {
    const v = raw['Age in Litigation'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  })(),
  statuteOfLimitations: typeof raw['Statute of Limitations'] === 'string' ? raw['Statute of Limitations'] : '',
  matterState: typeof raw['Matter State'] === 'string' ? raw['Matter State'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type OpenLitRow = z.infer<typeof OpenLitRowSchema>;
