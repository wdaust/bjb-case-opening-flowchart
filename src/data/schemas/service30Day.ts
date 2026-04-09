import { z } from 'zod';

export const Service30DayRowSchema = z.object({
  'Display Name': z.unknown(),
  'Matter Name': z.unknown(),
  'Days to Service': z.unknown(),
  '_groupingLabel': z.unknown(),
}).passthrough().transform(raw => ({
  displayName: typeof raw['Display Name'] === 'string' ? raw['Display Name'] : '',
  matterName: typeof raw['Matter Name'] === 'string' ? raw['Matter Name'] : '',
  daysToService: (() => {
    const v = raw['Days to Service'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  })(),
  groupingLabel: typeof raw['_groupingLabel'] === 'string' ? raw['_groupingLabel'] : '',
  _raw: raw,
}));

export type Service30DayRow = z.infer<typeof Service30DayRowSchema>;
