import { z } from 'zod'

export const StatsSummarySchema = z.object({
  totalZones: z.number(),
  criticalZones: z.number(),
  highZones: z.number(),
  activeSensorAlerts: z.number(),
  lastUpdated: z.string().datetime(),
  riskDistribution: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  totalSensors: z.number(),
  warningSensors: z.number(),
  criticalSensors: z.number(),
})

export type StatsSummary = z.infer<typeof StatsSummarySchema>
