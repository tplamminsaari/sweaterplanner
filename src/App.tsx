import { useEffect } from 'react'
import { AppToolbar } from '@/components/layout/AppToolbar'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { YarnCatalogPanel } from '@/components/yarn/YarnCatalogPanel'
import { PatternDesignerPanel } from '@/components/pattern/PatternDesignerPanel'
import { SweaterPreviewPanel } from '@/components/preview/SweaterPreviewPanel'
import { usePatternStore } from '@/store/pattern-store'

function App() {
  const undo = usePatternStore((s) => s.undo)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo])

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
