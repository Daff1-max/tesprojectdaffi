import { Layers, Radio, GitBranch, History } from 'lucide-react'
import { useMapStore } from '../../stores/useMapStore'
import type { RiskLevel } from '@flood-jgc/shared'
import { RISK_LABELS, RISK_FILL_COLORS } from '../../constants/flood'

const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low']

export function LayerControls() {
  const { activeFilters, toggleFilter, showSensors, toggleSensors, showDrainageNetwork, toggleDrainageNetwork, showHistoricalFlood, toggleHistoricalFlood } = useMapStore()

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 w-48">
      <div className="bg-[var(--bg-surface)]/90 backdrop-blur border border-[var(--bg-border)] rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-1.5 mb-3">
          <Layers size={13} className="text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Layer</span>
        </div>

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--bg-border)] mb-3">
          <LayerToggle icon={<Radio size={12} />} label="Sensor Drainase" active={showSensors} onToggle={toggleSensors} />
          <LayerToggle icon={<GitBranch size={12} />} label="Jaringan Drainase" active={showDrainageNetwork} onToggle={toggleDrainageNetwork} />
          <LayerToggle icon={<History size={12} />} label="Banjir Historis" active={showHistoricalFlood} onToggle={toggleHistoricalFlood} />
        </div>

        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Filter Risiko</p>
          <div className="flex flex-col gap-1">
            {RISK_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => toggleFilter(level)}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-all ${
                  activeFilters.has(level)
                    ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                    : 'text-[var(--text-muted)] opacity-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: RISK_FILL_COLORS[level] }}
                />
                {RISK_LABELS[level]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LayerToggle({ icon, label, active, onToggle }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-all text-left ${
        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-50'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>{icon}</span>
      {label}
      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${active ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-border)]'}`} />
    </button>
  )
}
