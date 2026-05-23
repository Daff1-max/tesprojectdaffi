import { Hono } from 'hono'
import { zones, floodEvents } from '../lib/seed'

export const zonesRoute = new Hono()

zonesRoute.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  const riskLevel = c.req.query('riskLevel')
  const limit     = Math.min(Number(c.req.query('limit') ?? 50), 100)
  const offset    = Number(c.req.query('offset') ?? 0)

  let filtered = zones
  if (riskLevel) {
    filtered = zones.filter(z => z.riskLevel === riskLevel)
  }

  const paginated = filtered.slice(offset, offset + limit)

  return c.json({
    zones: paginated,
    total: filtered.length,
    pagination: { limit, offset, hasMore: offset + limit < filtered.length },
  })
})

zonesRoute.get('/:id', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  const id   = c.req.param('id')
  const zone = zones.find(z => z.id === id)
  if (!zone) return c.json({ error: 'Zone not found' }, 404)

  const recentEvents = floodEvents
    .filter(e => e.affectedZoneIds.includes(id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return c.json({ zone, recentEvents })
})
