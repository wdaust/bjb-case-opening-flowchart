import { z } from 'zod';
import { sfDate } from './fields';

export const AnswerRowSchema = z.object({
  'Matter Name': z.unknown(),
  'Client Name': z.unknown(),
  'Defendant': z.unknown(),
  'Answer Filed': z.unknown(),
  'Default Entered Date': z.unknown(),
  'Active Defendant?': z.unknown(),
  'Defendant Deposition': z.unknown(),
  'Display Name': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  clientName: typeof raw['Client Name'] === 'string' ? raw['Client Name'] : '',
  defendant: typeof raw['Defendant'] === 'string' ? raw['Defendant'] : '',
  answerFiled: typeof raw['Answer Filed'] === 'string' && raw['Answer Filed'] !== '-' ? raw['Answer Filed'] : '',
  defaultEnteredDate: sfDate.parse(raw['Default Entered Date']),
  hasDefaultEntered: typeof raw['Default Entered Date'] === 'string' && raw['Default Entered Date'] !== '-' && raw['Default Entered Date'] !== '',
  isActiveDefendant: typeof raw['Active Defendant?'] === 'string' && raw['Active Defendant?'] !== '-' && raw['Active Defendant?'] !== '',
  defendantDeposition: typeof raw['Defendant Deposition'] === 'string' ? raw['Defendant Deposition'] : '',
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type AnswerRow = z.infer<typeof AnswerRowSchema>;
