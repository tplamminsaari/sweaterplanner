import { AppToolbar } from '@/components/layout/AppToolbar'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { YarnCatalogPanel } from '@/components/yarn/YarnCatalogPanel'
import { PatternDesignerPanel } from '@/components/pattern/PatternDesignerPanel'

function App() {
  return (
    <div className="app-shell">
      <AppToolbar />
      <ThreePanelLayout
        left={<YarnCatalogPanel />}
        center={<PatternDesignerPanel />}
        right={<span className="panel__label">Sweater Preview</span>}
      />
    </div>
  )
}

export default App
