/**
 * Dashboard component normalization — thin wrapper for type safety.
 * Dashboard data flows through sfHelpers.ts functions which already handle
 * the DashboardResponse shape. This schema validates the component shape.
 */
import { z } from 'zod';

export const DashboardValueSchema = z.object({
  label: z.string(),
  value: z.number().nullable(),
});

export const DashboardRowSchema = z.object({
  label: z.string(),
  values: z.array(DashboardValueSchema),
});

export const DashboardComponentSchema = z.object({
  title: z.string(),
  chartType: z.string(),
  columns: z.array(z.string()),
  rows: z.array(DashboardRowSchema),
  sourceReportId: z.string().optional(),
});

export const DashboardResponseSchema = z.object({
  dashboardId: z.string(),
  dashboardName: z.string(),
  components: z.array(DashboardComponentSchema),
});

export type DashboardComponentParsed = z.infer<typeof DashboardComponentSchema>;
