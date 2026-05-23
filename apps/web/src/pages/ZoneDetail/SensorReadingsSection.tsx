import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../constants/flood'
import type { DrainageSensor } from '@flood-jgc/shared'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Skeleton } from '../../components/ui/Skeleton'

interface Props {
  zoneId: string
  sensors: DrainageSensor[]
}

export function SensorReadingsSection({ sensors }: Props) {
  const [activeSensorId, setActiveSensorId] = useState<string | null>(sensors[0]?.id ?? null)

  if (sensors.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Pembacaan Sensor</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {sensors.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSensorId(s.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSensorId === s.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              s.currentStatus === 'critical' ? 'bg-red-400' :
              s.currentStatus === 'warning'  ? 'bg-orange-400' : 'bg-green-400'
            }`} />
            {s.label.replace(/^Sensor Drainase \d+ - /, '')}
          </button>
        ))}
      </div>

      {activeSensorId && <SensorChart sensorId={activeSensorId} />}
    </section>
  )
}

function SensorChart({ sensorId }: { sensorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sensor-readings', sensorId],
    queryFn: () => api.sensors.readings(sensorId, 100),
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })

  if (isLoading) return <Skeleton className="h-56" />

  const chartData = (data?.readings ?? []).slice(-96).map((r) => ({
    time: format(new Date(r.timestamp), 'HH:mm dd/MM', { locale: idLocale }),
    waterLevel: r.waterLevelCm,
    blockage: r.blockagePercent,
    flow: r.flowRateLitersPerSecond,
  }))

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        {data?.sensor && (
          <>
            <StatChip label="Level Air" value={`${data.sensor.lastReading?.waterLevelCm.toFixed(1) ?? '—'}cm`} />
            <StatChip label="Aliran" value={`${data.sensor.lastReading?.flowRateLitersPerSecond.toFixed(1) ?? '—'} L/s`} />
            <StatChip label="Blokir" value={`${data.sensor.lastReading?.blockagePercent ?? '—'}%`} />
          </>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mb-2">Level Air (cm) — 8 jam terakhir</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={11} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, fontSize: 10 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Line type="monotone" dataKey="waterLevel" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Air (cm)" />
          <Line type="monotone" dataKey="blockage" stroke="#f97316" strokeWidth={1} dot={false} name="Blokir (%)" strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
