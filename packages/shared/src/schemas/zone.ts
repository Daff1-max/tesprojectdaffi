import { z } from 'zod'

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

export const FloodZoneSchema = z.object({
  id: z.string().regex(/^JGC-Z\d{2}$/),
  name: z.string(),
  riskLevel: RiskLevelSchema,
  riskScore: z.number().min(0).max(100),
  elevationMeters: z.number().positive(),
  drainageCapacityPercent: z.number().min(0).max(100),
  populationEstimate: z.number().int().nonnegative(),
  lastFloodDate: z.string().datetime().nullable(),
  floodFrequencyPerYear: z.number().nonnegative(),
  area: z.number().positive(),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
  description: z.string().optional(),
})

export type FloodZone = z.infer<typeof FloodZoneSchema>

export const ZonesResponseSchema = z.object({
  zones: FloodZoneSchema.array(),
  total: z.number(),
  pagination: z.object({
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
})

export const ZoneDetailResponseSchema = z.object({
  zone: FloodZoneSchema,
  recentEvents: z.array(z.unknown()),
})

export type ZonesResponse = z.infer<typeof ZonesResponseSchema>
export type ZoneDetailResponse = z.infer<typeof ZoneDetailResponseSchema>
