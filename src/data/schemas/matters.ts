import { z } from 'zod';

export const MatterRowSchema = z.object({
  'Display Name': z.unknown(),
  'Matter Name': z.unknown(),
  'Case Type': z.unknown(),
  'Active Stage': z.unknown(),
  'PI Status': z.unknown(),
  'Matter State': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  caseType: typeof raw['Case Type'] === 'string' ? raw['Case Type'] : '',
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  matterState: typeof raw['Matter State'] === 'string' ? raw['Matter State'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type MatterRow = z.infer<typeof MatterRowSchema>;
