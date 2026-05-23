import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { MetricCard } from '../../components/ui/MetricCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { FileBarChart, Droplets, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { FloodEvent, RiskLevel } from '@flood-jgc/shared'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { RISK_FILL_COLORS, RISK_LABELS } from '../../constants/flood'

export default function Report() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['stats-summary'], queryFn: api.stats.summary, staleTime: 60_000 })
  const { data: zonesData, isLoading: zonesLoading } = useQuery({ queryKey: ['zones'], queryFn: () => api.zones.list({ limit: 100 }), staleTime: 5 * 60_000 })
  const { data: eventsData, isLoading: eventsLoading } = useQuery({ queryKey: ['flood-events'], queryFn: () => api.floodEvents.list(), staleTime: 5 * 60_000 })

  const zones  = zonesData?.zones  ?? []
  const events = eventsData?.events ?? []

  const byYear = events.reduce<Record<number, number>>((acc, e) => {
    const yr = new Date(e.date).getFullYear()
    acc[yr] = (acc[yr] ?? 0) + 1
    return acc
  }, {})
  const yearChartData = Object.entries(byYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, count]) => ({ year, count }))

  const pieData = stats
    ? (['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((level) => ({
        name: RISK_LABELS[level],
        value: stats.riskDistribution[level],
        color: RISK_FILL_COLORS[level],
      }))
    : []

  const topRisk = [...zones].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)

  return (
    <div className="h-full overflow-y-auto pb-12">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-8">
          <FileBarChart className="text-[var(--accent-primary)]" size={22} />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Laporan Risiko Kawasan</h1>
            <p className="text-sm text-[var(--text-muted)]">Jakarta Garden City — Data Simulasi Demonstrasi</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <MetricCard label="Total Zona" value={stats.totalZones} />
            <MetricCard label="Zona Kritis" value={stats.criticalZones} accent={stats.criticalZones > 0 ? 'critical' : 'default'} />
            <MetricCard label="Zona Tinggi" value={stats.highZones} accent={stats.highZones > 0 ? 'warning' : 'default'} />
            <MetricCard label="Total Sensor" value={stats.totalSensors} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Distribusi Risiko Zona">
            {statsLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Frekuensi Banjir per Tahun">
            {eventsLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="count" fill="var(--accent-primary)" radius={[3, 3, 0, 0]} name="Kejadian" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">10 Zona Risiko Tertinggi</h2>
          {zonesLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--bg-border)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider">Zona</th>
                    <th className="text-left px-4 py-2.5 font-medium uppercase tracking-wider">Level</th>
                    <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wider">Skor</th>
                    <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wider">Elevasi</th>
                    <th className="text-right px-4 py-2.5 font-medium uppercase tracking-wider">Frek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)]">
                  {topRisk.map((zone, i) => (
                    <tr key={zone.id} className="bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--text-muted)]">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[var(--text-primary)]">{zone.name}</p>
                        <p className="text-[var(--text-muted)] text-[10px]">{zone.id}</p>
                      </td>
                      <td className="px-4 py-2.5"><RiskBadge level={zone.riskLevel} /></td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: RISK_FILL_COLORS[zone.riskLevel as RiskLevel] }}>{zone.riskScore}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{zone.elevationMeters}m</td>
                      <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{zone.floodFrequencyPerYear}x/th</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} /> Riwayat Kejadian Banjir
          </h2>
          {eventsLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev as FloodEvent} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  )
}

function EventCard({ event }: { event: FloodEvent }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4">
      <div className="flex flex-wrap gap-3 justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-blue-400" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {format(new Date(event.date), 'dd MMMM yyyy', { locale: idLocale })}
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-[var(--text-muted)]">{event.durationHours}h</span>
          <span className="text-blue-400 font-semibold">{event.maxDepthCm}cm maks</span>
          <span className="text-[var(--text-muted)]">{event.evacuees.toLocaleString('id-ID')} evak.</span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{event.cause}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        Curah hujan: {event.rainfallMmPerDay}mm/hari · Dampak: Rp{event.estimatedLossMillionRupiah.toLocaleString('id-ID')} juta ·
        Zona terdampak: {event.affectedZoneIds.length}
      </p>
    </div>
  )
}
