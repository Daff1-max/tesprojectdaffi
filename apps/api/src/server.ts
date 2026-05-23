import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { loadData } from './lib/seed'
import { rateLimit } from './middleware/rateLimit'
import { zonesRoute } from './routes/zones'
import { sensorsRoute } from './routes/sensors'
import { floodEventsRoute } from './routes/flood-events'
import { statsRoute } from './routes/stats'

loadData()

const app = new Hono().basePath('/api')

app.use('*', logger())
app.use('*', cors({ origin: '*' }))
app.use('*', rateLimit)

app.route('/zones', zonesRoute)
app.route('/sensors', sensorsRoute)
app.route('/flood-events', floodEventsRoute)
app.route('/stats', statsRoute)
app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3001)
console.error(`[api] Dev server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
