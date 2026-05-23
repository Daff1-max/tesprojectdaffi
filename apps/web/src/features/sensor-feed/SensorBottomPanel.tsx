import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../constants/flood'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Skeleton } from '../../components/ui/Skeleton'

export function SensorBottomPanel() {
  const { bottomPanelOpen, setBottomPanelOpen, selectedSensorId, setSelectedSensor } = useUIStore()

  return (
    <div className="shrink-0 border-t border-[var(--bg-border)] bg-[var(--bg-surface)]">
      <button
        onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {bottomPanelOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        <span className="font-medium">
          {selectedSensorId ? `Sensor: ${selectedSensorId}` : 'Panel Sensor'}
        </span>
        {selectedSensorId && (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedSensor(null) }}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={12} />
          </button>
        )}
      </button>

      <AnimatePresence>
        {bottomPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            {selectedSensorId ? (
              <SensorChart sensorId={selectedSensorId} />
            ) : (
              <SensorGrid />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SensorChart({ sensorId }: { sensorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sensor-readings', sensorId],
    queryFn: () => api.sensors.readings(sensorId, 48),
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })

  if (isLoading) return <Skeleton className="mx-4 mb-4" style={{ height: 160 }} />

  const chartData = (data?.readings ?? []).slice(-48).map((r) => ({
    time: format(new Date(r.timestamp), 'HH:mm', { locale: idLocale }),
    waterLevel: r.waterLevelCm,
    blockage: r.blockagePercent,
  }))

  return (
    <div className="px-4 pb-4">
      <p className="text-[10px] text-[var(--text-muted)] mb-2">Level Air (cm) — 4 jam terakhir</p>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={7} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, fontSize: 10 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Line type="monotone" dataKey="waterLevel" stroke="var(--accent-primary)" strokeWidth={1.5} dot={false} name="Air (cm)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SensorGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['sensors'],
    queryFn: () => api.sensors.list(),
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })

  const { setSelectedSensor, setBottomPanelOpen } = useUIStore()

  if (isLoading) return (
    <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-40 h-24 shrink-0" />)}
    </div>
  )

  const sorted = [...(data?.sensors ?? [])].sort((a, b) => {
    const order = { critical: 0, warning: 1, normal: 2 }
    return order[a.currentStatus] - order[b.currentStatus]
  })

  return (
    <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
      {sorted.map((sensor) => (
        <button
          key={sensor.id}
          onClick={() => { setSelectedSensor(sensor.id); setBottomPanelOpen(true) }}
          className={`shrink-0 w-44 p-3 rounded-lg border text-left transition-colors ${
            sensor.currentStatus === 'critical'
              ? 'bg-red-950/40 border-red-500/40 hover:border-red-500/70'
              : sensor.currentStatus === 'warning'
              ? 'bg-orange-950/40 border-orange-500/40 hover:border-orange-500/70'
              : 'bg-[var(--bg-elevated)] border-[var(--bg-border)] hover:border-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full ${
              sensor.currentStatus === 'critical' ? 'bg-red-400 sensor-pulse' :
              sensor.currentStatus === 'warning'  ? 'bg-orange-400' : 'bg-green-400'
            }`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{
              color: sensor.currentStatus === 'critical' ? '#ef4444' : sensor.currentStatus === 'warning' ? '#f97316' : '#22c55e'
            }}>
              {sensor.currentStatus}
            </span>
          </div>
          <p className="text-xs text-[var(--text-primary)] leading-tight mb-1 line-clamp-2">{sensor.label}</p>
          {sensor.lastReading && (
            <p className="text-[10px] text-[var(--text-muted)]">
              {sensor.lastReading.waterLevelCm.toFixed(1)} cm · {sensor.lastReading.blockagePercent}% blokir
            </p>
          )}
        </button>
      ))}
    </div>
  )
}
