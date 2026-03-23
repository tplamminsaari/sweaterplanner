import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { PatternArea, PatternGrid, DrawingTool } from '../types'

function makeGrid(area: PatternArea, cols: number, rows: number): PatternGrid {
  return {
    area,
    cols,
    rows,
    cells: Array.from({ length: rows }, () => Array(cols).fill(0)),
  }
}

interface PatternState {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
  activeArea: PatternArea
  activeDrawingTool: DrawingTool
}

interface PatternActions {
  setActiveArea(area: PatternArea): void
  setDrawingTool(tool: DrawingTool): void
  setCellColor(area: PatternArea, row: number, col: number, slotIndex: number): void
  resizeGrid(area: PatternArea, rows: number, cols: number): void
  fillPattern(area: PatternArea, slotIndex: number): void
}

export const usePatternStore = create<PatternState & PatternActions>()(
  persist(
    immer((set) => ({
      shirtTail: makeGrid('shirtTail', 8, 13),
      sleeveOpening: makeGrid('sleeveOpening', 8, 13),
      yoke: makeGrid('yoke', 12, 56),
      activeArea: 'shirtTail' as PatternArea,
      activeDrawingTool: 'freehand' as DrawingTool,

      setActiveArea(area) {
        set((state) => {
          state.activeArea = area
        })
      },

      setDrawingTool(tool) {
        set((state) => {
          state.activeDrawingTool = tool
        })
      },

      setCellColor(area, row, col, slotIndex) {
        set((state) => {
          state[area].cells[row][col] = slotIndex
        })
      },

      resizeGrid(area, rows, cols) {
        set((state) => {
          const old = state[area]
          const newCells = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) =>
              r < old.rows && c < old.cols ? old.cells[r][c] : 0,
            ),
          )
          state[area].rows = rows
          state[area].cols = cols
          state[area].cells = newCells
        })
      },

      fillPattern(area, slotIndex) {
        set((state) => {
          const grid = state[area]
          for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
              grid.cells[r][c] = slotIndex
            }
          }
        })
      },
    })),
    { name: 'pattern-store' },
  ),
)
