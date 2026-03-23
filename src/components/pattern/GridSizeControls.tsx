import { usePatternStore } from '@/store/pattern-store'

const RANGES = {
  shirtTail:     { minCols: 4, maxCols: 8, minRows: 13, maxRows: 26 },
  sleeveOpening: { minCols: 4, maxCols: 8, minRows: 13, maxRows: 26 },
  yoke:          null,  // fixed 12×56
}

export function GridSizeControls() {
  const activeArea  = usePatternStore((s) => s.activeArea)
  const grid        = usePatternStore((s) => s[activeArea])
  const resizeGrid  = usePatternStore((s) => s.resizeGrid)

  const range = RANGES[activeArea]
  if (!range) return null  // yoke — no controls

  return (
    <div className="grid-size-controls">
      <label className="grid-size-control">
        <span className="grid-size-control__label">Cols</span>
        <input
          type="range"
          min={range.minCols}
          max={range.maxCols}
          value={grid.cols}
          onChange={(e) => resizeGrid(activeArea, grid.rows, Number(e.target.value))}
        />
        <span className="grid-size-control__value">{grid.cols}</span>
      </label>
      <label className="grid-size-control">
        <span className="grid-size-control__label">Rows</span>
        <input
          type="range"
          min={range.minRows}
          max={range.maxRows}
          value={grid.rows}
          onChange={(e) => resizeGrid(activeArea, Number(e.target.value), grid.cols)}
        />
        <span className="grid-size-control__value">{grid.rows}</span>
      </label>
    </div>
  )
}
