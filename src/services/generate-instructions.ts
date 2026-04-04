import type { SweaterSize, PatternGrid, YarnSlot, YarnType, YarnColor } from '@/types'
import {
  SHIRT_TAIL_STITCHES,
  YOKE_START_STITCHES,
  YOKE_COLUMN_SKIP_SCHEDULE,
  YOKE_ROW_SKIP_SIZES,
  yokeInactiveColsForRow,
} from '@/types'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { useSweaterStore } from '@/store/sweater-store'
import { estimateYarn } from '@/utils/yarn-estimation'

// Sleeve stitches — must match yarn-estimation.ts
const SLEEVE_STITCHES: Record<SweaterSize, number> = {
  S: 60, M: 66, L: 72, XL: 78, XXL: 84, '3XL': 90, '4XL': 96,
}

const HR = '=' .repeat(72)
const hr = '-'.repeat(72)

function line(label: string, value: string | number, pad = 40): string {
  return `${label.padEnd(pad)}${value}`
}

function renderGrid(
  grid: PatternGrid,
  getInactiveCols?: (row1: number) => ReadonlySet<number>,
  skippedRows?: ReadonlySet<number>,
): string {
  const lines: string[] = []
  // Print top row first (highest row index = top of knitting)
  for (let r = grid.rows - 1; r >= 0; r--) {
    const row1 = r + 1
    const isSkipped = skippedRows?.has(row1) ?? false
    const inactive = getInactiveCols ? getInactiveCols(row1) : new Set<number>()
    const cells = Array.from({ length: grid.cols }, (_, c) => {
      if (isSkipped || inactive.has(c + 1)) return '·'
      const v = grid.cells[r]?.[c] ?? 0
      return v === 0 ? '░' : String(v)
    })
    const suffix = isSkipped ? '  (skipped)' : ''
    lines.push(`  Row ${String(row1).padStart(2)}: ${cells.join(' ')}${suffix}`)
  }
  return lines.join('\n')
}

function resolveYarnInfo(
  slot: YarnSlot,
  colors: YarnColor[],
  types: YarnType[],
): { colorName: string; typeName: string; colorCode: string; needleSizeMm: number | null; yarnType: YarnType | null } {
  const color = colors.find((c) => c.id === slot.yarnColorId) ?? null
  const yarnType = color ? (types.find((t) => t.id === color.yarnTypeId) ?? null) : null
  return {
    colorName:   color?.name     ?? '(unassigned)',
    typeName:    yarnType?.name  ?? '—',
    colorCode:   color?.colorCode ?? '—',
    needleSizeMm: yarnType?.needleSizeMm ?? null,
    yarnType,
  }
}

export function generateInstructions(): string {
  const yarn    = useYarnStore.getState()
  const pattern = usePatternStore.getState()
  const sweater = useSweaterStore.getState()

  const { size }   = sweater
  const { slots, catalog } = yarn
  const { shirtTail, sleeveOpening, yoke } = pattern

  const estimates = estimateYarn(size, { shirtTail, sleeveOpening, yoke }, slots, catalog)

  // Determine primary yarn type from slot 1 (main color)
  const slot1Info  = resolveYarnInfo(slots[0], catalog.colors, catalog.types)
  const needleSize = slot1Info.needleSizeMm ?? 4.5
  const gauge      = slot1Info.yarnType
    ? { stitchesPer10cm: slot1Info.yarnType.stitchesPer10cm, rowsPer10cm: slot1Info.yarnType.rowsPer10cm }
    : { stitchesPer10cm: 18, rowsPer10cm: 24 }

  // Yoke stitch counts
  const yokeStartStitches = YOKE_START_STITCHES[size]
  const yokeRepeats       = yokeStartStitches / yoke.cols   // e.g. 15 for size M
  const lastSkip          = YOKE_COLUMN_SKIP_SCHEDULE[YOKE_COLUMN_SKIP_SCHEDULE.length - 1]
  const activeNeckCols    = yoke.cols - lastSkip.skippedCols.length
  const neckStitches      = activeNeckCols * yokeRepeats

  const bodyStitches    = SHIRT_TAIL_STITCHES[size]
  const sleeveStitches  = SLEEVE_STITCHES[size]

  const shirtTailRepeats    = bodyStitches / shirtTail.cols
  const sleeveOpeningRepeats = sleeveStitches / sleeveOpening.cols

  const parts: string[] = []

  // ── Header ──────────────────────────────────────────────────────────────────
  parts.push(HR)
  parts.push('SWEATER KNITTING INSTRUCTIONS')
  parts.push(HR)
  parts.push('')
  parts.push(line('Generated:', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })))
  parts.push(line('Size:', size))
  parts.push('')

  // ── Yarn ────────────────────────────────────────────────────────────────────
  parts.push(hr)
  parts.push('YARN')
  parts.push(hr)
  parts.push('')

  for (const slot of slots) {
    const info = resolveYarnInfo(slot, catalog.colors, catalog.types)
    const est  = estimates.find((e) => e.slotIndex === slot.slotIndex)
    const gramsStr  = est ? `~${est.estimatedGrams} g` : '—'
    const skeinsStr = est ? `${est.estimatedSkeins} skein${est.estimatedSkeins !== 1 ? 's' : ''}` : '—'
    const yarnDesc  = info.yarnType
      ? `${info.typeName} – ${info.colorName} (${info.colorCode})`
      : '(unassigned)'
    parts.push(
      `Slot ${slot.slotIndex + 1}: ${yarnDesc.padEnd(46)} ${gramsStr.padStart(7)}  /  ${skeinsStr}`,
    )
  }
  parts.push('')

  // ── Needles & gauge ─────────────────────────────────────────────────────────
  parts.push(hr)
  parts.push('NEEDLES & GAUGE')
  parts.push(hr)
  parts.push('')
  parts.push(line('Needle size:', `${needleSize} mm circular (based on Slot 1 yarn)`))
  parts.push(line('Gauge:', `${gauge.stitchesPer10cm} sts × ${gauge.rowsPer10cm} rows = 10 cm × 10 cm`))
  parts.push('')

  // ── Stitch counts ───────────────────────────────────────────────────────────
  parts.push(hr)
  parts.push(`STITCH COUNTS  (Size ${size})`)
  parts.push(hr)
  parts.push('')
  parts.push(line('Body cast-on (after bottom ribbing):', `${bodyStitches} sts`))
  parts.push(line('Yoke cast-on (total):', `${yokeStartStitches} sts`))
  parts.push(line('  — body:', `${yokeStartStitches - sleeveStitches * 2} sts`))
  parts.push(line('  — each sleeve:', `${sleeveStitches} sts`))
  parts.push(line('Neck (end of yoke):', `~${neckStitches} sts`))
  parts.push(line('12-col yoke repeat tiles:', `${yokeRepeats}×`))
  parts.push('')

  // ── Sweater structure ───────────────────────────────────────────────────────
  parts.push(hr)
  parts.push('STRUCTURE  (worked bottom up)')
  parts.push(hr)
  parts.push('')
  parts.push('BODY')
  parts.push(`  1. Bottom ribbing: 5 cm  (2×2 rib recommended, ${bodyStitches} sts)`)
  parts.push(`  2. Shirt tail pattern: ${shirtTail.rows} rows × ${shirtTail.cols}-st repeat`)
  parts.push(`     (repeat tiles ${shirtTailRepeats}× around body at cast-on)`)
  parts.push(`  3. Body (solid): continue in Slot 1 colour to yoke`)
  parts.push('')
  parts.push('SLEEVES  (worked in the round from cuff)')
  parts.push(`  1. Cuff ribbing: 5 cm  (2×2 rib, ${sleeveStitches} sts)`)
  parts.push(`  2. Sleeve opening pattern: ${sleeveOpening.rows} rows × ${sleeveOpening.cols}-st repeat`)
  parts.push(`     (repeat tiles ${sleeveOpeningRepeats}× around sleeve)`)
  parts.push(`  3. Sleeve body (solid): continue in Slot 1 colour`)
  parts.push('')
  parts.push('YOKE  (body + sleeves joined in the round)')
  parts.push(`  Total sts at join: ${yokeStartStitches}`)
  parts.push(`  Yoke pattern: ${yoke.rows} rows × ${yoke.cols}-st repeat  (tiles ${yokeRepeats}×)`)
  parts.push('  Decreases follow the schedule below.')
  parts.push(`  Neck ribbing: 5 cm  (~${neckStitches} sts)`)
  parts.push('')

  // ── Yoke decrease schedule ──────────────────────────────────────────────────
  parts.push(hr)
  parts.push('YOKE DECREASE SCHEDULE')
  parts.push(hr)
  parts.push('')
  parts.push('Columns are 1-indexed within the 12-stitch repeat.')
  parts.push('Each decrease removes 1 stitch per column per repeat (k2tog or ssk).')
  parts.push('')

  let prevSkippedCount = 0
  for (const entry of YOKE_COLUMN_SKIP_SCHEDULE) {
    const newlySkipped = entry.skippedCols.length - prevSkippedCount
    const stitchesDecreased = newlySkipped * yokeRepeats
    parts.push(
      `  At row ${String(entry.fromRow).padStart(2)}: skip col(s) ${entry.skippedCols.join(', ').padEnd(22)}` +
      `→ decrease ${stitchesDecreased} sts  (${newlySkipped} per repeat × ${yokeRepeats} repeats)`,
    )
    prevSkippedCount = entry.skippedCols.length
  }
  parts.push('')

  // ── Yoke row skipping ───────────────────────────────────────────────────────
  const ALL_SIZES: SweaterSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
  const skippedForSize = Object.entries(YOKE_ROW_SKIP_SIZES)
    .filter(([, sizes]) => sizes?.includes(size))
    .map(([row]) => Number(row))
    .sort((a, b) => a - b)

  parts.push(hr)
  parts.push('YOKE ROW SKIPPING')
  parts.push(hr)
  parts.push('')

  if (skippedForSize.length === 0) {
    parts.push(`  All rows are knitted for size ${size}.`)
  } else {
    parts.push(`  Rows skipped for size ${size}: ${skippedForSize.join(', ')}`)
  }
  parts.push('')
  parts.push('  Full skip table (rows knitted on fewer than all sizes):')
  parts.push(`  ${'Row'.padEnd(6)}  ${ALL_SIZES.join('   ')}`)
  parts.push(`  ${''.padEnd(6)}  ${ALL_SIZES.map(() => '---').join('   ')}`)
  for (const [rowStr, skipSizes] of Object.entries(YOKE_ROW_SKIP_SIZES).sort(([a], [b]) => Number(a) - Number(b))) {
    if (!skipSizes || skipSizes.length === 0) continue
    const cols = ALL_SIZES.map((s) => (skipSizes.includes(s) ? 'skip' : 'knit'))
    parts.push(`  ${String(rowStr).padEnd(6)}  ${cols.join('   ')}`)
  }
  parts.push('')

  // ── Pattern grids ───────────────────────────────────────────────────────────
  parts.push(hr)
  parts.push('PATTERN GRIDS')
  parts.push(hr)
  parts.push('')
  parts.push('Legend:  ░ = empty (background / Slot 1)   · = inactive (decreased away)')
  parts.push('         1–5 = yarn slot number')
  parts.push('')

  parts.push(`SHIRT TAIL  (${shirtTail.cols} cols × ${shirtTail.rows} rows, top → bottom)`)
  parts.push(renderGrid(shirtTail))
  parts.push('')

  parts.push(`SLEEVE OPENING  (${sleeveOpening.cols} cols × ${sleeveOpening.rows} rows, top → bottom)`)
  parts.push(renderGrid(sleeveOpening))
  parts.push('')

  parts.push(`YOKE  (${yoke.cols} cols × ${yoke.rows} rows, top → bottom)  [size ${size}]`)
  parts.push(renderGrid(yoke, yokeInactiveColsForRow, new Set(skippedForSize)))
  parts.push('')

  parts.push(HR)
  parts.push('END OF INSTRUCTIONS')
  parts.push(HR)

  return parts.join('\n')
}

export function downloadInstructions(): void {
  const text = generateInstructions()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'sweater-instructions.txt'
  a.click()
  URL.revokeObjectURL(url)
}
