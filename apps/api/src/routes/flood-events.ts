import { Hono } from 'hono'
import { floodEvents } from '../lib/seed'

export const floodEventsRoute = new Hono()

floodEventsRoute.get('/', (c) => {
  c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  const year   = c.req.query('year')
  const zoneId = c.req.query('zoneId')

  let result = floodEvents

  if (year) {
    result = result.filter(e => new Date(e.date).getFullYear() === Number(year))
  }
  if (zoneId) {
    result = result.filter(e => e.affectedZoneIds.includes(zoneId))
  }

  result = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return c.json({ events: result, total: result.length })
})
