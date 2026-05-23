import type { FloodZone } from '@flood-jgc/shared'

interface AggResult {
  distribution: Record<string, number>
  avgRiskScore: number
  totalPop: number
}

self.onmessage = (e: MessageEvent<FloodZone[]>) => {
  const zones = e.data
  const dist: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
  let totalScore = 0
  let totalPop = 0

  for (const z of zones) {
    dist[z.riskLevel] = (dist[z.riskLevel] ?? 0) + 1
    totalScore += z.riskScore
    totalPop += z.populationEstimate
  }

  const result: AggResult = {
    distribution: dist,
    avgRiskScore: zones.length > 0 ? Math.round(totalScore / zones.length) : 0,
    totalPop,
  }

  self.postMessage(result)
}
