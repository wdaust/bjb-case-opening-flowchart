import { z } from 'zod';
import { sfDate } from './fields';

export const DepositionRowSchema = z.object({
  'Display Name': z.unknown(),
  'Defendant': z.unknown(),
  'Complaint Filed Date': z.unknown(),
  'Answer Filed': z.unknown(),
  'Time from Filed Date': z.unknown(),
  'Time from Filed': z.unknown(),
  'Client Deposition': z.unknown(),
  'Client Depo Date': z.unknown(),
  'Active Stage': z.unknown(),
  'PI Status': z.unknown(),
  'Matter Name': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  defendant: typeof raw['Defendant'] === 'string' ? raw['Defendant'] : '',
  complaintFiledDate: sfDate.parse(raw['Complaint Filed Date']),
  answerFiled: typeof raw['Answer Filed'] === 'string' ? raw['Answer Filed'] : '',
  daysFromFiled: (() => {
    const v = raw['Time from Filed Date'] ?? raw['Time from Filed'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  })(),
  clientDeposition: (() => {
    const cd = raw['Client Deposition'] ?? raw['Client Depo Date'];
    return typeof cd === 'string' && cd !== '-' && cd !== '' ? cd : '';
  })(),
  hasClientDeposition: (() => {
    const cd = raw['Client Deposition'] ?? raw['Client Depo Date'];
    return cd != null && cd !== '' && cd !== '-';
  })(),
  activeStage: typeof raw['Active Stage'] === 'string' ? raw['Active Stage'] : '',
  piStatus: typeof raw['PI Status'] === 'string' ? raw['PI Status'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type DepositionRow = z.infer<typeof DepositionRowSchema>;
