import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { SweaterGeometry, PatternGrid } from '../types'
import { yokeInactiveColsForRow } from '../types'

const BG            = '#1a1a1e'
const FALLBACK_COLOR = '#4a4a5a'

// Yoke band definitions derived from YOKE_COLUMN_SKIP_SCHEDULE
const YOKE_BANDS: { fromFrac: number; activeFrac: number }[] = [
  { fromFrac: 0,         activeFrac: 12 / 12 },
  { fromFrac: 21 / 56,   activeFrac: 10 / 12 },
  { fromFrac: 36 / 56,   activeFrac:  8 / 12 },
  { fromFrac: 43 / 56,   activeFrac:  7 / 12 },
  { fromFrac: 47 / 56,   activeFrac:  6 / 12 },
  { fromFrac: 51 / 56,   activeFrac:  5 / 12 },
  { fromFrac: 54 / 56,   activeFrac:  4 / 12 },
]

interface Patterns {
  shirtTail: PatternGrid
  sleeveOpening: PatternGrid
  yoke: PatternGrid
}

interface UseSweaterRendererOptions {
  geometry: SweaterGeometry
  colorMap: Record<number, string>  // slotIndex (1-based) → hex
  patterns: Patterns
}

export function useSweaterRenderer(
  options: UseSweaterRendererOptions,
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { geometry: g, colorMap, patterns } = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bodyColor = colorMap[1] ?? FALLBACK_COLOR

    const PAD         = 12
    const totalWidth  = g.sleeveWidthPx + g.bodyWidthPx + g.sleeveWidthPx
    const bodyTotalH  = g.bodyHeightPx + g.yokeHeightPx + g.neckRibbingHeightPx
    const sleeveTop   = bodyTotalH - g.sleeveLengthPx
    const totalHeight = Math.max(bodyTotalH, sleeveTop + g.sleeveLengthPx)

    canvas.width  = Math.ceil(totalWidth  + PAD * 2)
    canvas.height = Math.ceil(totalHeight + PAD * 2)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const ox    = PAD
    const oy    = PAD
    const bodyX = ox + g.sleeveWidthPx
    const bodyY = oy

    // ── Body base (below yoke) ────────────────────────────────────
    const bodyBaseY = bodyY + g.yokeHeightPx + g.neckRibbingHeightPx
    ctx.fillStyle = bodyColor
    ctx.fillRect(bodyX, bodyBaseY, g.bodyWidthPx, g.bodyHeightPx)

    // ── Shirt tail pattern (above hem ribbing) ────────────────────
    const hemPatternY = bodyBaseY + g.bodyHeightPx
                        - g.shirtTailRibbingHeightPx
                        - g.shirtTailPatternHeightPx
    drawTiledPattern(ctx, patterns.shirtTail, colorMap, bodyColor,
      bodyX, hemPatternY, g.bodyWidthPx, g.shirtTailPatternHeightPx)

    // ── Hem ribbing ───────────────────────────────────────────────
    ctx.fillStyle = bodyColor
    ctx.fillRect(bodyX, bodyBaseY + g.bodyHeightPx - g.shirtTailRibbingHeightPx,
      g.bodyWidthPx, g.shirtTailRibbingHeightPx)

    // ── Left sleeve ───────────────────────────────────────────────
    ctx.fillStyle = bodyColor
    ctx.fillRect(ox, oy + sleeveTop, g.sleeveWidthPx, g.sleeveLengthPx)

    // sleeve opening pattern (above sleeve ribbing)
    const sleevePatternY = oy + sleeveTop + g.sleeveLengthPx
                           - g.sleeveOpeningRibbingHeightPx
                           - g.sleeveOpeningPatternHeightPx
    drawTiledPattern(ctx, patterns.sleeveOpening, colorMap, bodyColor,
      ox, sleevePatternY, g.sleeveWidthPx, g.sleeveOpeningPatternHeightPx)

    // sleeve ribbing
    ctx.fillStyle = bodyColor
    ctx.fillRect(ox, oy + sleeveTop + g.sleeveLengthPx - g.sleeveOpeningRibbingHeightPx,
      g.sleeveWidthPx, g.sleeveOpeningRibbingHeightPx)

    // ── Right sleeve ──────────────────────────────────────────────
    const rightSleeveX = bodyX + g.bodyWidthPx
    ctx.fillStyle = bodyColor
    ctx.fillRect(rightSleeveX, oy + sleeveTop, g.sleeveWidthPx, g.sleeveLengthPx)

    drawTiledPattern(ctx, patterns.sleeveOpening, colorMap, bodyColor,
      rightSleeveX, sleevePatternY, g.sleeveWidthPx, g.sleeveOpeningPatternHeightPx)

    ctx.fillStyle = bodyColor
    ctx.fillRect(rightSleeveX,
      oy + sleeveTop + g.sleeveLengthPx - g.sleeveOpeningRibbingHeightPx,
      g.sleeveWidthPx, g.sleeveOpeningRibbingHeightPx)

    // ── Yoke (stepped trapezoid with pattern) ─────────────────────
    const yokeBottomY = bodyY + g.neckRibbingHeightPx + g.yokeHeightPx
    drawYokePattern(ctx, patterns.yoke, colorMap, bodyColor,
      bodyX, yokeBottomY, g)

    // ── Neck ribbing ──────────────────────────────────────────────
    const neckX = bodyX + (g.bodyWidthPx - g.yokeTopWidthPx) / 2
    ctx.fillStyle = bodyColor
    ctx.fillRect(neckX, bodyY, g.yokeTopWidthPx, g.neckRibbingHeightPx)

  }, [g, colorMap, patterns])

  return canvasRef
}

/**
 * Tile a pattern grid horizontally across a rectangular area.
 * Cells with value 0 show the baseColor. Row 0 = bottom of pattern.
 */
function drawTiledPattern(
  ctx: CanvasRenderingContext2D,
  grid: PatternGrid,
  colorMap: Record<number, string>,
  baseColor: string,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
) {
  if (grid.cols === 0 || grid.rows === 0) return

  const cellW = areaW / Math.round(areaW / (areaW / grid.cols))
  // cellW = areaW / (number of full repeats * cols)
  // Simpler: fit as many full repeats as possible, stretch to fill exactly
  const repeats  = Math.max(1, Math.round(areaW / (areaH / grid.rows * grid.cols)))
  const cellWpx  = areaW / (repeats * grid.cols)
  const cellHpx  = areaH / grid.rows

  void cellW  // suppress unused warning

  for (let rep = 0; rep < repeats; rep++) {
    for (let r = 0; r < grid.rows; r++) {
      // row 0 = bottom → drawn at bottom of area
      const canvasRow = grid.rows - 1 - r
      const y = areaY + canvasRow * cellHpx
      for (let c = 0; c < grid.cols; c++) {
        const x = areaX + (rep * grid.cols + c) * cellWpx
        const slot = grid.cells[r]?.[c] ?? 0
        ctx.fillStyle = slot > 0 ? (colorMap[slot] ?? baseColor) : baseColor
        ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(cellWpx), Math.ceil(cellHpx))
      }
    }
  }
}

/**
 * Draw the yoke as a stepped trapezoid, rendering each band's
 * pattern rows tiled horizontally at the appropriate width.
 */
function drawYokePattern(
  ctx: CanvasRenderingContext2D,
  grid: PatternGrid,
  colorMap: Record<number, string>,
  baseColor: string,
  bodyX: number,
  yokeBottomY: number,
  g: SweaterGeometry,
) {
  const totalRows = grid.rows  // 56

  for (let bandIdx = 0; bandIdx < YOKE_BANDS.length; bandIdx++) {
    const band     = YOKE_BANDS[bandIdx]
    const nextFrom = bandIdx + 1 < YOKE_BANDS.length
      ? YOKE_BANDS[bandIdx + 1].fromFrac : 1
    const bandHeightFrac = nextFrom - band.fromFrac
    const bandH   = bandHeightFrac * g.yokeHeightPx
    const bandW   = band.activeFrac * g.yokeBottomWidthPx
    const bandX   = bodyX + (g.yokeBottomWidthPx - bandW) / 2
    // row 0 = bottom → band 0 is at the bottom of the yoke
    const bandY   = yokeBottomY - (band.fromFrac + bandHeightFrac) * g.yokeHeightPx

    // Fill base color first
    ctx.fillStyle = baseColor
    ctx.fillRect(Math.round(bandX), Math.round(bandY),
      Math.round(bandW), Math.ceil(bandH))

    // Grid rows that fall in this band (1-indexed)
    const rowStart = Math.round(band.fromFrac * totalRows) + 1
    const rowEnd   = Math.round((band.fromFrac + bandHeightFrac) * totalRows)
    const bandRows = rowEnd - rowStart + 1
    if (bandRows <= 0) continue

    const cellHpx = bandH / bandRows

    // How many 12-col repeats fit at this band width
    const activeColsThisBand = Math.round(band.activeFrac * grid.cols)
    const repeats = Math.max(1, Math.round(bandW / (cellHpx * activeColsThisBand)))
    const cellWpx = bandW / (repeats * activeColsThisBand)

    // Build active column list for a representative row in this band
    const inactiveCols = yokeInactiveColsForRow(rowStart)

    let repColIdx = 0
    for (let rep = 0; rep < repeats; rep++) {
      for (let c = 1; c <= grid.cols; c++) {
        if (inactiveCols.has(c)) continue
        const x = Math.round(bandX + repColIdx * cellWpx)
        repColIdx++

        for (let r = rowStart; r <= rowEnd; r++) {
          // row 0 = bottom; in canvas, higher row index = higher on canvas = lower y
          const canvasRowInBand = rowEnd - r  // 0 = top of band
          const y = Math.round(bandY + canvasRowInBand * cellHpx)
          const slot = grid.cells[r - 1]?.[c - 1] ?? 0
          ctx.fillStyle = slot > 0 ? (colorMap[slot] ?? baseColor) : baseColor
          ctx.fillRect(x, y, Math.ceil(cellWpx), Math.ceil(cellHpx))
        }
      }
      repColIdx = rep === 0 ? repColIdx : repColIdx  // reset per-rep
      if (rep < repeats - 1) repColIdx = (rep + 1) * activeColsThisBand
    }
  }
}
