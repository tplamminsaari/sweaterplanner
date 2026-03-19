import { AppToolbar } from '@/components/layout/AppToolbar'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppToolbar />
      <div style={{ flex: 1 }}>panels go here</div>
    </div>
  )
}

export default App
