import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  FloodZoneSchema,
  DrainageSensorSchema,
  FloodEventSchema,
  type FloodZone,
  type FloodEvent,
} from '@flood-jgc/shared'
import { z } from 'zod'

const CANDIDATES = [
  join(__dirname, '../data'),
  join(process.cwd(), 'apps/api/src/data'),
]
const DATA = CANDIDATES.find(existsSync) ?? CANDIDATES[0]

function load<T>(file: string, schema: z.ZodType<T>): T {
  const raw = JSON.parse(readFileSync(join(DATA, file), 'utf-8'))
  return schema.parse(raw)
}

const SensorWithReadingsSchema = DrainageSensorSchema.extend({
  readings: z.array(
    z.object({
      timestamp: z.string().datetime(),
      waterLevelCm: z.number().nonnegative(),
      flowRateLitersPerSecond: z.number().nonnegative(),
      blockagePercent: z.number().min(0).max(100),
      status: z.enum(['normal', 'warning', 'critical']),
    }),
  ),
})

export type SensorWithReadings = z.infer<typeof SensorWithReadingsSchema>

export let zones: FloodZone[] = []
export let sensors: SensorWithReadings[] = []
export let floodEvents: FloodEvent[] = []

export function loadData() {
  zones = load('zones.json', FloodZoneSchema.array())
  sensors = load('sensors.json', SensorWithReadingsSchema.array())
  floodEvents = load('flood-events.json', FloodEventSchema.array())
  console.error(`[seed] Loaded ${zones.length} zones, ${sensors.length} sensors, ${floodEvents.length} events`)
}
