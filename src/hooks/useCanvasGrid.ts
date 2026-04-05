import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { bresenhamLine } from '@/utils/bresenham'
import type { DrawingTool } from '@/types'

const CELL_SIZE = 20
const ROW_NUM_WIDTH = 24          // label width without annotations
const ANNOTATED_ROW_NUM_WIDTH = 48 // label width when row skip annotations are shown
const GRID_LINE_COLOR = 'rgba(255,255,255,0.08)'
const INACTIVE_FILL = 'rgba(0,0,0,0.5)'
const INACTIVE_HATCH_COLOR = 'rgba(255,255,255,0.15)'
const DECREASE_STRIPE_COLOR = 'rgba(124,110,245,0.55)'
const EMPTY_FILL = '#2c2c32'
const PREVIEW_ALPHA = 0.55
const ROW_NUM_COLOR = 'rgba(255,255,255,0.35)'
const ANNOTATION_COLOR = 'rgba(255,255,255,0.22)'

/** Convert a canvas-space Y pixel to a 0-indexed grid row (row 0 = bottom). */
function pixelToGridRow(canvasY: number, rows: number): number {
  const canvasRow = Math.floor(canvasY / CELL_SIZE)
  return rows - 1 - canvasRow
}

function pixelToGridCol(canvasX: number): number {
  return Math.floor(canvasX / CELL_SIZE)
}

interface UseCanvasGridOptions {
  cols: number
  rows: number
  cells: number[][]
  colorMap: Record<number, string>     // slotIndex → hex color (0 = empty)
  inactiveCells?: ReadonlySet<string>  // "row,col" keys (1-indexed); predefined non-paintable
  decreasedCells?: ReadonlySet<string> // "row,col" keys (1-indexed); user-defined decreases
  /**
   * Per-row annotation text shown in the left label area (1-indexed row → text).
   * When provided, the label area widens to ANNOTATED_ROW_NUM_WIDTH.
   */
  rowSkipAnnotations?: ReadonlyMap<number, string>
  activeTool?: DrawingTool
  editMode?: 'pattern' | 'decreases'
  /** Called once at the start of each paint stroke (before any cells are changed). */
  onStrokeStart?: () => void
  /** Called once when a paint stroke ends (pointer up or leave). */
  onStrokeEnd?: () => void
  /** Called when the user paints a cell (freehand/eraser). row/col are 0-indexed. */
  onCellPaint?: (row: number, col: number) => void
  /** Called when the user completes a line stroke. */
  onLinePaint?: (cells: { row: number; col: number }[]) => void
  /** Slot index used for painting (1-indexed). 0 = eraser. */
  paintSlot?: number
  /** Called in decrease mode when the user clicks a cell. row/col are 0-indexed. */
  onDecreaseToggle?: (row: number, col: number) => void
}

export function useCanvasGrid(options: UseCanvasGridOptions): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { cols, rows, cells, colorMap, inactiveCells, decreasedCells, rowSkipAnnotations } = options
  const labelWidth = rowSkipAnnotations && rowSkipAnnotations.size > 0
    ? ANNOTATED_ROW_NUM_WIDTH
    : ROW_NUM_WIDTH

  // Stable refs for callbacks and mutable state
  const optionsRef = useRef(options)
  useEffect(() => { optionsRef.current = options })

  // Draw function stored in a ref so pointer handlers can call it imperatively
  const drawRef = useRef<((preview?: { row: number; col: number }[]) => void) | null>(null)

  // Main render effect — rebuilds drawRef whenever grid data changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw(preview?: { row: number; col: number }[]) {
      const w = labelWidth + cols * CELL_SIZE
      const h = rows * CELL_SIZE
      canvas!.width = w
      canvas!.height = h
      ctx!.clearRect(0, 0, w, h)

      const previewSet = preview
        ? new Set(preview.map((p) => `${p.row},${p.col}`))
        : null

      for (let r = 0; r < rows; r++) {
        const canvasRow = rows - 1 - r  // row 0 = bottom of knitting
        const y = canvasRow * CELL_SIZE
        const gridRow1 = r + 1

        for (let c = 0; c < cols; c++) {
          const x = labelWidth + c * CELL_SIZE
          const gridCol1 = c + 1
          const inactive = inactiveCells?.has(`${gridRow1},${gridCol1}`) ?? false
          const slotIndex = cells[r]?.[c] ?? 0
          const isPreview = previewSet?.has(`${r},${c}`) ?? false

          const isDecreased = decreasedCells?.has(`${gridRow1},${gridCol1}`) ?? false

          if (inactive) {
            ctx!.fillStyle = INACTIVE_FILL
            ctx!.fillRect(x, y, CELL_SIZE, CELL_SIZE)
            ctx!.strokeStyle = INACTIVE_HATCH_COLOR
            ctx!.lineWidth = 1
            ctx!.beginPath()
            ctx!.moveTo(x, y); ctx!.lineTo(x + CELL_SIZE, y + CELL_SIZE)
            ctx!.moveTo(x + CELL_SIZE, y); ctx!.lineTo(x, y + CELL_SIZE)
            ctx!.stroke()
          } else if (isDecreased) {
            ctx!.fillStyle = INACTIVE_FILL
            ctx!.fillRect(x, y, CELL_SIZE, CELL_SIZE)
            ctx!.strokeStyle = DECREASE_STRIPE_COLOR
            ctx!.lineWidth = 1.5
            ctx!.beginPath()
            ctx!.moveTo(x,                    y + CELL_SIZE * 2 / 3)
            ctx!.lineTo(x + CELL_SIZE * 2 / 3, y)
            ctx!.moveTo(x,                    y + CELL_SIZE)
            ctx!.lineTo(x + CELL_SIZE,         y)
            ctx!.moveTo(x + CELL_SIZE / 3,    y + CELL_SIZE)
            ctx!.lineTo(x + CELL_SIZE,         y + CELL_SIZE / 3)
            ctx!.stroke()
          } else if (isPreview) {
            const { paintSlot = 0, colorMap: cm } = optionsRef.current
            const hex = paintSlot > 0 ? (cm[paintSlot] ?? EMPTY_FILL) : EMPTY_FILL
            ctx!.globalAlpha = PREVIEW_ALPHA
            ctx!.fillStyle = hex
            ctx!.fillRect(x, y, CELL_SIZE, CELL_SIZE)
            ctx!.globalAlpha = 1
          } else {
            ctx!.fillStyle = slotIndex > 0 ? (colorMap[slotIndex] ?? EMPTY_FILL) : EMPTY_FILL
            ctx!.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          }
        }
      }

      // Grid lines
      ctx!.strokeStyle = GRID_LINE_COLOR
      ctx!.lineWidth = 1
      for (let c = 0; c <= cols; c++) {
        const x = labelWidth + c * CELL_SIZE + 0.5
        ctx!.beginPath()
        ctx!.moveTo(x, 0)
        ctx!.lineTo(x, rows * CELL_SIZE)
        ctx!.stroke()
      }
      for (let r = 0; r <= rows; r++) {
        ctx!.beginPath()
        ctx!.moveTo(labelWidth, r * CELL_SIZE + 0.5)
        ctx!.lineTo(w, r * CELL_SIZE + 0.5)
        ctx!.stroke()
      }

      // Row numbers and optional skip annotations (bottom-up, 1-indexed)
      const hasAnnotations = rowSkipAnnotations && rowSkipAnnotations.size > 0
      ctx!.textAlign = 'right'
      for (let r = 0; r < rows; r++) {
        const canvasRow = rows - 1 - r
        const cellTop = canvasRow * CELL_SIZE
        const gridRow1 = r + 1
        const annotation = rowSkipAnnotations?.get(gridRow1)

        if (hasAnnotations && annotation) {
          // Two-line: row number on top, annotation below
          ctx!.fillStyle = ROW_NUM_COLOR
          ctx!.font = '8px sans-serif'
          ctx!.textBaseline = 'alphabetic'
          ctx!.fillText(String(gridRow1), labelWidth - 3, cellTop + 9)
          ctx!.fillStyle = ANNOTATION_COLOR
          ctx!.font = '6px sans-serif'
          ctx!.fillText(annotation, labelWidth - 3, cellTop + 18)
        } else {
          // Single centered row number
          ctx!.fillStyle = ROW_NUM_COLOR
          ctx!.font = '9px sans-serif'
          ctx!.textBaseline = 'middle'
          ctx!.fillText(String(gridRow1), labelWidth - 3, cellTop + CELL_SIZE / 2)
        }
      }
    }

    drawRef.current = draw
    draw()
  }, [cols, rows, cells, colorMap, inactiveCells, decreasedCells, rowSkipAnnotations, labelWidth])

  // Pointer event handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isDragging = false
    let lineStart: { row: number; col: number } | null = null

    function getCell(e: PointerEvent, allowDecreased = false): { row: number; col: number } | null {
      const rect = canvas!.getBoundingClientRect()
      const scaleX = canvas!.width / rect.width
      const scaleY = canvas!.height / rect.height
      const x = (e.clientX - rect.left) * scaleX - labelWidth
      const y = (e.clientY - rect.top) * scaleY
      const col = pixelToGridCol(x)
      const row = pixelToGridRow(y, rows)
      if (row < 0 || row >= rows || col < 0 || col >= cols) return null
      if (inactiveCells?.has(`${row + 1},${col + 1}`)) return null
      if (!allowDecreased && optionsRef.current.decreasedCells?.has(`${row + 1},${col + 1}`)) return null
      return { row, col }
    }

    function onPointerDown(e: PointerEvent) {
      canvas!.setPointerCapture(e.pointerId)
      const { editMode = 'pattern', onDecreaseToggle } = optionsRef.current
      if (editMode === 'decreases') {
        const cell = getCell(e, true)
        if (cell) onDecreaseToggle?.(cell.row, cell.col)
        return
      }
      isDragging = true
      const cell = getCell(e)
      if (!cell) return
      const { activeTool = 'freehand', onCellPaint, onStrokeStart } = optionsRef.current
      onStrokeStart?.()
      if (activeTool === 'freehand' || activeTool === 'eraser') {
        onCellPaint?.(cell.row, cell.col)
      } else if (activeTool === 'line') {
        lineStart = cell
        drawRef.current?.([cell])
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return
      const cell = getCell(e)
      const { activeTool = 'freehand', onCellPaint } = optionsRef.current
      if (activeTool === 'freehand' || activeTool === 'eraser') {
        if (cell) onCellPaint?.(cell.row, cell.col)
      } else if (activeTool === 'line' && lineStart && cell) {
        const preview = bresenhamLine(lineStart.row, lineStart.col, cell.row, cell.col)
        drawRef.current?.(preview)
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (!isDragging) return
      isDragging = false
      const { activeTool = 'freehand', onLinePaint, onStrokeEnd } = optionsRef.current
      if (activeTool === 'line' && lineStart) {
        const cell = getCell(e)
        const end = cell ?? lineStart
        const lineCells = bresenhamLine(lineStart.row, lineStart.col, end.row, end.col)
        onLinePaint?.(lineCells)
        lineStart = null
        drawRef.current?.()  // clear preview
      }
      onStrokeEnd?.()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
    }
  }, [cols, rows, inactiveCells, labelWidth])

  return canvasRef
}

export { CELL_SIZE, ROW_NUM_WIDTH, ANNOTATED_ROW_NUM_WIDTH }
