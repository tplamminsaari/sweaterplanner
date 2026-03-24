import type { ProjectExport } from '@/types'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { useSweaterStore } from '@/store/sweater-store'

export function exportProject(): void {
  const yarn    = useYarnStore.getState()
  const pattern = usePatternStore.getState()
  const sweater = useSweaterStore.getState()

  const data: ProjectExport = {
    version:    '1',
    exportedAt: new Date().toISOString(),
    yarns: {
      slots: yarn.slots,
    },
    patterns: {
      shirtTail:     pattern.shirtTail,
      sleeveOpening: pattern.sleeveOpening,
      yoke:          pattern.yoke,
    },
    sweater: {
      size: sweater.size,
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'sweater-project.json'
  a.click()
  URL.revokeObjectURL(url)
}
