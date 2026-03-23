import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Brand, YarnType, YarnColor, YarnSlot } from '../types'

interface YarnCatalog {
  brands: Brand[]
  types: YarnType[]
  colors: YarnColor[]
}

interface YarnState {
  catalog: YarnCatalog
  slots: [YarnSlot, YarnSlot, YarnSlot, YarnSlot, YarnSlot]
  activeSlotIndex: number
}

interface YarnActions {
  loadCatalog(catalog: YarnCatalog): void
  setActiveSlotIndex(index: number): void
  assignColorToSlot(slotIndex: number, colorId: string): void
  clearSlot(slotIndex: number): void
}

const initialSlots: [YarnSlot, YarnSlot, YarnSlot, YarnSlot, YarnSlot] = [
  { slotIndex: 0, yarnColorId: null },
  { slotIndex: 1, yarnColorId: null },
  { slotIndex: 2, yarnColorId: null },
  { slotIndex: 3, yarnColorId: null },
  { slotIndex: 4, yarnColorId: null },
]

export const useYarnStore = create<YarnState & YarnActions>()(
  persist(
    immer((set) => ({
      catalog: { brands: [], types: [], colors: [] },
      slots: initialSlots,
      activeSlotIndex: 0,

      loadCatalog(catalog) {
        set((state) => {
          state.catalog = catalog
        })
      },

      setActiveSlotIndex(index) {
        set((state) => {
          state.activeSlotIndex = index
        })
      },

      assignColorToSlot(slotIndex, colorId) {
        set((state) => {
          state.slots[slotIndex].yarnColorId = colorId
        })
      },

      clearSlot(slotIndex) {
        set((state) => {
          state.slots[slotIndex].yarnColorId = null
        })
      },
    })),
    {
      name: 'yarn-store',
      // Don't persist the catalog — it's always loaded from hardcoded data
      partialize: (state) => ({
        slots: state.slots,
        activeSlotIndex: state.activeSlotIndex,
      }),
    },
  ),
)
