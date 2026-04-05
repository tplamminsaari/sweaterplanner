import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { PatternGrid, SweaterSize, DecreaseEntry } from '../types'
import { yokeInactiveColsForRow, YOKE_ROW_SKIP_SIZES, YOKE_START_STITCHES } from '../types'
import { deriveInactiveCells } from '../utils/yoke-decreases'

// ── Zone definitions ───────────────────────────────────────────
// Each zone is [x, y, w, h] as fractions of the 1000×1000 texture image.
// Derived from analysis of plan/assets/sweater-structure.png.
const Z = {
  neckRibbing:         [0.312, 0.063, 0.398, 0.041] as const,

  yoke:                [0.111, 0.104, 0.766, 0.260] as const,

  body:                [0.300, 0.364, 0.390, 0.469] as const,
  tailPattern:         [0.300, 0.833, 0.390, 0.031] as const,
  bodyRibbing:         [0.300, 0.864, 0.390, 0.069] as const,

  leftSleeve:          [0.111, 0.364, 0.189, 0.469] as const,
  leftSleevePattern:   [0.111, 0.833, 0.189, 0.031] as const,
  leftSleeveRibbing:   [0.111, 0.864, 0.189, 0.085] as const,

  rightSleeve:         [0.690, 0.364, 0.187, 0.469] as const,
  rightSleevePattern:  [0.690, 0.833, 0.187, 0.031] as const,
  rightSleeveRibbing:  [0.690, 0.864, 0.187, 0.085] as const,
}

const CANVAS_SIZE    = 280
const FALLBACK_COLOR = '#999999'

// ── Texture cache ──────────────────────────────────────────────
let textureCache: HTMLImageElement | null = null
let texturePromise: Promise<HTMLImageElement> | null = null

function loadTexture(): Promise<HTMLImageElement> {
  if (textureCache) return Promise.resolve(textureCache)
  if (!texturePromise) {
    texturePromise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload  = () => { textureCache = img; resolve(img) }
      img.onerror = reject
      img.src = '/sweater-texture.png'
    })
  }
  return texturePromise
}

// ── Pattern tiling ─────────────────────────────────────────────
/**
 * Tile a pattern grid over a rectangular zone using the current compositing
 * mode (expected to be 'multiply'). Every canvas pixel in the zone is filled
 * exactly once — no pixel receives two multiply operations.
 *
 * Cells are square (height-derived); the pattern tiles horizontally to fill
 * the zone width. Row 0 of the grid is drawn at the bottom of the zone.
 *
 * `inactiveColsFn` — optional; if provided, columns for which it returns
 * true are filled with baseColor regardless of the painted cell value.
 * Takes a 1-indexed row number, returns a set of 1-indexed inactive columns.
 */
function tilePatternZone(
  ctx: CanvasRenderingContext2D,
  grid: PatternGrid,
  colorMap: Record<number, string>,
  baseColor: string,
  zone: readonly [number, number, number, number],
  inactiveColsFn?: (row1indexed: number) => ReadonlySet<number>,
  skippedRows?: ReadonlySet<number>,
  additionalInactive?: ReadonlySet<string>,
) {
  if (grid.cols === 0 || grid.rows === 0) return

  const zx = zone[0] * CANVAS_SIZE
  const zy = zone[1] * CANVAS_SIZE
  const zw = zone[2] * CANVAS_SIZE
  const zh = zone[3] * CANVAS_SIZE

  const rows      = grid.rows
  const cols      = grid.cols
  // Fit cell height to zone; use square cells; tile to fill width
  const cellH     = zh / rows
  const repeats   = Math.max(1, Math.round(zw / Math.max(1, cellH * cols)))
  const totalCols = repeats * cols   // total column slots across the zone

  ctx.save()
  ctx.beginPath()
  ctx.rect(zx, zy, zw, zh)
  ctx.clip()

  for (let rep = 0; rep < repeats; rep++) {
    for (let c = 0; c < cols; c++) {
      const colIdx = rep * cols + c
      // Pixel-aligned x span — ensures no gaps and no overlap between cols
      const x1 = zx + Math.round(colIdx       * zw / totalCols)
      const x2 = zx + Math.round((colIdx + 1) * zw / totalCols)

      for (let r = 0; r < rows; r++) {
        // row 0 = bottom of knitting → canvas bottom
        const canvasRow = rows - 1 - r
        const y1 = zy + Math.round(canvasRow       * zh / rows)
        const y2 = zy + Math.round((canvasRow + 1) * zh / rows)

        const inactive = (skippedRows?.has(r + 1) ?? false)
          || (inactiveColsFn ? inactiveColsFn(r + 1).has(c + 1) : false)
          || (additionalInactive?.has(`${r + 1},${c + 1}`) ?? false)
        const slot     = inactive ? 0 : (grid.cells[r]?.[c] ?? 0)
        ctx.fillStyle  = slot > 0 ? (colorMap[slot] ?? baseColor) : baseColor
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      }
    }
  }

  ctx.restore()
}

// ── Yoke trapezoid shape ───────────────────────────────────────
/**
 * Three horizontal lines defining the yoke silhouette in the 1000×1000 texture.
 * Coordinates are fractions (pixel / 1000). Ordered top → bottom.
 *
 *   neckline:     (380,30)–(620,30)
 *   shoulderline: (195,120)–(800,120)
 *   yoke base:    (120,360)–(870,360)
 */
const YOKE_LINES = [
  { y: 0.030, xLeft: 0.380, xRight: 0.620 },
  { y: 0.120, xLeft: 0.195, xRight: 0.800 },
  { y: 0.360, xLeft: 0.120, xRight: 0.870 },
] as const

/** Piecewise-linear interpolation: returns [xLeft, xRight] at texture y-fraction. */
function yokeWidthAt(y: number): [number, number] {
  if (y <= YOKE_LINES[0].y) return [YOKE_LINES[0].xLeft, YOKE_LINES[0].xRight]
  const last = YOKE_LINES[YOKE_LINES.length - 1]
  if (y >= last.y) return [last.xLeft, last.xRight]
  for (let i = 0; i < YOKE_LINES.length - 1; i++) {
    const lo = YOKE_LINES[i]
    const hi = YOKE_LINES[i + 1]
    if (y >= lo.y && y <= hi.y) {
      const t = (y - lo.y) / (hi.y - lo.y)
      return [lo.xLeft + t * (hi.xLeft - lo.xLeft), lo.xRight + t * (hi.xRight - lo.xRight)]
    }
  }
  return [last.xLeft, last.xRight]
}

/**
 * Tile the yoke pattern over a trapezoidal zone.
 *
 * For each row the visible x-span is derived from `yokeWidthAt`, so the pattern
 * correctly narrows toward the neck. Inactive columns (decreased away) take zero
 * pixel width — only active columns are distributed across the row's span.
 * Skipped rows are filled solid with baseColor (they exist in the fabric but not
 * in the pattern for this size).
 */
function tileYokeZone(
  ctx: CanvasRenderingContext2D,
  grid: PatternGrid,
  colorMap: Record<number, string>,
  baseColor: string,
  zone: readonly [number, number, number, number],
  repeats: number,
  inactiveColsFn?: (row1: number) => ReadonlySet<number>,
  skippedRows?: ReadonlySet<number>,
  additionalInactive?: ReadonlySet<string>,
) {
  if (grid.cols === 0 || grid.rows === 0) return
  const zy   = zone[1] * CANVAS_SIZE
  const zh   = zone[3] * CANVAS_SIZE
  const rows = grid.rows
  const cols = grid.cols

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, zy, CANVAS_SIZE, zh)
  ctx.clip()

  for (let r = 0; r < rows; r++) {
    const row1      = r + 1
    const canvasRow = rows - 1 - r          // 0 = top of zone (towards neck)
    const y1 = zy + Math.round(canvasRow       * zh / rows)
    const y2 = zy + Math.round((canvasRow + 1) * zh / rows)
    if (y2 <= y1) continue

    // Texture y at the vertical centre of this row
    const yTex = zone[1] + (canvasRow + 0.5) * zone[3] / rows
    const [xL, xR] = yokeWidthAt(yTex)
    const rowLeft  = xL * CANVAS_SIZE
    const rowRight = xR * CANVAS_SIZE
    const rowWidth = rowRight - rowLeft

    // Skipped rows: fill solid with base colour and continue
    if (skippedRows?.has(row1)) {
      ctx.fillStyle = baseColor
      ctx.fillRect(Math.round(rowLeft), y1, Math.round(rowWidth), y2 - y1)
      continue
    }

    // Collect active column indices for this row
    const inactiveCols = inactiveColsFn ? inactiveColsFn(row1) : new Set<number>()
    const activeColsInRepeat: number[] = []
    for (let c = 0; c < cols; c++) {
      if (!inactiveCols.has(c + 1) && !(additionalInactive?.has(`${row1},${c + 1}`))) {
        activeColsInRepeat.push(c)
      }
    }

    const totalActive = activeColsInRepeat.length * repeats
    if (totalActive === 0) {
      ctx.fillStyle = baseColor
      ctx.fillRect(Math.round(rowLeft), y1, Math.round(rowWidth), y2 - y1)
      continue
    }

    let idx = 0
    for (let rep = 0; rep < repeats; rep++) {
      for (const c of activeColsInRepeat) {
        const x1 = Math.round(rowLeft + idx       * rowWidth / totalActive)
        const x2 = Math.round(rowLeft + (idx + 1) * rowWidth / totalActive)
        idx++
        const slot = grid.cells[r]?.[c] ?? 0
        ctx.fillStyle = slot > 0 ? (colorMap[slot] ?? baseColor) : baseColor
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      }
    }
  }

  ctx.restore()
}

// ── Solid zone fill ────────────────────────────────────────────
function fillZone(
  ctx: CanvasRenderingContext2D,
  zone: readonly [number, number, number, number],
  color: string,
) {
  ctx.fillStyle = color
  ctx.fillRect(
    zone[0] * CANVAS_SIZE,
    zone[1] * CANVAS_SIZE,
    zone[2] * CANVAS_SIZE,
    zone[3] * CANVAS_SIZE,
  )
}

// ── Public interface ───────────────────────────────────────────
interface Patterns {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
}

interface UseSweaterRendererOptions {
  colorMap: Record<number, string>   // slotIndex (1-based) → hex
  patterns: Patterns
  size: SweaterSize
  yokeDecreaseSchedule?: DecreaseEntry[]
}

export function useSweaterRenderer(
  options: UseSweaterRendererOptions,
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { colorMap, patterns, size, yokeDecreaseSchedule } = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width  = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const baseColor = colorMap[1] ?? FALLBACK_COLOR

    // Rows (1-indexed) skipped for the active size
    const yokeSkippedRows = new Set<number>(
      Object.entries(YOKE_ROW_SKIP_SIZES)
        .filter(([, sizes]) => sizes?.includes(size))
        .map(([row]) => Number(row))
    )

    // Cells made inactive by the user-defined decrease schedule
    const yokeUserDecreased = yokeDecreaseSchedule && yokeDecreaseSchedule.length > 0
      ? deriveInactiveCells(yokeDecreaseSchedule, patterns.yoke.rows)
      : undefined

    function render(texture: HTMLImageElement) {
      // 1. Dark background
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.fillStyle = '#1a1a1e'
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // 2. Knit texture (alpha channel clips it to the sweater silhouette)
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.drawImage(texture, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // 3. Tint each zone via multiply — every pixel receives exactly one
      //    multiply operation so colors don't compound.
      ctx!.globalCompositeOperation = 'multiply'

      // Solid zones (single color, no pattern)
      fillZone(ctx!, Z.neckRibbing,  baseColor)
      fillZone(ctx!, Z.body,         baseColor)
      fillZone(ctx!, Z.bodyRibbing,  baseColor)
      fillZone(ctx!, Z.leftSleeve,   baseColor)
      fillZone(ctx!, Z.leftSleeveRibbing,  baseColor)
      fillZone(ctx!, Z.rightSleeve,  baseColor)
      fillZone(ctx!, Z.rightSleeveRibbing, baseColor)

      // Yoke — trapezoidal tiling: x-span narrows per row via control lines,
      // inactive (decreased) columns take zero pixel width.
      const yokeRepeats = Math.max(1, Math.round(YOKE_START_STITCHES[size] / patterns.yoke.cols))
      tileYokeZone(ctx!, patterns.yoke, colorMap, baseColor,
        Z.yoke, yokeRepeats, yokeInactiveColsForRow, yokeSkippedRows, yokeUserDecreased)

      tilePatternZone(ctx!, patterns.shirtTail, colorMap, baseColor,
        Z.tailPattern)

      tilePatternZone(ctx!, patterns.sleeveOpening, colorMap, baseColor,
        Z.leftSleevePattern)

      tilePatternZone(ctx!, patterns.sleeveOpening, colorMap, baseColor,
        Z.rightSleevePattern)

      // 4. Reset composite mode
      ctx!.globalCompositeOperation = 'source-over'
    }

    loadTexture().then(render).catch(() => {
      ctx!.fillStyle = baseColor
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    })
  }, [colorMap, patterns, size, yokeDecreaseSchedule])

  return canvasRef
}
