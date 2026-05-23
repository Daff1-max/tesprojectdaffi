import { Hono } from 'hono'
import { zones, sensors } from '../lib/seed'

export const statsRoute = new Hono()

statsRoute.get('/summary', (c) => {
  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10')

  const dist = { low: 0, medium: 0, high: 0, critical: 0 }
  for (const z of zones) dist[z.riskLevel]++

  const criticalSensors = sensors.filter(s => s.currentStatus === 'critical').length
  const warningSensors  = sensors.filter(s => s.currentStatus === 'warning').length

  return c.json({
    totalZones: zones.length,
    criticalZones: dist.critical,
    highZones: dist.high,
    activeSensorAlerts: criticalSensors + warningSensors,
    lastUpdated: new Date().toISOString(),
    riskDistribution: dist,
    totalSensors: sensors.length,
    warningSensors,
    criticalSensors,
  })
})
