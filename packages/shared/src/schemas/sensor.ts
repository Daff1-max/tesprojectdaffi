import { z } from 'zod'

export const SensorStatusSchema = z.enum(['normal', 'warning', 'critical'])
export type SensorStatus = z.infer<typeof SensorStatusSchema>

export const SensorReadingSchema = z.object({
  timestamp: z.string().datetime(),
  waterLevelCm: z.number().nonnegative(),
  flowRateLitersPerSecond: z.number().nonnegative(),
  blockagePercent: z.number().min(0).max(100),
  status: SensorStatusSchema,
})

export const DrainageSensorSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  lat: z.number(),
  lng: z.number(),
  label: z.string(),
  currentStatus: SensorStatusSchema,
  lastReading: SensorReadingSchema.nullable(),
})

export const SensorMetaSchema = DrainageSensorSchema

export type SensorReading = z.infer<typeof SensorReadingSchema>
export type DrainageSensor = z.infer<typeof DrainageSensorSchema>
export type SensorMeta = z.infer<typeof SensorMetaSchema>

export const SensorsResponseSchema = z.object({
  sensors: DrainageSensorSchema.array(),
})

export const ReadingsResponseSchema = z.object({
  readings: SensorReadingSchema.array(),
  sensor: SensorMetaSchema,
})

export type SensorsResponse = z.infer<typeof SensorsResponseSchema>
export type ReadingsResponse = z.infer<typeof ReadingsResponseSchema>
