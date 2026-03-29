import { useCallback, useMemo } from 'react'
import { usePatternStore } from '@/store/pattern-store'
import { useYarnStore } from '@/store/yarn-store'
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
  const colorMap = useColorMap()

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
      />
    </div>
  )
}
