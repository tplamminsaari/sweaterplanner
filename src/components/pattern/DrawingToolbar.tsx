import { usePatternStore } from '@/store/pattern-store'
import { useYarnStore } from '@/store/yarn-store'
import type { DrawingTool } from '@/types'

const TOOLS: { tool: DrawingTool; label: string }[] = [
  { tool: 'freehand', label: 'Freehand' },
  { tool: 'line',     label: 'Line' },
  { tool: 'eraser',   label: 'Eraser' },
]

export function DrawingToolbar() {
  const activeDrawingTool = usePatternStore((s) => s.activeDrawingTool)
  const setDrawingTool    = usePatternStore((s) => s.setDrawingTool)
  const activeArea        = usePatternStore((s) => s.activeArea)
  const fillPattern       = usePatternStore((s) => s.fillPattern)
  const undo              = usePatternStore((s) => s.undo)
  const undoStack         = usePatternStore((s) => s._undoStack)
  const grid              = usePatternStore((s) => s[activeArea])
  const activeSlotIndex   = useYarnStore((s) => s.activeSlotIndex)
  const yokeEditMode      = usePatternStore((s) => s.yokeEditMode)
  const setYokeEditMode   = usePatternStore((s) => s.setYokeEditMode)

  function handleFill() {
    const hasContent = grid.cells.some((row) => row.some((v) => v !== 0))
    if (hasContent) {
      if (!window.confirm('Fill pattern? This will overwrite all painted cells.')) return
    }
    fillPattern(activeArea, activeSlotIndex + 1)
  }

  const isDecreaseMode = activeArea === 'yoke' && yokeEditMode === 'decreases'

  return (
    <div className="drawing-toolbar">
      <button
        className="drawing-tool-btn drawing-tool-btn--undo"
        onClick={undo}
        disabled={undoStack.length === 0}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <div className="drawing-toolbar__tools">
        {!isDecreaseMode && TOOLS.map(({ tool, label }) => (
          <button
            key={tool}
            className={`drawing-tool-btn${tool === activeDrawingTool ? ' drawing-tool-btn--active' : ''}`}
            onClick={() => setDrawingTool(tool)}
          >
            {label}
          </button>
        ))}
        {!isDecreaseMode && (
          <button className="drawing-tool-btn drawing-tool-btn--fill" onClick={handleFill}>
            Fill
          </button>
        )}
        {activeArea === 'yoke' && (
          <button
            className={`drawing-tool-btn drawing-tool-btn--decreases${isDecreaseMode ? ' drawing-tool-btn--active' : ''}`}
            onClick={() => setYokeEditMode(isDecreaseMode ? 'pattern' : 'decreases')}
            title="Edit yoke decrease schedule"
          >
            Decreases
          </button>
        )}
      </div>
    </div>
  )
}
