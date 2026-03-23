import { PatternAreaTabs } from './PatternAreaTabs'
import { PatternGrid } from './PatternGrid'

export function PatternDesignerPanel() {
  return (
    <div className="pattern-designer-panel">
      <PatternAreaTabs />
      <div className="pattern-designer-panel__canvas-area">
        <PatternGrid />
      </div>
    </div>
  )
}
