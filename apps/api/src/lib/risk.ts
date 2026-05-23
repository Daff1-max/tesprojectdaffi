import type { RiskLevel } from '@flood-jgc/shared'

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function normalize(v: number, lo: number, hi: number, invert = false): number {
  const n = clamp((v - lo) / (hi - lo), 0, 1)
  return (invert ? 1 - n : n) * 100
}

export function calculateRiskScore(zone: {
  elevationMeters: number
  drainageCapacityPercent: number
  floodFrequencyPerYear: number
  populationEstimate: number
}): { score: number; level: RiskLevel } {
  const weights = { elevation: 0.30, drainageCapacity: 0.25, floodFrequency: 0.25, populationDensity: 0.20 }

  const elevationScore  = normalize(zone.elevationMeters,          0, 15,   true)
  const drainageScore   = normalize(zone.drainageCapacityPercent,  0, 100,  true)
  const frequencyScore  = normalize(zone.floodFrequencyPerYear,    0, 5)
  const densityScore    = normalize(zone.populationEstimate,       0, 5000)

  const score = Math.round(
    elevationScore  * weights.elevation +
    drainageScore   * weights.drainageCapacity +
    frequencyScore  * weights.floodFrequency +
    densityScore    * weights.populationDensity,
  )

  const level: RiskLevel =
    score <= 25 ? 'low' :
    score <= 50 ? 'medium' :
    score <= 75 ? 'high' : 'critical'

  return { score, level }
}
