import type { SweaterSize, SweaterGeometry, PatternGrid } from '../types'
import { YOKE_START_STITCHES, YOKE_COLUMN_SKIP_SCHEDULE } from '../types'

const SCALE = 2.8  // px per cm

const RIBBING_CM = 5

// Per-size body height (shoulder to bottom hem, excluding yoke), in cm
const BODY_HEIGHT_CM: Record<SweaterSize, number> = {
  S: 38, M: 40, L: 42, XL: 44, XXL: 45, '3XL': 46, '4XL': 47,
}

// Per-size sleeve length (shoulder to wrist including ribbing), in cm
const SLEEVE_LENGTH_CM: Record<SweaterSize, number> = {
  S: 48, M: 50, L: 52, XL: 53, XXL: 54, '3XL': 55, '4XL': 56,
}

// Per-size sleeve width at upper arm (half-circumference, cm)
const SLEEVE_WIDTH_CM: Record<SweaterSize, number> = {
  S: 17, M: 19, L: 21, XL: 23, XXL: 25, '3XL': 27, '4XL': 29,
}

interface Gauge {
  stitchesPer10cm: number
  rowsPer10cm: number
}

interface Patterns {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
}

export function computeGeometry(
  size: SweaterSize,
  patterns: Patterns,
  gauge: Gauge,
): SweaterGeometry {
  const stitchesPerCm = gauge.stitchesPer10cm / 10
  const rowsPerCm     = gauge.rowsPer10cm / 10

  // Body width = half chest circumference (front view)
  const chestCircumferenceCm = YOKE_START_STITCHES[size] / stitchesPerCm
  const bodyWidthPx           = (chestCircumferenceCm / 2) * SCALE

  // Body height (below yoke)
  const bodyHeightPx = BODY_HEIGHT_CM[size] * SCALE

  // Yoke: all rows (row skipping for size is handled in useSweaterRenderer)
  const yokeRows = patterns.yoke.rows  // 56
  const yokeHeightPx = (yokeRows / rowsPerCm) * SCALE

  // Neckline: last skip entry gives 4 active cols per 12-col repeat
  const lastSkip   = YOKE_COLUMN_SKIP_SCHEDULE[YOKE_COLUMN_SKIP_SCHEDULE.length - 1]
  const activeNeckCols = patterns.yoke.cols - lastSkip.skippedCols.length  // 4 of 12
  const yokeRepeats    = YOKE_START_STITCHES[size] / patterns.yoke.cols
  const neckStitches   = activeNeckCols * yokeRepeats
  const neckCircumferenceCm = neckStitches / stitchesPerCm
  const yokeTopWidthPx = (neckCircumferenceCm / 2) * SCALE

  // Hem pattern + ribbing
  const shirtTailPatternHeightPx  = (patterns.shirtTail.rows / rowsPerCm) * SCALE
  const shirtTailRibbingHeightPx  = RIBBING_CM * SCALE

  // Sleeves
  const sleeveWidthPx                  = SLEEVE_WIDTH_CM[size] * SCALE
  const sleeveLengthPx                 = SLEEVE_LENGTH_CM[size] * SCALE
  const sleeveOpeningPatternHeightPx   = (patterns.sleeveOpening.rows / rowsPerCm) * SCALE
  const sleeveOpeningRibbingHeightPx   = RIBBING_CM * SCALE

  return {
    scale: SCALE,
    bodyWidthPx,
    bodyHeightPx,
    yokeBottomWidthPx: bodyWidthPx,
    yokeTopWidthPx,
    yokeHeightPx,
    neckRibbingHeightPx: RIBBING_CM * SCALE,
    shirtTailPatternHeightPx,
    shirtTailRibbingHeightPx,
    sleeveWidthPx,
    sleeveLengthPx,
    sleeveOpeningPatternHeightPx,
    sleeveOpeningRibbingHeightPx,
  }
}
