import type { MiddlewareHandler } from 'hono'

const RATE_LIMIT = 60
const WINDOW_MS = 60_000
const store = new Map<string, { count: number; resetAt: number }>()

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    await next()
    return
  }

  entry.count++
  if (entry.count > RATE_LIMIT) {
    return c.json({ error: 'Too many requests' }, 429)
  }

  await next()
}
