import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/vercel'
import { loadData } from './lib/seed'
import { rateLimit } from './middleware/rateLimit'
import { zonesRoute } from './routes/zones'
import { sensorsRoute } from './routes/sensors'
import { floodEventsRoute } from './routes/flood-events'
import { statsRoute } from './routes/stats'

export const config = { runtime: 'nodejs' }

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
