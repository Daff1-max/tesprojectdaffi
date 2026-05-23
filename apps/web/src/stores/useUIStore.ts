import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  bottomPanelOpen: boolean
  selectedSensorId: string | null
  alerts: Alert[]
  setSidebarOpen: (v: boolean) => void
  setBottomPanelOpen: (v: boolean) => void
  setSelectedSensor: (id: string | null) => void
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void
  dismissAlert: (id: string) => void
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  createdAt: number
}

let alertSeq = 0

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  bottomPanelOpen: false,
  selectedSensorId: null,
  alerts: [],

  setSidebarOpen:     (v) => set({ sidebarOpen: v }),
  setBottomPanelOpen: (v) => set({ bottomPanelOpen: v }),
  setSelectedSensor:  (id) => set({ selectedSensorId: id }),

  addAlert: (alert) =>
    set((s) => ({
      alerts: [
        ...s.alerts,
        { ...alert, id: `alert-${++alertSeq}`, createdAt: Date.now() },
      ].slice(-5),
    })),

  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
}))
