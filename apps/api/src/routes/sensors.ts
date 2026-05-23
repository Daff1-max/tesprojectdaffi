import { Hono } from 'hono'
import { sensors } from '../lib/seed'

export const sensorsRoute = new Hono()

sensorsRoute.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10')

  const zoneId = c.req.query('zoneId')
  const status = c.req.query('status')

  let result = sensors.map(({ readings: _r, ...rest }) => rest)

  if (zoneId) result = result.filter(s => s.zoneId === zoneId)
  if (status) result = result.filter(s => s.currentStatus === status)

  return c.json({ sensors: result })
})

sensorsRoute.get('/:id/readings', (c) => {
  c.header('Cache-Control', 'no-store')

  const id     = c.req.param('id')
  const limit  = Math.min(Number(c.req.query('limit') ?? 100), 500)
  const sensor = sensors.find(s => s.id === id)

  if (!sensor) return c.json({ error: 'Sensor not found' }, 404)

  const { readings, ...meta } = sensor
  const sliced = readings.slice(-limit)

  return c.json({ readings: sliced, sensor: meta })
})
