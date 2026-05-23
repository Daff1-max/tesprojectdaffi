import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { rateLimit } from '../apps/api/src/middleware/rateLimit'
import { zonesRoute } from '../apps/api/src/routes/zones'
import { sensorsRoute } from '../apps/api/src/routes/sensors'
import { floodEventsRoute } from '../apps/api/src/routes/flood-events'
import { statsRoute } from '../apps/api/src/routes/stats'
import { loadData } from '../apps/api/src/lib/seed'

loadData()

const app = new Hono().basePath('/api')

app.use('*', logger())
app.use('*', cors({ origin: process.env.FRONTEND_URL ?? '*' }))
app.use('*', rateLimit)

app.route('/zones', zonesRoute)
app.route('/sensors', sensorsRoute)
app.route('/flood-events', floodEventsRoute)
app.route('/stats', statsRoute)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default handle(app)
