import { useRef, useState } from 'react'
import type { SweaterSize } from '@/types'
import { useSweaterStore } from '@/store/sweater-store'
import { exportProject } from '@/services/project-export'
import { importProject } from '@/services/project-import'
import { downloadInstructions } from '@/services/generate-instructions'

const SIZES: SweaterSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']

export function AppToolbar() {
  const size    = useSweaterStore((s) => s.size)
  const setSize = useSweaterStore((s) => s.setSize)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  function handleImportClick() {
    setImportError(null)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected if needed
    e.target.value = ''

    const confirmed = window.confirm(
      'Importing a project will replace your current yarn slots, patterns, and size selection. Continue?',
    )
    if (!confirmed) return

    const result = await importProject(file)
    if (!result.ok) {
      setImportError(result.error)
    }
  }

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
        <button className="toolbar-btn" onClick={exportProject}>Export</button>
        <button className="toolbar-btn" onClick={handleImportClick}>Import</button>
        <button className="toolbar-btn" onClick={downloadInstructions}>Download Instructions</button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {importError && (
        <div className="app-toolbar__error" role="alert">
          {importError}
          <button
            className="app-toolbar__error-dismiss"
            onClick={() => setImportError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </header>
  )
}
