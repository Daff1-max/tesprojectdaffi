import { type ReactNode } from 'react'
import { Header } from './Header'
import { DemoDisclaimer } from './DemoDisclaimer'
import { AlertToast } from '../../features/alerts/AlertToast'

interface Props { children: ReactNode }

export function AppLayout({ children }: Props) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      <Header />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <DemoDisclaimer />
      <AlertToast />
    </div>
  )
}
