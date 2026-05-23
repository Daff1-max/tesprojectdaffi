import { z } from 'zod'
import {
  ZonesResponseSchema,
  ZoneDetailResponseSchema,
  SensorsResponseSchema,
  ReadingsResponseSchema,
  FloodEventsResponseSchema,
  StatsSummarySchema,
  type ZonesResponse,
  type ZoneDetailResponse,
  type SensorsResponse,
  type ReadingsResponse,
  type FloodEventsResponse,
  type StatsSummary,
} from '@flood-jgc/shared'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  const json: unknown = await res.json()
  return schema.parse(json)
}

function toQS(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  zones: {
    list: (params?: { riskLevel?: string; limit?: number; offset?: number }): Promise<ZonesResponse> =>
      get(`/zones${toQS(params)}`, ZonesResponseSchema),
    getById: (id: string): Promise<ZoneDetailResponse> =>
      get(`/zones/${id}`, ZoneDetailResponseSchema),
  },
  sensors: {
    list: (params?: { zoneId?: string; status?: string }): Promise<SensorsResponse> =>
      get(`/sensors${toQS(params)}`, SensorsResponseSchema),
    readings: (id: string, limit = 100): Promise<ReadingsResponse> =>
      get(`/sensors/${id}/readings${toQS({ limit })}`, ReadingsResponseSchema),
  },
  floodEvents: {
    list: (params?: { year?: number; zoneId?: string }): Promise<FloodEventsResponse> =>
      get(`/flood-events${toQS(params)}`, FloodEventsResponseSchema),
  },
  stats: {
    summary: (): Promise<StatsSummary> =>
      get('/stats/summary', StatsSummarySchema),
  },
}
