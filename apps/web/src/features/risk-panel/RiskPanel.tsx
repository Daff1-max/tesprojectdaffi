import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/useUIStore'
import { useMapStore } from '../../stores/useMapStore'
import { useZones, useStatsSummary } from '../flood-map/hooks/useMapData'
import { MetricCard } from '../../components/ui/MetricCard'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useNavigate } from 'react-router-dom'
import type { FloodZone, RiskLevel } from '@flood-jgc/shared'
import { RISK_LABELS } from '../../constants/flood'
import { MapPin } from 'lucide-react'

export function RiskPanel() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const { selectedZoneId, setSelectedZone } = useMapStore()
  const { data: zonesData, isLoading: zonesLoading } = useZones()
  const { data: stats, isLoading: statsLoading } = useStatsSummary()
  const navigate = useNavigate()

  const zones = zonesData?.zones ?? []
  const selectedZone = zones.find((z) => z.id === selectedZoneId)

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 shrink-0 h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--bg-border)] overflow-hidden"
        >
          {/* Summary Metrics */}
          <div className="p-4 border-b border-[var(--bg-border)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Ringkasan Kawasan</p>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Zona" value={stats.totalZones} />
                <MetricCard label="Zona Kritis" value={stats.criticalZones} accent={stats.criticalZones > 0 ? 'critical' : 'default'} />
                <MetricCard label="Alert Sensor" value={stats.activeSensorAlerts} accent={stats.activeSensorAlerts > 0 ? 'warning' : 'good'} />
                <MetricCard label="Total Sensor" value={stats.totalSensors} />
              </div>
            ) : null}
          </div>

          {/* Risk Distribution */}
          {stats && (
            <div className="px-4 py-3 border-b border-[var(--bg-border)]">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Distribusi Risiko</p>
              <div className="flex gap-1 h-3 rounded overflow-hidden">
                {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => {
                  const pct = Math.round((stats.riskDistribution[level] / stats.totalZones) * 100)
                  return (
                    <div
                      key={level}
                      title={`${RISK_LABELS[level]}: ${stats.riskDistribution[level]} zona (${pct}%)`}
                      className="transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getRiskHex(level),
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
                  <span key={level} className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: getRiskHex(level) }} />
                    {RISK_LABELS[level]} ({stats.riskDistribution[level]})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selected Zone Detail */}
          <AnimatePresence>
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-[var(--bg-border)] overflow-hidden"
              >
                <SelectedZoneCard zone={selectedZone} onClose={() => setSelectedZone(null)} onNavigate={() => navigate(`/zones/${selectedZone.id}`)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zone List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Daftar Zona</p>
              <span className="text-[10px] text-[var(--text-muted)]">{zones.length} zona</span>
            </div>
            {zonesLoading ? (
              <div className="flex flex-col gap-1 px-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (
              <div className="flex flex-col">
                {zones
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((zone) => (
                    <ZoneListItem
                      key={zone.id}
                      zone={zone}
                      isSelected={zone.id === selectedZoneId}
                      onSelect={() => setSelectedZone(zone.id === selectedZoneId ? null : zone.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function SelectedZoneCard({ zone, onClose, onNavigate }: { zone: FloodZone; onClose: () => void; onNavigate: () => void }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{zone.name}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{zone.id}</p>
        </div>
        <RiskBadge level={zone.riskLevel} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
        <DataLine label="Skor Risiko" value={`${zone.riskScore}/100`} />
        <DataLine label="Elevasi" value={`${zone.elevationMeters}m`} />
        <DataLine label="Drainase" value={`${zone.drainageCapacityPercent}%`} />
        <DataLine label="Frekuensi" value={`${zone.floodFrequencyPerYear}x/th`} />
        <DataLine label="Penduduk" value={zone.populationEstimate.toLocaleString('id-ID')} />
      </div>
      <div className="flex gap-2">
        <button onClick={onNavigate} className="flex-1 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-xs font-medium rounded hover:bg-[var(--accent-muted)] transition-colors">
          Detail Zona
        </button>
        <button onClick={onClose} className="px-3 py-1.5 text-[var(--text-muted)] text-xs border border-[var(--bg-border)] rounded hover:text-[var(--text-primary)] transition-colors">
          Tutup
        </button>
      </div>
    </div>
  )
}

function DataLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-[var(--text-secondary)]">{value}</p>
    </div>
  )
}

function ZoneListItem({ zone, isSelected, onSelect }: { zone: FloodZone; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-2.5 text-left w-full transition-colors ${
        isSelected
          ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-primary)]'
          : 'hover:bg-[var(--bg-elevated)] border-l-2 border-transparent'
      }`}
    >
      <div className="w-8 h-8 shrink-0 rounded flex items-center justify-center" style={{ backgroundColor: `${getRiskHex(zone.riskLevel)}20` }}>
        <MapPin size={12} style={{ color: getRiskHex(zone.riskLevel) }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{zone.name}</p>
        <p className="text-[10px] text-[var(--text-muted)]">Skor: {zone.riskScore}</p>
      </div>
      <RiskBadge level={zone.riskLevel} className="shrink-0" />
    </button>
  )
}

function getRiskHex(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444',
  }
  return map[level]
}
