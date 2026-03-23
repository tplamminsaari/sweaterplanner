import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { SweaterSize, SweaterGeometry } from '../types'
import { computeGeometry } from '../utils/sweater-geometry'
import { usePatternStore } from './pattern-store'

// Default gauge: Léttlopi on 4.5mm needles
const DEFAULT_GAUGE = { stitchesPer10cm: 18, rowsPer10cm: 24 }

function getPatterns() {
  const s = usePatternStore.getState()
  return { shirtTail: s.shirtTail, sleeveOpening: s.sleeveOpening, yoke: s.yoke }
}

interface SweaterState {
  size: SweaterSize
  geometry: SweaterGeometry
}

interface SweaterActions {
  setSize(size: SweaterSize): void
  recomputeGeometry(): void
}

const DEFAULT_SIZE: SweaterSize = 'M'

export const useSweaterStore = create<SweaterState & SweaterActions>()(
  persist(
    immer((set) => ({
      size: DEFAULT_SIZE,
      geometry: computeGeometry(DEFAULT_SIZE, getPatterns(), DEFAULT_GAUGE),

      setSize(size) {
        set((state) => {
          state.size = size
          state.geometry = computeGeometry(size, getPatterns(), DEFAULT_GAUGE)
        })
      },

      recomputeGeometry() {
        set((state) => {
          state.geometry = computeGeometry(state.size, getPatterns(), DEFAULT_GAUGE)
        })
      },
    })),
    {
      name: 'sweater-store',
      // geometry is derived — only persist size
      partialize: (state) => ({ size: state.size }),
    },
  ),
)
