import { AppToolbar } from '@/components/layout/AppToolbar'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { YarnCatalogPanel } from '@/components/yarn/YarnCatalogPanel'

function App() {
  return (
    <div className="app-shell">
      <AppToolbar />
      <ThreePanelLayout
        left={<YarnCatalogPanel />}
        center={<span className="panel__label">Pattern Designer</span>}
        right={<span className="panel__label">Sweater Preview</span>}
      />
    </div>
  )
}

export default App
