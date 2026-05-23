import type { FloodZone } from '@flood-jgc/shared'
import { RiskBadge } from '../../components/ui/RiskBadge'

interface Props {
  zone: FloodZone
  x: number
  y: number
}

export function ZoneTooltip({ zone, x, y }: Props) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-3 shadow-xl w-52">
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 leading-tight">{zone.name}</p>
        <div className="flex items-center justify-between mb-3">
          <RiskBadge level={zone.riskLevel} />
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: getRiskColor(zone.riskScore) }}>
            {zone.riskScore}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <DataRow label="Elevasi" value={`${zone.elevationMeters}m`} />
          <DataRow label="Drainase" value={`${zone.drainageCapacityPercent}%`} />
          <DataRow label="Frekuensi" value={`${zone.floodFrequencyPerYear}x/th`} />
          <DataRow label="Penduduk" value={zone.populationEstimate.toLocaleString('id-ID')} />
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-secondary)] font-medium">{value}</span>
    </>
  )
}

function getRiskColor(score: number): string {
  if (score <= 25) return 'var(--risk-low)'
  if (score <= 50) return 'var(--risk-medium)'
  if (score <= 75) return 'var(--risk-high)'
  return 'var(--risk-critical)'
}
