import { z } from 'zod';
import { sfDate } from './fields';

export const ServiceRowSchema = z.object({
  'Matter Name': z.unknown(),
  'Client Name': z.unknown(),
  'Defendant': z.unknown(),
  'Case Type': z.unknown(),
  'Active Defendant?': z.unknown(),
  'Service complete date': z.unknown(),
  'Default Entered Date': z.unknown(),
  'Open Date': z.unknown(),
  'Display Name': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  clientName: typeof raw['Client Name'] === 'string' ? raw['Client Name'] : '',
  defendant: typeof raw['Defendant'] === 'string' ? raw['Defendant'] : '',
  caseType: typeof raw['Case Type'] === 'string' ? raw['Case Type'] : '',
  isActiveDefendant: typeof raw['Active Defendant?'] === 'string' && raw['Active Defendant?'] !== '-' && raw['Active Defendant?'] !== '',
  serviceCompleteDate: sfDate.parse(raw['Service complete date']),
  defaultEnteredDate: sfDate.parse(raw['Default Entered Date']),
  openDate: sfDate.parse(raw['Open Date']),
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type ServiceRow = z.infer<typeof ServiceRowSchema>;
