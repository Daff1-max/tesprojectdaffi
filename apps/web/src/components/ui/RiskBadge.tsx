import type { RiskLevel } from '@flood-jgc/shared'
import { RISK_LABELS } from '../../constants/flood'

const STYLES: Record<RiskLevel, string> = {
  low:      'bg-green-500/15 text-green-400 border border-green-500/30',
  medium:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  high:     'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse',
}

interface Props {
  level: RiskLevel
  className?: string
}

export function RiskBadge({ level, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide uppercase ${STYLES[level]} ${className}`}
    >
      {RISK_LABELS[level]}
    </span>
  )
}
