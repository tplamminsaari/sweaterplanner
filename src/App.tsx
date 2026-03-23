import { AppToolbar } from '@/components/layout/AppToolbar'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { YarnCatalogPanel } from '@/components/yarn/YarnCatalogPanel'
import { PatternDesignerPanel } from '@/components/pattern/PatternDesignerPanel'
import { SweaterPreviewPanel } from '@/components/preview/SweaterPreviewPanel'

function App() {
  return (
    <div className="app-shell">
      <AppToolbar />
      <ThreePanelLayout
        left={<YarnCatalogPanel />}
        center={<PatternDesignerPanel />}
        right={<SweaterPreviewPanel />}
      />
    </div>
  )
}

export default App
