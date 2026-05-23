import { Link, useLocation } from 'react-router-dom'
import { Activity, Map, FileBarChart, Info, Menu, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useUIStore } from '../../stores/useUIStore'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../constants/flood'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const NAV = [
  { to: '/',       label: 'Dashboard', icon: Map },
  { to: '/report', label: 'Laporan',   icon: FileBarChart },
  { to: '/about',  label: 'Tentang',   icon: Info },
]

export function Header() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const alerts = useUIStore((s) => s.alerts)

  const { data: stats } = useQuery({
    queryKey: ['stats-summary'],
    queryFn: api.stats.summary,
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
  })

  const criticalCount = stats?.criticalSensors ?? 0

  return (
    <header className="flex items-center h-14 px-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] shrink-0 z-20 gap-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className="flex items-center gap-2 mr-auto">
        <Activity size={18} className="text-[var(--accent-primary)]" />
        <span className="font-bold text-sm text-[var(--text-primary)] hidden sm:block">
          JGC Flood Vulnerability
        </span>
        <span className="text-[var(--text-muted)] text-xs hidden md:block">— Jakarta Garden City</span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              location.pathname === to
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Icon size={14} />
            <span className="hidden md:block">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 pl-3 border-l border-[var(--bg-border)]">
        {criticalCount > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/15 border border-red-500/30 rounded text-red-400 text-xs font-medium animate-pulse">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            {criticalCount} kritis
          </span>
        )}
        {alerts.length > 0 && (
          <span className="w-2 h-2 bg-[var(--risk-critical)] rounded-full animate-pulse" />
        )}
        {stats && (
          <p className="text-[var(--text-muted)] text-xs hidden lg:block">
            Update: {format(new Date(stats.lastUpdated), 'HH:mm', { locale: idLocale })}
          </p>
        )}
      </div>
    </header>
  )
}
