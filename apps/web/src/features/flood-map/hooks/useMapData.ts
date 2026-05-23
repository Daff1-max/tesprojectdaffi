import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../../constants/flood'

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => api.zones.list({ limit: 100 }),
    staleTime: 5 * 60_000,
  })
}

export function useSensors() {
  return useQuery({
    queryKey: ['sensors'],
    queryFn: () => api.sensors.list(),
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })
}

export function useStatsSummary() {
  return useQuery({
    queryKey: ['stats-summary'],
    queryFn: api.stats.summary,
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })
}
