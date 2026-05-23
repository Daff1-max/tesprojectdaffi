import { Suspense, lazy } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { RiskPanel } from '../../features/risk-panel/RiskPanel'
import { SensorBottomPanel } from '../../features/sensor-feed/SensorBottomPanel'
import { ErrorFallback } from '../../components/ui/ErrorFallback'
import { LoadingScreen } from '../../components/ui/LoadingScreen'

const FloodMap = lazy(() => import('../../features/flood-map/FloodMap').then(m => ({ default: m.FloodMap })))

export default function Dashboard() {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <div className="flex h-full overflow-hidden">
      <ErrorBoundary onReset={reset} fallback={<ErrorFallback message="Gagal memuat panel risiko." />}>
        <RiskPanel />
      </ErrorBoundary>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <ErrorBoundary onReset={reset} fallback={<ErrorFallback message="Gagal memuat peta. Pastikan koneksi internet aktif." />}>
            <Suspense fallback={<LoadingScreen />}>
              <FloodMap />
            </Suspense>
          </ErrorBoundary>
        </div>

        <ErrorBoundary onReset={reset} fallback={<ErrorFallback message="Gagal memuat panel sensor." />}>
          <SensorBottomPanel />
        </ErrorBoundary>
      </div>
    </div>
  )
}
