import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { z } from 'zod'

// ── Inline schemas (tidak bergantung workspace package) ──────────────────────
const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'])

const FloodZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  riskLevel: RiskLevelSchema,
  riskScore: z.number(),
  elevationMeters: z.number(),
  drainageCapacityPercent: z.number(),
  populationEstimate: z.number(),
  lastFloodDate: z.string().nullable(),
  floodFrequencyPerYear: z.number(),
  area: z.number().optional(),
  geometry: z.object({ type: z.literal('Polygon'), coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))) }),
  description: z.string().optional(),
})

const SensorStatusSchema = z.enum(['normal', 'warning', 'critical'])

const SensorReadingSchema = z.object({
  timestamp: z.string(),
  waterLevelCm: z.number(),
  flowRateLitersPerSecond: z.number(),
  blockagePercent: z.number(),
  status: SensorStatusSchema,
})

const DrainageSensorSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  lat: z.number(),
  lng: z.number(),
  label: z.string(),
  currentStatus: SensorStatusSchema,
  lastReading: SensorReadingSchema.nullable(),
  readings: SensorReadingSchema.array(),
})

const FloodEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  durationHours: z.number(),
  maxDepthCm: z.number(),
  avgDepthCm: z.number(),
  affectedZoneIds: z.string().array(),
  rainfallMmPerDay: z.number(),
  estimatedLossMillionRupiah: z.number(),
  evacuees: z.number(),
  cause: z.string(),
  notes: z.string().optional(),
})

type FloodZone    = z.infer<typeof FloodZoneSchema>
type DrainageSensor = z.infer<typeof DrainageSensorSchema>
type FloodEvent   = z.infer<typeof FloodEventSchema>

// ── Import data JSON langsung (di-bundle saat deploy) ────────────────────────
import zonesRaw   from '../apps/api/src/data/zones.json'
import sensorsRaw from '../apps/api/src/data/sensors.json'
import eventsRaw  from '../apps/api/src/data/flood-events.json'

const zones:   FloodZone[]       = FloodZoneSchema.array().parse(zonesRaw)
const sensors: DrainageSensor[]  = DrainageSensorSchema.array().parse(sensorsRaw)
const events:  FloodEvent[]      = FloodEventSchema.array().parse(eventsRaw)

// ── Rate limiter ─────────────────────────────────────────────────────────────
const RATE_LIMIT = 60
const WINDOW_MS  = 60_000
const store = new Map<string, { count: number; resetAt: number }>()

function isLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) { store.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false }
  entry.count++
  return entry.count > RATE_LIMIT
}

// ── Hono app ─────────────────────────────────────────────────────────────────
const app = new Hono().basePath('/api')

app.use('*', cors({ origin: '*' }))
app.use('*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? 'unknown'
  if (isLimited(ip)) return c.json({ error: 'Too many requests' }, 429)
  await next()
})

// GET /api/zones
app.get('/zones', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const riskLevel = c.req.query('riskLevel')
  const limit     = Math.min(Number(c.req.query('limit') ?? 50), 100)
  const offset    = Number(c.req.query('offset') ?? 0)
  let filtered = riskLevel ? zones.filter(z => z.riskLevel === riskLevel) : zones
  return c.json({ zones: filtered.slice(offset, offset + limit), total: filtered.length, pagination: { limit, offset, hasMore: offset + limit < filtered.length } })
})

// GET /api/zones/:id
app.get('/zones/:id', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const zone = zones.find(z => z.id === c.req.param('id'))
  if (!zone) return c.json({ error: 'Zone not found' }, 404)
  const recentEvents = events.filter(e => e.affectedZoneIds.includes(zone.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  return c.json({ zone, recentEvents })
})

// GET /api/sensors
app.get('/sensors', (c) => {
  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10')
  const zoneId = c.req.query('zoneId')
  const status = c.req.query('status')
  let result = sensors.map(({ readings: _r, ...rest }) => rest)
  if (zoneId) result = result.filter(s => s.zoneId === zoneId)
  if (status) result = result.filter(s => s.currentStatus === status)
  return c.json({ sensors: result })
})

// GET /api/sensors/:id/readings
app.get('/sensors/:id/readings', (c) => {
  c.header('Cache-Control', 'no-store')
  const sensor = sensors.find(s => s.id === c.req.param('id'))
  if (!sensor) return c.json({ error: 'Sensor not found' }, 404)
  const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
  const { readings, ...meta } = sensor
  return c.json({ readings: readings.slice(-limit), sensor: meta })
})

// GET /api/flood-events
app.get('/flood-events', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const year   = c.req.query('year')
  const zoneId = c.req.query('zoneId')
  let result = events
  if (year)   result = result.filter(e => new Date(e.date).getFullYear() === Number(year))
  if (zoneId) result = result.filter(e => e.affectedZoneIds.includes(zoneId))
  result = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return c.json({ events: result, total: result.length })
})

// GET /api/stats/summary
app.get('/stats/summary', (c) => {
  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10')
  const dist = { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>
  for (const z of zones) dist[z.riskLevel]++
  const criticalSensors = sensors.filter(s => s.currentStatus === 'critical').length
  const warningSensors  = sensors.filter(s => s.currentStatus === 'warning').length
  return c.json({ totalZones: zones.length, criticalZones: dist.critical, highZones: dist.high, activeSensorAlerts: criticalSensors + warningSensors, lastUpdated: new Date().toISOString(), riskDistribution: dist, totalSensors: sensors.length, warningSensors, criticalSensors })
})

app.get('/health', (c) => c.json({ status: 'ok', zones: zones.length, sensors: sensors.length }))

export default handle(app)
