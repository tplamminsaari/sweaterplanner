import { useCallback, useMemo, useState } from 'react'
import { usePatternStore } from '@/store/pattern-store'
import { useYarnStore } from '@/store/yarn-store'
import { useSweaterStore } from '@/store/sweater-store'
import { useCanvasGrid, CELL_SIZE, ROW_NUM_WIDTH, ANNOTATED_ROW_NUM_WIDTH } from '@/hooks/useCanvasGrid'
import { yokeInactiveColsForRow, YOKE_ROW_SKIP_SIZES } from '@/types'
import { deriveInactiveCells } from '@/utils/yoke-decreases'

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
  const activeArea            = usePatternStore((s) => s.activeArea)
  const grid                  = usePatternStore((s) => s[activeArea])
  const activeDrawingTool     = usePatternStore((s) => s.activeDrawingTool)
  const setCellColor          = usePatternStore((s) => s.setCellColor)
  const pushUndoSnapshot      = usePatternStore((s) => s.pushUndoSnapshot)
  const setIsDrawing          = usePatternStore((s) => s.setIsDrawing)
  const yokeEditMode          = usePatternStore((s) => s.yokeEditMode)
  const yokeDecreaseSchedule  = usePatternStore((s) => s.yokeDecreaseSchedule)
  const addDecrease           = usePatternStore((s) => s.addDecrease)
  const removeDecrease        = usePatternStore((s) => s.removeDecrease)
  const activeSlotIndex       = useYarnStore((s) => s.activeSlotIndex)
  const size                  = useSweaterStore((s) => s.size)
  const colorMap              = useColorMap()

  const [tooltip, setTooltip] = useState<{ row1: number; x: number; y: number } | null>(null)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  // Cells made inactive by the user-defined decrease schedule
  const userDecreasedCells = useMemo(
    () => (activeArea === 'yoke' ? deriveInactiveCells(yokeDecreaseSchedule, grid.rows) : null),
    [activeArea, yokeDecreaseSchedule, grid.rows],
  )

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

  // In pattern mode, merge user decreases into inactiveCells so they block painting.
  // In decrease mode, pass only predefined inactive cells — user-decreased cells are
  // handled via the separate `decreasedCells` prop so clicks inside them still fire.
  const inactiveCells = useMemo(() => {
    if (activeArea !== 'yoke') return undefined
    if (yokeEditMode === 'decreases') return yokeInactive
    if (!userDecreasedCells || userDecreasedCells.size === 0) return yokeInactive
    const merged = new Set(yokeInactive)
    for (const key of userDecreasedCells) merged.add(key)
    return merged as ReadonlySet<string>
  }, [activeArea, yokeInactive, userDecreasedCells, yokeEditMode])

  const rowSkipAnnotations = activeArea === 'yoke' ? YOKE_ROW_ANNOTATIONS : undefined

  // In decrease mode pass decreasedCells separately so they render with distinct style
  const decreasedCells = activeArea === 'yoke' && yokeEditMode === 'decreases'
    ? (userDecreasedCells ?? undefined)
    : undefined

  const onDecreaseToggle = useCallback((row: number, col: number) => {
    const row1 = row + 1
    const col1 = col + 1
    const existing = yokeDecreaseSchedule.find((e) => e.col === col1)
    if (existing) {
      if (existing.fromRow === row1) {
        removeDecrease(col1)
      } else {
        // Check constraint for new position (excluding current entry for this col)
        const conflict = yokeDecreaseSchedule.some(
          (e) => e.col !== col1 && Math.abs(e.col - col1) === 1 && e.fromRow === row1,
        )
        if (conflict) {
          setConflictMsg(`Column ${col1} conflicts with an adjacent decrease at row ${row1}`)
          return
        }
        removeDecrease(col1)
        addDecrease(col1, row1)
      }
    } else {
      const conflict = yokeDecreaseSchedule.some(
        (e) => Math.abs(e.col - col1) === 1 && e.fromRow === row1,
      )
      if (conflict) {
        setConflictMsg(`Column ${col1} conflicts with an adjacent decrease at row ${row1}`)
        return
      }
      addDecrease(col1, row1)
    }
    setConflictMsg(null)
  }, [yokeDecreaseSchedule, addDecrease, removeDecrease])

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

  const editMode = activeArea === 'yoke' ? yokeEditMode : 'pattern'

  const canvasRef = useCanvasGrid({
    cols: grid.cols,
    rows: grid.rows,
    cells: grid.cells,
    colorMap,
    inactiveCells,
    decreasedCells,
    rowSkipAnnotations,
    activeTool: activeDrawingTool,
    editMode,
    onStrokeStart,
    onStrokeEnd,
    onCellPaint,
    onLinePaint,
    paintSlot: activeSlotIndex + 1,
    onDecreaseToggle,
  })

  const labelWidth = rowSkipAnnotations ? ANNOTATED_ROW_NUM_WIDTH : ROW_NUM_WIDTH

  return (
    <div className="pattern-grid-wrapper">
      {conflictMsg && (
        <div className="decrease-conflict-msg" role="alert">
          {conflictMsg}
          <button className="decrease-conflict-msg__dismiss" onClick={() => setConflictMsg(null)}>×</button>
        </div>
      )}
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
