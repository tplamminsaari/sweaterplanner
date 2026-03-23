import { useCallback, useMemo } from 'react'
import { usePatternStore } from '@/store/pattern-store'
import { useYarnStore } from '@/store/yarn-store'
import { useCanvasGrid, CELL_SIZE } from '@/hooks/useCanvasGrid'
import { yokeInactiveColsForRow } from '@/types'

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
  const activeSlotIndex = useYarnStore((s) => s.activeSlotIndex)
  const colorMap = useColorMap()

  const yokeInactive = useYokeInactiveCells(grid.rows, grid.cols)
  const inactiveCells = activeArea === 'yoke' ? yokeInactive : undefined

  const onCellPaint = useCallback((row: number, col: number) => {
    if (activeDrawingTool === 'freehand') {
      setCellColor(activeArea, row, col, activeSlotIndex + 1)
    } else if (activeDrawingTool === 'eraser') {
      setCellColor(activeArea, row, col, 0)
    }
  }, [activeDrawingTool, setCellColor, activeArea, activeSlotIndex])

  const canvasRef = useCanvasGrid({
    cols: grid.cols,
    rows: grid.rows,
    cells: grid.cells,
    colorMap,
    inactiveCells,
    onCellPaint,
  })

  return (
    <div className="pattern-grid-wrapper">
      <canvas
        ref={canvasRef}
        style={{
          width: grid.cols * CELL_SIZE,
          height: grid.rows * CELL_SIZE,
          imageRendering: 'pixelated',
          cursor: activeDrawingTool === 'eraser' ? 'cell' : 'crosshair',
        }}
      />
    </div>
  )
}
