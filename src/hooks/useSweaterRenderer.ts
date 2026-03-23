import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { SweaterGeometry } from '../types'

const BG = '#1a1a1e'
const FALLBACK_COLOR = '#4a4a5a'

interface UseSweaterRendererOptions {
  geometry: SweaterGeometry
  slot1Color: string | null  // main body color (hex or null)
}

export function useSweaterRenderer(
  options: UseSweaterRendererOptions,
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { geometry: g, slot1Color } = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bodyColor = slot1Color ?? FALLBACK_COLOR

    // Layout: sleeves flank the body horizontally, all bottoms aligned
    const totalWidth  = g.sleeveWidthPx + g.bodyWidthPx + g.sleeveWidthPx
    const bodyTotalH  = g.bodyHeightPx + g.yokeHeightPx + g.neckRibbingHeightPx
    const sleeveTop   = bodyTotalH - g.sleeveLengthPx  // sleeves hang from shoulder level
    const totalHeight = Math.max(bodyTotalH, sleeveTop + g.sleeveLengthPx)

    const PAD = 12
    canvas.width  = Math.ceil(totalWidth  + PAD * 2)
    canvas.height = Math.ceil(totalHeight + PAD * 2)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const ox = PAD  // origin x
    const oy = PAD  // origin y

    const bodyX = ox + g.sleeveWidthPx
    const bodyY = oy

    // ── Left sleeve ──────────────────────────────────────────────
    ctx.fillStyle = bodyColor
    ctx.fillRect(ox, oy + sleeveTop, g.sleeveWidthPx, g.sleeveLengthPx)

    // ── Right sleeve ─────────────────────────────────────────────
    ctx.fillStyle = bodyColor
    ctx.fillRect(bodyX + g.bodyWidthPx, oy + sleeveTop, g.sleeveWidthPx, g.sleeveLengthPx)

    // ── Body (below yoke) ─────────────────────────────────────────
    ctx.fillStyle = bodyColor
    ctx.fillRect(bodyX, bodyY + g.yokeHeightPx + g.neckRibbingHeightPx, g.bodyWidthPx, g.bodyHeightPx)

    // ── Yoke (stepped trapezoid) ──────────────────────────────────
    drawYoke(ctx, bodyX, bodyY + g.neckRibbingHeightPx, g, bodyColor)

    // ── Neck ribbing ──────────────────────────────────────────────
    const neckX = bodyX + (g.bodyWidthPx - g.yokeTopWidthPx) / 2
    ctx.fillStyle = bodyColor
    ctx.fillRect(neckX, bodyY, g.yokeTopWidthPx, g.neckRibbingHeightPx)

  }, [g, slot1Color])

  return canvasRef
}

/** Draw yoke as a stepped trapezoid matching YOKE_COLUMN_SKIP_SCHEDULE width bands. */
function drawYoke(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  g: SweaterGeometry,
  color: string,
) {
  // Each band's fractional width relative to full (12 active cols out of 12)
  const bands: { fromFrac: number; activeFrac: number }[] = [
    { fromFrac: 0,         activeFrac: 12 / 12 },  // rows 1–21
    { fromFrac: 21 / 56,   activeFrac: 10 / 12 },  // rows 22–36
    { fromFrac: 36 / 56,   activeFrac:  8 / 12 },  // rows 37–43
    { fromFrac: 43 / 56,   activeFrac:  7 / 12 },  // rows 44–47
    { fromFrac: 47 / 56,   activeFrac:  6 / 12 },  // rows 48–51
    { fromFrac: 51 / 56,   activeFrac:  5 / 12 },  // rows 52–54
    { fromFrac: 54 / 56,   activeFrac:  4 / 12 },  // rows 55–56
  ]

  ctx.fillStyle = color

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i]
    const nextFrom = i + 1 < bands.length ? bands[i + 1].fromFrac : 1
    const bandHeightFrac = nextFrom - band.fromFrac
    const bandH   = bandHeightFrac * g.yokeHeightPx
    // y: row 0 = bottom of yoke, so band 0 (rows 1-21) is at the bottom
    const bandY   = bottomY - (band.fromFrac + bandHeightFrac) * g.yokeHeightPx
    const bandW   = band.activeFrac * g.yokeBottomWidthPx
    const bandX   = x + (g.yokeBottomWidthPx - bandW) / 2

    ctx.fillRect(Math.round(bandX), Math.round(bandY), Math.round(bandW), Math.ceil(bandH))
  }
}
