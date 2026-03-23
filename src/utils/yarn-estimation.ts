import type { SweaterSize, PatternGrid, YarnSlot, YarnEstimate } from '../types'
import type { Brand as _Brand, YarnType, YarnColor } from '../types'
import { SHIRT_TAIL_STITCHES, YOKE_START_STITCHES, yokeInactiveColsForRow } from '../types'

// Approximate sleeve circumference stitches per size
const SLEEVE_STITCHES: Record<SweaterSize, number> = {
  S: 60, M: 66, L: 72, XL: 78, XXL: 84, '3XL': 90, '4XL': 96,
}

interface Catalog {
  types: YarnType[]
  colors: YarnColor[]
}

interface Patterns {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
}

/** Grams of yarn per stitch for a given yarn type. */
function gramsPerStitch(type: YarnType): number {
  const stitchesPerCm = type.stitchesPer10cm / 10
  // weight per cm of yarn × cm per stitch
  return type.weightGrams / (type.metersPerWeight * 100 * stitchesPerCm)
}

/** Count stitches painted with each slot across all pattern areas. */
function countStitchesPerSlot(
  size: SweaterSize,
  patterns: Patterns,
): Map<number, number> {
  const counts = new Map<number, number>()

  function add(slot: number, n: number) {
    counts.set(slot, (counts.get(slot) ?? 0) + n)
  }

  // shirtTail — tiles around full body circumference
  {
    const { cells, rows, cols } = patterns.shirtTail
    const repeats = SHIRT_TAIL_STITCHES[size] / cols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slot = cells[r]?.[c] ?? 0
        if (slot > 0) add(slot, repeats)
      }
    }
  }

  // sleeveOpening — tiles around sleeve circumference × 2 sleeves
  {
    const { cells, rows, cols } = patterns.sleeveOpening
    const repeats = (SLEEVE_STITCHES[size] / cols) * 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slot = cells[r]?.[c] ?? 0
        if (slot > 0) add(slot, repeats)
      }
    }
  }

  // yoke — each active cell in the 12-col repeat × (yoke start stitches / 12)
  {
    const { cells, rows, cols } = patterns.yoke
    const repeatCount = YOKE_START_STITCHES[size] / cols
    for (let r = 0; r < rows; r++) {
      const gridRow1   = r + 1
      const inactiveCols = yokeInactiveColsForRow(gridRow1)
      for (let c = 0; c < cols; c++) {
        if (inactiveCols.has(c + 1)) continue
        const slot = cells[r]?.[c] ?? 0
        if (slot > 0) add(slot, repeatCount)
      }
    }
  }

  return counts
}

export function estimateYarn(
  size: SweaterSize,
  patterns: Patterns,
  slots: readonly YarnSlot[],
  catalog: Catalog,
): YarnEstimate[] {
  const stitchesBySlot = countStitchesPerSlot(size, patterns)
  const estimates: YarnEstimate[] = []

  for (const slot of slots) {
    const stitches = stitchesBySlot.get(slot.slotIndex + 1) ?? 0
    if (!slot.yarnColorId && stitches === 0) continue

    const color    = catalog.colors.find((c) => c.id === slot.yarnColorId)
    const yarnType = color
      ? catalog.types.find((t) => t.id === color.yarnTypeId)
      : null

    const gPerStitch = yarnType ? gramsPerStitch(yarnType) : 0
    const estimatedGrams  = Math.ceil(stitches * gPerStitch)
    const estimatedSkeins = yarnType
      ? Math.ceil(estimatedGrams / yarnType.weightGrams)
      : 0

    estimates.push({
      slotIndex: slot.slotIndex,
      colorName: color?.name ?? '(unassigned)',
      estimatedGrams,
      estimatedSkeins,
    })
  }

  return estimates
}
