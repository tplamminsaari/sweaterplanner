import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { PatternArea, PatternGrid, DrawingTool } from '../types'

const UNDO_LIMIT = 50

function makeGrid(area: PatternArea, cols: number, rows: number): PatternGrid {
  return {
    area,
    cols,
    rows,
    cells: Array.from({ length: rows }, () => Array(cols).fill(0)),
  }
}

type GridSnapshot = {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
}

interface PatternState {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
  activeArea: PatternArea
  activeDrawingTool: DrawingTool
  _undoStack: GridSnapshot[]
  isDrawing: boolean
}

interface PatternActions {
  setActiveArea(area: PatternArea): void
  setDrawingTool(tool: DrawingTool): void
  setCellColor(area: PatternArea, row: number, col: number, slotIndex: number): void
  resizeGrid(area: PatternArea, rows: number, cols: number): void
  fillPattern(area: PatternArea, slotIndex: number): void
  loadGrids(grids: { shirtTail: PatternGrid; sleeveOpening: PatternGrid; yoke: PatternGrid }): void
  undo(): void
  pushUndoSnapshot(): void
  setIsDrawing(val: boolean): void
}

export const usePatternStore = create<PatternState & PatternActions>()(
  persist(
    immer((set, get) => ({
      shirtTail: makeGrid('shirtTail', 8, 13),
      sleeveOpening: makeGrid('sleeveOpening', 8, 13),
      yoke: makeGrid('yoke', 12, 56),
      activeArea: 'shirtTail' as PatternArea,
      activeDrawingTool: 'freehand' as DrawingTool,
      _undoStack: [],
      isDrawing: false,

      pushUndoSnapshot() {
        const { shirtTail, sleeveOpening, yoke, _undoStack } = get()
        const snapshot: GridSnapshot = {
          shirtTail:     { ...shirtTail,     cells: shirtTail.cells.map((r) => [...r]) },
          sleeveOpening: { ...sleeveOpening, cells: sleeveOpening.cells.map((r) => [...r]) },
          yoke:          { ...yoke,          cells: yoke.cells.map((r) => [...r]) },
        }
        const next = [..._undoStack, snapshot]
        if (next.length > UNDO_LIMIT) next.shift()
        set((state) => { state._undoStack = next })
      },

      setActiveArea(area) {
        set((state) => { state.activeArea = area })
      },

      setDrawingTool(tool) {
        set((state) => { state.activeDrawingTool = tool })
      },

      setCellColor(area, row, col, slotIndex) {
        set((state) => {
          state[area].cells[row][col] = slotIndex
        })
      },

      resizeGrid(area, rows, cols) {
        get().pushUndoSnapshot()
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
        get().pushUndoSnapshot()
        set((state) => {
          const grid = state[area]
          for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
              grid.cells[r][c] = slotIndex
            }
          }
        })
      },

      loadGrids(grids) {
        set((state) => {
          state.shirtTail     = grids.shirtTail
          state.sleeveOpening = grids.sleeveOpening
          state.yoke          = grids.yoke
          state._undoStack    = []
        })
      },

      setIsDrawing(val) {
        set((state) => { state.isDrawing = val })
      },

      undo() {
        const { _undoStack } = get()
        if (_undoStack.length === 0) return
        const snapshot = _undoStack[_undoStack.length - 1]
        set((state) => {
          state.shirtTail     = snapshot.shirtTail
          state.sleeveOpening = snapshot.sleeveOpening
          state.yoke          = snapshot.yoke
          state._undoStack    = state._undoStack.slice(0, -1)
        })
      },
    })),
    {
      name: 'pattern-store',
      partialize: (state) => ({
        shirtTail:         state.shirtTail,
        sleeveOpening:     state.sleeveOpening,
        yoke:              state.yoke,
        activeArea:        state.activeArea,
        activeDrawingTool: state.activeDrawingTool,
        // _undoStack and isDrawing intentionally excluded from persistence
      }),
    },
  ),
)
