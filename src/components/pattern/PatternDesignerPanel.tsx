import { PatternAreaTabs } from './PatternAreaTabs'
import { DrawingToolbar } from './DrawingToolbar'
import { GridSizeControls } from './GridSizeControls'
import { PatternGrid } from './PatternGrid'
import { YarnSlots } from '@/components/yarn/YarnSlots'

export function PatternDesignerPanel() {
  return (
    <div className="pattern-designer-panel">
      <PatternAreaTabs />
      <div className="pattern-designer-panel__body">
        <YarnSlots />
        <div className="pattern-designer-panel__right">
          <DrawingToolbar />
          <GridSizeControls />
          <div className="pattern-designer-panel__canvas-area">
            <PatternGrid />
          </div>
        </div>
      </div>
    </div>
  )
}
