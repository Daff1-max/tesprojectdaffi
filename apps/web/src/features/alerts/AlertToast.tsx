import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { SENSOR_REFETCH_INTERVAL_MS } from '../../constants/flood'

export function AlertToast() {
  const { alerts, dismissAlert, addAlert } = useUIStore()

  const { data: sensors } = useQuery({
    queryKey: ['sensors-status'],
    queryFn: () => api.sensors.list(),
    refetchInterval: SENSOR_REFETCH_INTERVAL_MS,
    staleTime: SENSOR_REFETCH_INTERVAL_MS,
  })

  useEffect(() => {
    if (!sensors) return
    const critical = sensors.sensors.filter((s) => s.currentStatus === 'critical')
    if (critical.length > 0 && alerts.length === 0) {
      addAlert({
        type: 'critical',
        title: `${critical.length} Sensor Kritis`,
        message: critical.slice(0, 2).map((s) => s.label).join(', ') + (critical.length > 2 ? ` +${critical.length - 2} lainnya` : ''),
      })
    }
  }, [sensors])

  return (
    <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2 w-80">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg ${
              alert.type === 'critical'
                ? 'bg-red-950/80 border-red-500/40 backdrop-blur'
                : alert.type === 'warning'
                ? 'bg-orange-950/80 border-orange-500/40 backdrop-blur'
                : 'bg-[var(--bg-elevated)] border-[var(--bg-border)] backdrop-blur'
            }`}
          >
            {alert.type === 'critical' || alert.type === 'warning' ? (
              <AlertTriangle size={16} className={alert.type === 'critical' ? 'text-red-400 shrink-0 mt-0.5' : 'text-orange-400 shrink-0 mt-0.5'} />
            ) : (
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{alert.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{alert.message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
