import type { SweaterSize } from '@/types'
import { useSweaterStore } from '@/store/sweater-store'

const SIZES: SweaterSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']

export function AppToolbar() {
  const size    = useSweaterStore((s) => s.size)
  const setSize = useSweaterStore((s) => s.setSize)

  return (
    <header className="app-toolbar">
      <div className="app-toolbar__group">
        <label className="app-toolbar__label" htmlFor="size-select">
          Size
        </label>
        <select
          id="size-select"
          value={size}
          onChange={(e) => setSize(e.target.value as SweaterSize)}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="app-toolbar__group app-toolbar__actions">
        <button className="toolbar-btn">Export</button>
        <button className="toolbar-btn">Import</button>
        <button className="toolbar-btn">Download Instructions</button>
      </div>
    </header>
  )
}
