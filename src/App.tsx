import { AppToolbar } from '@/components/layout/AppToolbar'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'

function App() {
  return (
    <div className="app-shell">
      <AppToolbar />
      <ThreePanelLayout
        left={<span className="panel__label">Yarn Catalog</span>}
        center={<span className="panel__label">Pattern Designer</span>}
        right={<span className="panel__label">Sweater Preview</span>}
      />
    </div>
  )
}

export default App
