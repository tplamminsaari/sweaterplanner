import type { PatternArea } from '@/types'
import { usePatternStore } from '@/store/pattern-store'

const TABS: { area: PatternArea; label: string }[] = [
  { area: 'shirtTail',     label: 'Shirt tail' },
  { area: 'sleeveOpening', label: 'Sleeve opening' },
  { area: 'yoke',          label: 'Yoke' },
]

export function PatternAreaTabs() {
  const activeArea = usePatternStore((s) => s.activeArea)
  const setActiveArea = usePatternStore((s) => s.setActiveArea)

  return (
    <div className="pattern-area-tabs">
      {TABS.map(({ area, label }) => (
        <button
          key={area}
          className={`pattern-area-tab${area === activeArea ? ' pattern-area-tab--active' : ''}`}
          onClick={() => setActiveArea(area)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
