import { SweaterCanvas } from './SweaterCanvas'
import { YarnEstimation } from './YarnEstimation'

export function SweaterPreviewPanel() {
  return (
    <div className="sweater-preview-panel">
      <SweaterCanvas />
      <YarnEstimation />
    </div>
  )
}
