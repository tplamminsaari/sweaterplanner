import { PatternAreaTabs } from './PatternAreaTabs'
import { DrawingToolbar } from './DrawingToolbar'
import { PatternGrid } from './PatternGrid'

export function PatternDesignerPanel() {
  return (
    <div className="pattern-designer-panel">
      <PatternAreaTabs />
      <DrawingToolbar />
      <div className="pattern-designer-panel__canvas-area">
        <PatternGrid />
      </div>
    </div>
  )
}
