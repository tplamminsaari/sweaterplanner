import { useCallback, useMemo, useState } from 'react'
import { usePatternStore } from '@/store/pattern-store'
import { useYarnStore } from '@/store/yarn-store'
import { useSweaterStore } from '@/store/sweater-store'
import { useCanvasGrid, CELL_SIZE, ROW_NUM_WIDTH, ANNOTATED_ROW_NUM_WIDTH } from '@/hooks/useCanvasGrid'
import { yokeInactiveColsForRow, YOKE_ROW_SKIP_SIZES } from '@/types'

function useYokeInactiveCells(rows: number, cols: number): ReadonlySet<string> {
  return useMemo(() => {
    const set = new Set<string>()
    for (let r = 1; r <= rows; r++) {
      const inactive = yokeInactiveColsForRow(r)
      for (let c = 1; c <= cols; c++) {
        if (inactive.has(c)) set.add(`${r},${c}`)
      }
    }
    return set
  }, [rows, cols])
}

const YOKE_ROW_ANNOTATIONS: ReadonlyMap<number, string> = new Map(
  Object.entries(YOKE_ROW_SKIP_SIZES)
    .filter(([, sizes]) => sizes && sizes.length > 0)
    .map(([row, sizes]) => [Number(row), sizes!.join(' ')])
)

function useColorMap(): Record<number, string> {
  const slots = useYarnStore((s) => s.slots)
  const catalog = useYarnStore((s) => s.catalog)
  return useMemo(() => {
    const map: Record<number, string> = {}
    for (const slot of slots) {
      if (slot.yarnColorId) {
        const color = catalog.colors.find((c) => c.id === slot.yarnColorId)
        if (color) map[slot.slotIndex + 1] = color.hex
      }
    }
    return map
  }, [slots, catalog.colors])
}

export function PatternGrid() {
  const activeArea = usePatternStore((s) => s.activeArea)
  const grid = usePatternStore((s) => s[activeArea])
  const activeDrawingTool = usePatternStore((s) => s.activeDrawingTool)
  const setCellColor = usePatternStore((s) => s.setCellColor)
  const pushUndoSnapshot = usePatternStore((s) => s.pushUndoSnapshot)
  const setIsDrawing = usePatternStore((s) => s.setIsDrawing)
  const activeSlotIndex = useYarnStore((s) => s.activeSlotIndex)
  const size = useSweaterStore((s) => s.size)
  const colorMap = useColorMap()

  const [tooltip, setTooltip] = useState<{ row1: number; x: number; y: number } | null>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    if (canvasX >= 0 && canvasX < labelWidth) {
      const row1 = grid.rows - Math.floor(canvasY / CELL_SIZE)
      if (row1 >= 1 && row1 <= grid.rows) {
        setTooltip({ row1, x: e.clientX, y: e.clientY })
        return
      }
    }
    setTooltip(null)
  }

  function getTooltipText(row1: number): string {
    if (activeArea === 'yoke' && YOKE_ROW_SKIP_SIZES[row1]?.includes(size)) {
      return `Row ${row1} — skipped for ${size}`
    }
    return `Row ${row1}`
  }

  const yokeInactive = useYokeInactiveCells(grid.rows, grid.cols)
  const inactiveCells = activeArea === 'yoke' ? yokeInactive : undefined
  const rowSkipAnnotations = activeArea === 'yoke' ? YOKE_ROW_ANNOTATIONS : undefined

  const onCellPaint = useCallback((row: number, col: number) => {
    if (activeDrawingTool === 'freehand') {
      setCellColor(activeArea, row, col, activeSlotIndex + 1)
    } else if (activeDrawingTool === 'eraser') {
      setCellColor(activeArea, row, col, 0)
    }
  }, [activeDrawingTool, setCellColor, activeArea, activeSlotIndex])

  const onLinePaint = useCallback((lineCells: { row: number; col: number }[]) => {
    for (const { row, col } of lineCells) {
      setCellColor(activeArea, row, col, activeSlotIndex + 1)
    }
  }, [setCellColor, activeArea, activeSlotIndex])

  const onStrokeStart = useCallback(() => {
    pushUndoSnapshot()
    setIsDrawing(true)
  }, [pushUndoSnapshot, setIsDrawing])

  const onStrokeEnd = useCallback(() => {
    setIsDrawing(false)
  }, [setIsDrawing])

  const canvasRef = useCanvasGrid({
    cols: grid.cols,
    rows: grid.rows,
    cells: grid.cells,
    colorMap,
    inactiveCells,
    rowSkipAnnotations,
    activeTool: activeDrawingTool,
    onStrokeStart,
    onStrokeEnd,
    onCellPaint,
    onLinePaint,
    paintSlot: activeSlotIndex + 1,
  })

  const labelWidth = rowSkipAnnotations ? ANNOTATED_ROW_NUM_WIDTH : ROW_NUM_WIDTH

  return (
    <div className="pattern-grid-wrapper">
      <canvas
        ref={canvasRef}
        style={{
          width: labelWidth + grid.cols * CELL_SIZE,
          height: grid.rows * CELL_SIZE,
          imageRendering: 'pixelated',
          cursor: activeDrawingTool === 'eraser' ? 'cell' : 'crosshair',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div
          className="row-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          {getTooltipText(tooltip.row1)}
        </div>
      )}
    </div>
  )
}
