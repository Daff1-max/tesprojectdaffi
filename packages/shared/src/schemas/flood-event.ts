import { z } from 'zod'

export const FloodEventSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  durationHours: z.number().positive(),
  maxDepthCm: z.number().positive(),
  avgDepthCm: z.number().positive(),
  affectedZoneIds: z.string().array(),
  rainfallMmPerDay: z.number().nonnegative(),
  estimatedLossMillionRupiah: z.number().nonnegative(),
  evacuees: z.number().int().nonnegative(),
  cause: z.string(),
  notes: z.string().optional(),
})

export type FloodEvent = z.infer<typeof FloodEventSchema>

export const FloodEventsResponseSchema = z.object({
  events: FloodEventSchema.array(),
  total: z.number(),
})

export type FloodEventsResponse = z.infer<typeof FloodEventsResponseSchema>
