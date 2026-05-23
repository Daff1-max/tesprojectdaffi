import { create } from 'zustand'
import type { RiskLevel } from '@flood-jgc/shared'

interface MapState {
  selectedZoneId: string | null
  hoveredZoneId: string | null
  activeFilters: Set<RiskLevel>
  showSensors: boolean
  showDrainageNetwork: boolean
  showHistoricalFlood: boolean
  setSelectedZone: (id: string | null) => void
  setHoveredZone: (id: string | null) => void
  toggleFilter: (level: RiskLevel) => void
  setFilter: (levels: RiskLevel[]) => void
  toggleSensors: () => void
  toggleDrainageNetwork: () => void
  toggleHistoricalFlood: () => void
  cleanup: () => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedZoneId: null,
  hoveredZoneId: null,
  activeFilters: new Set(['low', 'medium', 'high', 'critical'] as RiskLevel[]),
  showSensors: true,
  showDrainageNetwork: true,
  showHistoricalFlood: false,

  setSelectedZone: (id) => set({ selectedZoneId: id }),
  setHoveredZone:  (id) => set({ hoveredZoneId: id }),

  toggleFilter: (level) =>
    set((s) => {
      const next = new Set(s.activeFilters)
      next.has(level) ? next.delete(level) : next.add(level)
      return { activeFilters: next }
    }),

  setFilter: (levels) => set({ activeFilters: new Set(levels) }),

  toggleSensors:          () => set((s) => ({ showSensors:          !s.showSensors })),
  toggleDrainageNetwork:  () => set((s) => ({ showDrainageNetwork:  !s.showDrainageNetwork })),
  toggleHistoricalFlood:  () => set((s) => ({ showHistoricalFlood:  !s.showHistoricalFlood })),

  cleanup: () => set({ selectedZoneId: null, hoveredZoneId: null }),
}))
