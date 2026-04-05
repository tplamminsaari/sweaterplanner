// ─── Yarn catalog ─────────────────────────────────────────────────────────────

export interface Brand {
  id: string
  name: string
  logoUrl?: string
}

export interface YarnType {
  id: string
  brandId: string
  name: string
  weightGrams: number       // skein weight in grams
  metersPerWeight: number   // meters per skein
  stitchesPer10cm: number   // gauge, e.g. 18 for Léttlopi on 4.5mm needles
  rowsPer10cm: number
  needleSizeMm: number      // recommended needle diameter
}

export interface YarnColor {
  id: string
  yarnTypeId: string
  colorCode: string   // manufacturer code, e.g. "0005"
  name: string        // e.g. "Black"
  hex: string         // display color, e.g. "#1a1a1a"
}

// ─── Yarn selection (user state) ──────────────────────────────────────────────

export interface YarnSlot {
  slotIndex: number         // 0–4
  yarnColorId: string | null
}

export interface SelectedYarns {
  slots: [YarnSlot, YarnSlot, YarnSlot, YarnSlot, YarnSlot]
  activeSlotIndex: number
}

// ─── Pattern grid ─────────────────────────────────────────────────────────────

export type PatternArea = 'shirtTail' | 'sleeveOpening' | 'yoke'

export type DrawingTool = 'freehand' | 'line' | 'eraser'

export interface PatternGrid {
  area: PatternArea
  cols: number        // width — the repeating stitch unit
  rows: number        // height — number of knitting rows
  cells: number[][]   // [row][col], value = slotIndex (1–5) or 0 = empty
                      // cells[0] = bottom row of knitting
}

export interface PatternConfig {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
  activeArea: PatternArea
  activeDrawingTool: DrawingTool
}

// ─── Sweater sizes & stitch counts ────────────────────────────────────────────

export type SweaterSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | '4XL'

/** Body stitch count at cast-on (after bottom ribbing). Increments of +12. */
export const SHIRT_TAIL_STITCHES: Record<SweaterSize, number> = {
  S: 160, M: 172, L: 184, XL: 196, XXL: 208, '3XL': 220, '4XL': 232,
}

/** Stitch count at yoke start (adjusted to nearest multiple of 12). */
export const YOKE_START_STITCHES: Record<SweaterSize, number> = {
  S: 168, M: 180, L: 192, XL: 204, XXL: 216, '3XL': 228, '4XL': 240,
}

// ─── User-defined yoke decrease entry ────────────────────────────────────────

/** A user-defined column decrease in the yoke repeat. */
export interface DecreaseEntry {
  /** 1-indexed column within the 12-stitch repeat. */
  col: number
  /** 1-indexed row; this column is inactive from fromRow upward. */
  fromRow: number
}

// ─── Yoke column skip schedule ────────────────────────────────────────────────

export interface YokeColumnSkipEntry {
  /** At and above this row (1-indexed), the listed columns become inactive. */
  fromRow: number
  /** 1-indexed column numbers that are skipped from this row upward. */
  skippedCols: number[]
}

/**
 * Predefined decrease schedule for the 12-stitch yoke repeat.
 * Each entry is cumulative — skippedCols lists ALL inactive columns at that band,
 * not just the newly skipped ones.
 */
export const YOKE_COLUMN_SKIP_SCHEDULE: YokeColumnSkipEntry[] = [
  { fromRow: 22, skippedCols: [4, 10] },
  { fromRow: 37, skippedCols: [3, 4, 10, 11] },
  { fromRow: 44, skippedCols: [1, 3, 4, 10, 11] },
  { fromRow: 48, skippedCols: [1, 3, 4, 10, 11, 12] },
  { fromRow: 52, skippedCols: [1, 2, 3, 4, 10, 11, 12] },
  { fromRow: 55, skippedCols: [1, 2, 3, 4, 9, 10, 11, 12] },
]

/**
 * Returns the set of inactive (skipped) 1-indexed column numbers for a given
 * 1-indexed row in the yoke grid.
 */
export function yokeInactiveColsForRow(row: number): ReadonlySet<number> {
  let skipped: number[] = []
  for (const entry of YOKE_COLUMN_SKIP_SCHEDULE) {
    if (row >= entry.fromRow) skipped = entry.skippedCols
  }
  return new Set(skipped)
}

/**
 * Sizes on which each yoke row (1-indexed) is skipped (not knitted).
 * Rows absent from this map are knitted in all sizes.
 */
export const YOKE_ROW_SKIP_SIZES: Partial<Record<number, SweaterSize[]>> = {
  2:  ['S', 'M', 'L', 'XL', '3XL'],
  3:  ['S', 'M', 'L'],
  11: ['S', 'M'],
  25: ['S'],
  32: ['S', 'M', 'L', 'XL'],
  39: ['S'],
  47: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  50: ['S', 'M', 'L', 'XL', 'XXL'],
  53: ['S', 'M', 'L'],
}

// ─── Sweater measurements ─────────────────────────────────────────────────────

export interface SweaterMeasurements {
  size: SweaterSize
  chestCircumferenceCm: number   // derived: YOKE_START_STITCHES[size] / stitchesPerCm
  bodyLengthCm: number           // neck to bottom hem
  yokeHeightCm: number           // active rows / rowsPerCm
  sleeveLength: number           // shoulder to wrist in cm
  neckCircumferenceCm: number    // derived: 4 active cols × repeats / stitchesPerCm
  stitchesPerCm: number          // from yarn gauge (Léttlopi: 1.8 sts/cm)
}

// ─── Sweater geometry (derived, for 2D preview) ───────────────────────────────

export interface SweaterGeometry {
  scale: number                        // pixels per cm
  // Body
  bodyWidthPx: number                  // chest circumference / 2 (front view only)
  bodyHeightPx: number
  // Yoke (stepped trapezoid)
  yokeBottomWidthPx: number            // = bodyWidthPx
  yokeTopWidthPx: number               // neckline width
  yokeHeightPx: number
  neckRibbingHeightPx: number          // 5 cm fixed
  // Hem
  shirtTailPatternHeightPx: number     // patternGrid.rows / rowsPerCm × scale
  shirtTailRibbingHeightPx: number
  // Sleeves
  sleeveWidthPx: number
  sleeveLengthPx: number
  sleeveOpeningPatternHeightPx: number
  sleeveOpeningRibbingHeightPx: number // 5 cm fixed
}

// ─── Yarn estimation ──────────────────────────────────────────────────────────

export interface YarnEstimate {
  slotIndex: number
  colorName: string
  estimatedGrams: number
  estimatedSkeins: number
}

// ─── Project export / import ──────────────────────────────────────────────────

export interface ProjectExport {
  version: string       // schema version for future migration
  exportedAt: string    // ISO timestamp
  yarns: {
    slots: [YarnSlot, YarnSlot, YarnSlot, YarnSlot, YarnSlot]
  }
  patterns: {
    shirtTail: PatternGrid
    sleeveOpening: PatternGrid
    yoke: PatternGrid
    yokeDecreaseSchedule: DecreaseEntry[]
    yokeColorBackup: Record<string, number>
  }
  sweater: {
    size: SweaterSize
  }
}
