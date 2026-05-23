import { type ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  unit?: string
  accent?: 'default' | 'critical' | 'warning' | 'good'
  className?: string
}

const ACCENT_COLOR = {
  default:  'var(--text-primary)',
  critical: 'var(--risk-critical)',
  warning:  'var(--risk-high)',
  good:     'var(--risk-low)',
}

export function MetricCard({ label, value, unit, accent = 'default', className = '' }: Props) {
  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4 ${className}`}>
      <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
      <p
        className="text-4xl font-extrabold tabular-nums leading-none"
        style={{ color: ACCENT_COLOR[accent] }}
      >
        {value}
      </p>
      {unit && <p className="text-[var(--text-secondary)] text-xs mt-1">{unit}</p>}
    </div>
  )
}
