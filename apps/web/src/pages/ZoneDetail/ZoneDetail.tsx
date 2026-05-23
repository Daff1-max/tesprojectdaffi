import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { MetricCard } from '../../components/ui/MetricCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorFallback } from '../../components/ui/ErrorFallback'
import { ArrowLeft, Droplets, Activity, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { FloodEvent } from '@flood-jgc/shared'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { SensorReadingsSection } from './SensorReadingsSection'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../constants/flood'

export default function ZoneDetail() {
  const { id } = useParams<{ id: string }>()
  const { reset } = useQueryErrorResetBoundary()

  const { data, isLoading, error } = useQuery({
    queryKey: ['zone', id],
    queryFn: () => api.zones.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })

  const { data: sensors } = useQuery({
    queryKey: ['sensors', id],
    queryFn: () => api.sensors.list({ zoneId: id }),
    enabled: !!id,
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })

  if (isLoading) return <ZoneDetailSkeleton />
  if (error || !data) return <ErrorFallback message="Zona tidak ditemukan." />

  const { zone, recentEvents } = data

  return (
    <div className="h-full overflow-y-auto pb-12">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{zone.name}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{zone.id} · Jakarta Garden City</p>
          </div>
          <RiskBadge level={zone.riskLevel} className="text-sm px-3 py-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Skor Risiko" value={zone.riskScore} unit="/ 100"
            accent={zone.riskScore > 75 ? 'critical' : zone.riskScore > 50 ? 'warning' : 'default'} />
          <MetricCard label="Elevasi" value={zone.elevationMeters} unit="meter dpl" />
          <MetricCard label="Kapasitas Drainase" value={`${zone.drainageCapacityPercent}%`} unit="dari kapasitas penuh"
            accent={zone.drainageCapacityPercent < 50 ? 'warning' : 'good'} />
          <MetricCard label="Penduduk" value={zone.populationEstimate.toLocaleString('id-ID')} unit="estimasi jiwa" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <InfoCard icon={<Activity size={14} />} label="Frekuensi Banjir" value={`${zone.floodFrequencyPerYear}x per tahun`} />
          <InfoCard icon={<Clock size={14} />} label="Terakhir Banjir"
            value={zone.lastFloodDate
              ? format(new Date(zone.lastFloodDate), 'dd MMMM yyyy', { locale: idLocale })
              : 'Tidak tercatat'} />
          <InfoCard icon={<Droplets size={14} />} label="Sensor Aktif" value={`${sensors?.sensors.length ?? 0} unit`} />
        </div>

        {/* Sensor readings */}
        <ErrorBoundary onReset={reset} fallback={<ErrorFallback message="Gagal memuat data sensor." />}>
          <SensorReadingsSection zoneId={id!} sensors={sensors?.sensors ?? []} />
        </ErrorBoundary>

        {/* Flood history */}
        {recentEvents.length > 0 && (
          <section className="mt-8">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Riwayat Banjir</h2>
            <FloodHistoryChart events={recentEvents as FloodEvent[]} />
            <div className="mt-4 flex flex-col gap-2">
              {(recentEvents as FloodEvent[]).map((ev) => (
                <FloodEventRow key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-3 flex items-start gap-3">
      <span className="text-[var(--accent-primary)] mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function FloodEventRow({ event }: { event: FloodEvent }) {
  return (
    <div className="flex gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg text-xs">
      <div className="shrink-0 text-center">
        <p className="font-semibold text-[var(--text-primary)]">{format(new Date(event.date), 'MMM yyyy', { locale: idLocale })}</p>
        <p className="text-[var(--text-muted)]">{event.durationHours}h</p>
      </div>
      <div className="flex-1">
        <p className="text-[var(--text-secondary)] leading-relaxed">{event.cause}</p>
        {event.notes && <p className="text-[var(--text-muted)] mt-0.5 italic">{event.notes}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-blue-400">{event.maxDepthCm}cm</p>
        <p className="text-[var(--text-muted)]">{event.evacuees.toLocaleString('id-ID')} evak.</p>
      </div>
    </div>
  )
}

function FloodHistoryChart({ events }: { events: FloodEvent[] }) {
  const data = events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      date: format(new Date(e.date), 'MMM yy', { locale: idLocale }),
      depth: e.maxDepthCm,
      rainfall: e.rainfallMmPerDay,
    }))

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4">
      <p className="text-xs text-[var(--text-muted)] mb-3">Kedalaman Banjir Maks (cm)</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, fontSize: 10 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Bar dataKey="depth" fill="var(--accent-primary)" radius={[3, 3, 0, 0]} name="Maks (cm)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ZoneDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto pb-12">
      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
