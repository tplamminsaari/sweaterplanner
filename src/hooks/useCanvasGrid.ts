import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/** Convert a canvas-space Y pixel to a 0-indexed grid row (row 0 = bottom). */
function pixelToGridRow(canvasY: number, rows: number): number {
  const canvasRow = Math.floor(canvasY / CELL_SIZE)
  return rows - 1 - canvasRow
}

function pixelToGridCol(canvasX: number): number {
  return Math.floor(canvasX / CELL_SIZE)
}

const CELL_SIZE = 20
const GRID_LINE_COLOR = 'rgba(255,255,255,0.08)'
const INACTIVE_FILL = 'rgba(0,0,0,0.5)'
const INACTIVE_HATCH_COLOR = 'rgba(255,255,255,0.15)'
const EMPTY_FILL = '#2c2c32'

interface UseCanvasGridOptions {
  cols: number
  rows: number
  cells: number[][]
  colorMap: Record<number, string>     // slotIndex → hex color (0 = empty)
  inactiveCells?: ReadonlySet<string>  // "row,col" keys (1-indexed row, 1-indexed col)
  /** Called when the user paints a cell (freehand drag). row/col are 0-indexed. */
  onCellPaint?: (row: number, col: number) => void
}

export function useCanvasGrid(options: UseCanvasGridOptions): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { cols, rows, cells, colorMap, inactiveCells, onCellPaint } = options

  // Keep a stable ref to the callback so pointer events don't need to re-register
  const onCellPaintRef = useRef(onCellPaint)
  useEffect(() => { onCellPaintRef.current = onCellPaint }, [onCellPaint])

  // Pointer event handling for freehand painting
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isDragging = false

    function getCell(e: PointerEvent): { row: number; col: number } | null {
      const rect = canvas!.getBoundingClientRect()
      const scaleX = canvas!.width / rect.width
      const scaleY = canvas!.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      const col = pixelToGridCol(x)
      const row = pixelToGridRow(y, rows)
      if (row < 0 || row >= rows || col < 0 || col >= cols) return null
      // Skip inactive cells
      const key = `${row + 1},${col + 1}`
      if (inactiveCells?.has(key)) return null
      return { row, col }
    }

    function paint(e: PointerEvent) {
      const cell = getCell(e)
      if (cell) onCellPaintRef.current?.(cell.row, cell.col)
    }

    function onPointerDown(e: PointerEvent) {
      isDragging = true
      canvas!.setPointerCapture(e.pointerId)
      paint(e)
    }

    function onPointerMove(e: PointerEvent) {
      if (isDragging) paint(e)
    }

    function onPointerUp() { isDragging = false }

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
  }, [cols, rows, inactiveCells])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = cols * CELL_SIZE
    const h = rows * CELL_SIZE
    canvas.width = w
    canvas.height = h

    ctx.clearRect(0, 0, w, h)

    for (let r = 0; r < rows; r++) {
      // row 0 = bottom of knitting → drawn at the bottom of canvas
      const canvasRow = rows - 1 - r
      const y = canvasRow * CELL_SIZE
      const gridRow1 = r + 1  // 1-indexed row for inactiveCells lookup

      for (let c = 0; c < cols; c++) {
        const x = c * CELL_SIZE
        const gridCol1 = c + 1  // 1-indexed col
        const inactive = inactiveCells?.has(`${gridRow1},${gridCol1}`) ?? false
        const slotIndex = cells[r]?.[c] ?? 0

        if (inactive) {
          ctx.fillStyle = INACTIVE_FILL
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
          // Cross-hatch
          ctx.strokeStyle = INACTIVE_HATCH_COLOR
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE)
          ctx.moveTo(x + CELL_SIZE, y)
          ctx.lineTo(x, y + CELL_SIZE)
          ctx.stroke()
        } else {
          ctx.fillStyle = slotIndex > 0 ? (colorMap[slotIndex] ?? EMPTY_FILL) : EMPTY_FILL
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.lineWidth = 1
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath()
      ctx.moveTo(c * CELL_SIZE + 0.5, 0)
      ctx.lineTo(c * CELL_SIZE + 0.5, h)
      ctx.stroke()
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * CELL_SIZE + 0.5)
      ctx.lineTo(w, r * CELL_SIZE + 0.5)
      ctx.stroke()
    }
  }, [cols, rows, cells, colorMap, inactiveCells])

  return canvasRef
}

export { CELL_SIZE }
