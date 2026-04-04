import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { PatternArea, PatternGrid, DrawingTool, DecreaseEntry } from '../types'

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
  yokeDecreaseSchedule: DecreaseEntry[]
  yokeColorBackup: Record<string, number>
  yokeEditMode: 'pattern' | 'decreases'
}

interface PatternActions {
  setActiveArea(area: PatternArea): void
  setDrawingTool(tool: DrawingTool): void
  setCellColor(area: PatternArea, row: number, col: number, slotIndex: number): void
  resizeGrid(area: PatternArea, rows: number, cols: number): void
  fillPattern(area: PatternArea, slotIndex: number): void
  loadGrids(grids: {
    shirtTail: PatternGrid
    sleeveOpening: PatternGrid
    yoke: PatternGrid
    yokeDecreaseSchedule?: DecreaseEntry[]
    yokeColorBackup?: Record<string, number>
  }): void
  undo(): void
  pushUndoSnapshot(): void
  setIsDrawing(val: boolean): void
  setYokeEditMode(mode: 'pattern' | 'decreases'): void
  addDecrease(col: number, fromRow: number): void
  removeDecrease(col: number): void
  clearAllDecreases(): void
  resetPatterns(): void
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
      yokeDecreaseSchedule: [],
      yokeColorBackup: {},
      yokeEditMode: 'pattern' as const,

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
          state.shirtTail            = grids.shirtTail
          state.sleeveOpening        = grids.sleeveOpening
          state.yoke                 = grids.yoke
          state.yokeDecreaseSchedule = grids.yokeDecreaseSchedule ?? []
          state.yokeColorBackup      = grids.yokeColorBackup ?? {}
          state._undoStack           = []
        })
      },

      setIsDrawing(val) {
        set((state) => { state.isDrawing = val })
      },

      setYokeEditMode(mode) {
        set((state) => { state.yokeEditMode = mode })
      },

      addDecrease(col, fromRow) {
        const { yokeDecreaseSchedule } = get()
        // Adjacency constraint: adjacent columns cannot share the same fromRow
        const conflict = yokeDecreaseSchedule.some(
          (e) => Math.abs(e.col - col) === 1 && e.fromRow === fromRow,
        )
        if (conflict) {
          console.warn(`addDecrease: column ${col} at row ${fromRow} conflicts with an adjacent decrease`)
          return
        }
        set((state) => {
          // Save displaced cell colors to backup and clear from grid
          for (let row = fromRow; row <= state.yoke.rows; row++) {
            const val = state.yoke.cells[row - 1]?.[col - 1] ?? 0
            if (val !== 0) {
              state.yokeColorBackup[`${row},${col}`] = val
              state.yoke.cells[row - 1][col - 1] = 0
            }
          }
          state.yokeDecreaseSchedule.push({ col, fromRow })
        })
      },

      removeDecrease(col) {
        set((state) => {
          state.yokeDecreaseSchedule = state.yokeDecreaseSchedule.filter((e) => e.col !== col)
          // Restore backed-up colors for this column
          for (const key of Object.keys(state.yokeColorBackup)) {
            const [rowStr, colStr] = key.split(',')
            if (Number(colStr) === col) {
              const row = Number(rowStr)
              state.yoke.cells[row - 1][col - 1] = state.yokeColorBackup[key]
              delete state.yokeColorBackup[key]
            }
          }
        })
      },

      resetPatterns() {
        set((state) => {
          state.shirtTail            = makeGrid('shirtTail', 8, 13)
          state.sleeveOpening        = makeGrid('sleeveOpening', 8, 13)
          state.yoke                 = makeGrid('yoke', 12, 56)
          state.yokeDecreaseSchedule = []
          state.yokeColorBackup      = {}
          state._undoStack           = []
        })
      },

      clearAllDecreases() {
        set((state) => {
          // Restore all backed-up colors
          for (const key of Object.keys(state.yokeColorBackup)) {
            const [rowStr, colStr] = key.split(',')
            const row = Number(rowStr)
            const col = Number(colStr)
            state.yoke.cells[row - 1][col - 1] = state.yokeColorBackup[key]
          }
          state.yokeColorBackup      = {}
          state.yokeDecreaseSchedule = []
        })
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
        shirtTail:              state.shirtTail,
        sleeveOpening:          state.sleeveOpening,
        yoke:                   state.yoke,
        activeArea:             state.activeArea,
        activeDrawingTool:      state.activeDrawingTool,
        yokeDecreaseSchedule:   state.yokeDecreaseSchedule,
        yokeColorBackup:        state.yokeColorBackup,
        // _undoStack, isDrawing, yokeEditMode intentionally excluded from persistence
      }),
    },
  ),
)
