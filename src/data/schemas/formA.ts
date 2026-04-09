import { z } from 'zod';
import { sfDate } from './fields';

export const FormARowSchema = z.object({
  'Display Name': z.unknown(),
  'Defendant': z.unknown(),
  'Answer Filed': z.unknown(),
  'Answer Date to Today': z.unknown(),
  'Date Form A Sent to Attorney for Review': z.unknown(),
  'Form A Served': z.unknown(),
  'Active Stage': z.unknown(),
  'PI Status': z.unknown(),
  'Matter Name': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  defendant: typeof raw['Defendant'] === 'string' ? raw['Defendant'] : '',
  answerFiled: typeof raw['Answer Filed'] === 'string' ? raw['Answer Filed'] : '',
  daysSinceAnswer: (() => {
    const v = raw['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  })(),
  formASentToReview: sfDate.parse(raw['Date Form A Sent to Attorney for Review']),
  formAServed: typeof raw['Form A Served'] === 'string' ? raw['Form A Served'] : '',
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type FormARow = z.infer<typeof FormARowSchema>;
