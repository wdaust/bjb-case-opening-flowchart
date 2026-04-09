import { z } from 'zod';
import { sfDate } from './fields';

export const FormCRowSchema = z.object({
  'Display Name': z.unknown(),
  'Defendant': z.unknown(),
  'Answer Date to Today': z.unknown(),
  'Form C Received': z.unknown(),
  '10 Day Letter Sent': z.unknown(),
  'Date Motion Filed': z.unknown(),
  'Active Stage': z.unknown(),
  'PI Status': z.unknown(),
  'Matter Name': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  defendant: typeof raw['Defendant'] === 'string' ? raw['Defendant'] : '',
  daysSinceAnswer: (() => {
    const v = raw['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  })(),
  formCReceived: typeof raw['Form C Received'] === 'string' ? raw['Form C Received'] : '',
  tenDayLetterSent: typeof raw['10 Day Letter Sent'] === 'string' ? raw['10 Day Letter Sent'] : '',
  dateMotionFiled: sfDate.parse(raw['Date Motion Filed']),
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type FormCRow = z.infer<typeof FormCRowSchema>;
