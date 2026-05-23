import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import { AppLayout } from '../components/layout/AppLayout'
import { LoadingScreen } from '../components/ui/LoadingScreen'

const Dashboard  = lazy(() => import('../pages/Dashboard/Dashboard'))
const ZoneDetail = lazy(() => import('../pages/ZoneDetail/ZoneDetail'))
const Report     = lazy(() => import('../pages/Report/Report'))
const About      = lazy(() => import('../pages/About/About'))

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/zones/:id" element={<ZoneDetail />} />
              <Route path="/report"    element={<Report />} />
              <Route path="/about"     element={<About />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
