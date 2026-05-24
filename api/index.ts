/**
 * Vercel Serverless Function — JGC Flood Vulnerability API
 * Self-contained: no workspace imports, JSON data bundled statically.
 * Sensor readings generated on-the-fly to keep bundle small.
 */
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

import zonesRaw   from '../apps/api/src/data/zones.json'
import sensorsRaw from '../apps/api/src/data/sensors.json'
import eventsRaw  from '../apps/api/src/data/flood-events.json'

// ── Types ────────────────────────────────────────────────────────────────────
type RiskLevel    = 'low' | 'medium' | 'high' | 'critical'
type SensorStatus = 'normal' | 'warning' | 'critical'

interface SensorMeta {
  id: string; zoneId: string; lat: number; lng: number
  label: string; currentStatus: SensorStatus
  baseWaterLevelCm: number; baseBlockagePercent: number; baseFlowRate: number
  lastReading: SensorReading
}
interface SensorReading {
  timestamp: string; waterLevelCm: number
  flowRateLitersPerSecond: number; blockagePercent: number; status: SensorStatus
}
interface FloodZone {
  id: string; name: string; riskLevel: RiskLevel; riskScore: number
  elevationMeters: number; drainageCapacityPercent: number
  populationEstimate: number; lastFloodDate: string; floodFrequencyPerYear: number
  area: number; geometry: unknown; description?: string
}
interface FloodEvent {
  id: string; date: string; durationHours: number; maxDepthCm: number
  avgDepthCm: number; affectedZoneIds: string[]; rainfallMmPerDay: number
  estimatedLossMillionRupiah: number; evacuees: number; cause: string; notes?: string
}

const zones   = zonesRaw   as FloodZone[]
const sensors = sensorsRaw as SensorMeta[]
const events  = eventsRaw  as FloodEvent[]

// ── On-the-fly reading generator ─────────────────────────────────────────────
function genReadings(sensor: SensorMeta, count = 100): SensorReading[] {
  const readings: SensorReading[] = []
  const now = Date.now()
  for (let i = count - 1; i >= 0; i--) {
    const t   = new Date(now - i * 5 * 60 * 1000)
    const noise = (Math.sin(i * 0.3) + Math.random() - 0.5) * 8
    const wl  = Math.max(0, sensor.baseWaterLevelCm + noise)
    const blk = Math.min(100, Math.max(0, sensor.baseBlockagePercent + (Math.random()-0.5)*8))
    const fl  = Math.max(0, sensor.baseFlowRate + (Math.random()-0.5)*2)
    const st: SensorStatus = wl > 100 ? 'critical' : wl > 50 ? 'warning' : 'normal'
    readings.push({
      timestamp: t.toISOString(),
      waterLevelCm: Math.round(wl * 10) / 10,
      flowRateLitersPerSecond: Math.round(fl * 10) / 10,
      blockagePercent: Math.round(blk),
      status: st,
    })
  }
  return readings
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
const store = new Map<string, { count: number; resetAt: number }>()
function isLimited(ip: string) {
  const now = Date.now(), entry = store.get(ip)
  if (!entry || now > entry.resetAt) { store.set(ip, { count: 1, resetAt: now + 60_000 }); return false }
  return ++entry.count > 60
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono().basePath('/api')

app.use('*', cors({ origin: '*' }))
app.use('*', async (c, next) => {
  if (isLimited(c.req.header('x-forwarded-for') ?? 'unknown'))
    return c.json({ error: 'Too many requests' }, 429)
  await next()
})

// GET /api/zones
app.get('/zones', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const rl     = c.req.query('riskLevel')
  const limit  = Math.min(Number(c.req.query('limit') ?? 50), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const filtered = rl ? zones.filter(z => z.riskLevel === rl) : zones
  return c.json({ zones: filtered.slice(offset, offset + limit), total: filtered.length, pagination: { limit, offset, hasMore: offset + limit < filtered.length } })
})

// GET /api/zones/:id
app.get('/zones/:id', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const zone = zones.find(z => z.id === c.req.param('id'))
  if (!zone) return c.json({ error: 'Zone not found' }, 404)
  const recentEvents = events
    .filter(e => e.affectedZoneIds.includes(zone.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  return c.json({ zone, recentEvents })
})

// GET /api/sensors
app.get('/sensors', (c) => {
  c.header('Cache-Control', 'no-store')
  const zoneId = c.req.query('zoneId')
  const status = c.req.query('status')
  let list = sensors.map(({ baseWaterLevelCm: _a, baseBlockagePercent: _b, baseFlowRate: _c, ...rest }) => rest)
  if (zoneId) list = list.filter(s => s.zoneId === zoneId)
  if (status) list = list.filter(s => s.currentStatus === status)
  return c.json({ sensors: list })
})

// GET /api/sensors/:id/readings
app.get('/sensors/:id/readings', (c) => {
  c.header('Cache-Control', 'no-store')
  const sensor = sensors.find(s => s.id === c.req.param('id'))
  if (!sensor) return c.json({ error: 'Sensor not found' }, 404)
  const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
  const { baseWaterLevelCm: _a, baseBlockagePercent: _b, baseFlowRate: _c, ...meta } = sensor
  return c.json({ readings: genReadings(sensor, limit), sensor: meta })
})

// GET /api/flood-events
app.get('/flood-events', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  const year   = c.req.query('year')
  const zoneId = c.req.query('zoneId')
  let result = events
  if (year)   result = result.filter(e => new Date(e.date).getFullYear() === Number(year))
  if (zoneId) result = result.filter(e => e.affectedZoneIds.includes(zoneId))
  return c.json({ events: result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), total: result.length })
})

// GET /api/stats/summary
app.get('/stats/summary', (c) => {
  c.header('Cache-Control', 'no-store')
  const dist: Record<string, number> = { low:0, medium:0, high:0, critical:0 }
  for (const z of zones) dist[z.riskLevel]++
  const crit = sensors.filter(s => s.currentStatus === 'critical').length
  const warn = sensors.filter(s => s.currentStatus === 'warning').length
  return c.json({ totalZones: zones.length, criticalZones: dist.critical, highZones: dist.high, activeSensorAlerts: crit + warn, lastUpdated: new Date().toISOString(), riskDistribution: dist, totalSensors: sensors.length, warningSensors: warn, criticalSensors: crit })
})

// GET /api/health
app.get('/health', (c) => c.json({ status:'ok', zones: zones.length, sensors: sensors.length }))

export default handle(app)
