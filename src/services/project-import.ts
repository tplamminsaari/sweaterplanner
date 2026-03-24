import type { ProjectExport, YarnSlot, PatternGrid, SweaterSize } from '@/types'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { useSweaterStore } from '@/store/sweater-store'

const SUPPORTED_VERSIONS = new Set(['1'])

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string }

function isPatternGrid(v: unknown): v is PatternGrid {
  if (!v || typeof v !== 'object') return false
  const g = v as Record<string, unknown>
  return (
    typeof g.area === 'string' &&
    typeof g.cols === 'number' &&
    typeof g.rows === 'number' &&
    Array.isArray(g.cells)
  )
}

function isYarnSlot(v: unknown): v is YarnSlot {
  if (!v || typeof v !== 'object') return false
  const s = v as Record<string, unknown>
  return typeof s.slotIndex === 'number' && (s.yarnColorId === null || typeof s.yarnColorId === 'string')
}

function validate(data: unknown): data is ProjectExport {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (typeof d.version !== 'string') return false
  if (!SUPPORTED_VERSIONS.has(d.version)) return false

  // yarns.slots — must be an array of 5 YarnSlots
  if (!d.yarns || typeof d.yarns !== 'object') return false
  const yarns = d.yarns as Record<string, unknown>
  if (!Array.isArray(yarns.slots) || yarns.slots.length !== 5) return false
  if (!yarns.slots.every(isYarnSlot)) return false

  // patterns
  if (!d.patterns || typeof d.patterns !== 'object') return false
  const patterns = d.patterns as Record<string, unknown>
  if (!isPatternGrid(patterns.shirtTail))     return false
  if (!isPatternGrid(patterns.sleeveOpening)) return false
  if (!isPatternGrid(patterns.yoke))          return false

  // sweater
  if (!d.sweater || typeof d.sweater !== 'object') return false
  const sweater = d.sweater as Record<string, unknown>
  const validSizes = new Set(['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'])
  if (!validSizes.has(sweater.size as string)) return false

  return true
}

export async function importProject(file: File): Promise<ImportResult> {
  let raw: string
  try {
    raw = await file.text()
  } catch {
    return { ok: false, error: 'Could not read the file.' }
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  if (!data || typeof data !== 'object' || typeof (data as Record<string, unknown>).version !== 'string') {
    return { ok: false, error: 'Unrecognised file format.' }
  }

  const version = (data as Record<string, unknown>).version as string
  if (!SUPPORTED_VERSIONS.has(version)) {
    return { ok: false, error: `Unsupported project version "${version}".` }
  }

  if (!validate(data)) {
    return { ok: false, error: 'The file is missing required fields or contains invalid data.' }
  }

  // Replace state
  const yarnStore    = useYarnStore.getState()
  const patternStore = usePatternStore.getState()
  const sweaterStore = useSweaterStore.getState()

  const slots = data.yarns.slots as [YarnSlot, YarnSlot, YarnSlot, YarnSlot, YarnSlot]
  slots.forEach((slot, i) => {
    if (slot.yarnColorId !== null) {
      yarnStore.assignColorToSlot(i, slot.yarnColorId)
    } else {
      yarnStore.clearSlot(i)
    }
  })

  patternStore.loadGrids(data.patterns)
  sweaterStore.setSize(data.sweater.size as SweaterSize)

  return { ok: true }
}
