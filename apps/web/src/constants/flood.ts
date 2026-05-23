import type { RiskLevel } from '@flood-jgc/shared'

export const RISK_THRESHOLDS = {
  LOW:      { min: 0,  max: 25  },
  MEDIUM:   { min: 26, max: 50  },
  HIGH:     { min: 51, max: 75  },
  CRITICAL: { min: 76, max: 100 },
} as const

export const SENSOR_REFETCH_INTERVAL_MS = 10_000
export const MAX_SENSOR_READINGS_STORED = 100

export const JGC_BOUNDS: [number, number, number, number] = [
  106.9350, -6.2200, 106.9600, -6.1950,
]
export const JGC_CENTER: [number, number] = [106.9475, -6.2075]
export const JGC_ZOOM = 13.5

export const RISK_COLORS: Record<RiskLevel, string> = {
  low:      'var(--risk-low)',
  medium:   'var(--risk-medium)',
  high:     'var(--risk-high)',
  critical: 'var(--risk-critical)',
}

export const RISK_FILL_COLORS: Record<RiskLevel, string> = {
  low:      '#22c55e',
  medium:   '#eab308',
  high:     '#f97316',
  critical: '#ef4444',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low:      'Rendah',
  medium:   'Sedang',
  high:     'Tinggi',
  critical: 'Kritis',
}

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
