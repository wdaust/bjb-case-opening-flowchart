import { z } from 'zod';
import { sfDate } from './fields';

export const ResolutionRowSchema = z.object({
  'Display Name': z.unknown(),
  'Matter Name': z.unknown(),
  'Resolution Date': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  resolutionDate: sfDate.parse(raw['Resolution Date']),
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type ResolutionRow = z.infer<typeof ResolutionRowSchema>;
