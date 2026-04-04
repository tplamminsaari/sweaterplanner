import { useMemo, useRef, useState, useCallback } from 'react'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { useSweaterStore } from '@/store/sweater-store'
import { useSweaterRenderer } from '@/hooks/useSweaterRenderer'
import type { PatternGrid } from '@/types'

const CANVAS_PX = 280
const ZOOM_MIN  = 1
const ZOOM_MAX  = 5

export function SweaterCanvas() {
  const slots         = useYarnStore((s) => s.slots)
  const catalog       = useYarnStore((s) => s.catalog)
  const shirtTail     = usePatternStore((s) => s.shirtTail)
  const sleeveOpening = usePatternStore((s) => s.sleeveOpening)
  const yoke          = usePatternStore((s) => s.yoke)
  const isDrawing     = usePatternStore((s) => s.isDrawing)
  const size          = useSweaterStore((s) => s.size)

  const colorMap = useMemo(() => {
    const map: Record<number, string> = {}
    for (const slot of slots) {
      if (slot.yarnColorId) {
        const color = catalog.colors.find((c) => c.id === slot.yarnColorId)
        if (color) map[slot.slotIndex + 1] = color.hex
      }
    }
    return map
  }, [slots, catalog.colors])

  const patterns = useMemo(
    () => ({ shirtTail, sleeveOpening, yoke }),
    [shirtTail, sleeveOpening, yoke],
  )

  // Freeze patterns passed to the renderer while the user is actively drawing
  // so the expensive texture re-render runs only once per completed stroke.
  const frozenPatternsRef = useRef<{ shirtTail: PatternGrid; sleeveOpening: PatternGrid; yoke: PatternGrid }>(patterns)
  if (!isDrawing) {
    frozenPatternsRef.current = patterns
  }

  const canvasRef = useSweaterRenderer({ colorMap, patterns: frozenPatternsRef.current, size })

  // ── Zoom / pan state ──────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan ] = useState({ x: 0, y: 0 })

  // Active pointers for pinch detection
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  // Drag start snapshot
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  // Last pinch distance
  const lastPinchRef = useRef<number | null>(null)

  const clampPan = useCallback((px: number, py: number, z: number) => {
    const ww = wrapperRef.current?.clientWidth  ?? CANVAS_PX
    const wh = wrapperRef.current?.clientHeight ?? CANVAS_PX
    const maxX = Math.max(0, CANVAS_PX * z / 2 - ww / 2)
    const maxY = Math.max(0, CANVAS_PX * z / 2 - wh / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    }
  }, [])

  // Zoom centred on a point (wrapper-relative, measured from wrapper centre)
  const applyZoom = useCallback((newZoom: number, cx: number, cy: number) => {
    newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom))
    setZoom(prev => {
      const scale = newZoom / prev
      setPan(prevPan => {
        const nx = cx * (1 - scale) + prevPan.x * scale
        const ny = cy * (1 - scale) + prevPan.y * scale
        return clampPan(nx, ny, newZoom)
      })
      return newZoom
    })
  }, [clampPan])

  // ── Wheel zoom ────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = wrapperRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left - rect.width  / 2
    const cy = e.clientY - rect.top  - rect.height / 2
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    applyZoom(zoom * factor, cx, cy)
  }, [zoom, applyZoom])

  // ── Pointer events (drag + pinch) ─────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    wrapperRef.current!.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        startX: e.clientX, startY: e.clientY,
        startPanX: pan.x,  startPanY: pan.y,
      }
      lastPinchRef.current = null
    } else {
      // Second finger down — switch to pinch, stop drag
      dragRef.current = null
    }
  }, [pan])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pointers = [...pointersRef.current.values()]

    if (pointers.length === 2) {
      // Pinch zoom
      const dx = pointers[0].x - pointers[1].x
      const dy = pointers[0].y - pointers[1].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (lastPinchRef.current !== null) {
        const rect = wrapperRef.current!.getBoundingClientRect()
        const midX = (pointers[0].x + pointers[1].x) / 2 - rect.left - rect.width  / 2
        const midY = (pointers[0].y + pointers[1].y) / 2 - rect.top  - rect.height / 2
        applyZoom(zoom * dist / lastPinchRef.current, midX, midY)
      }
      lastPinchRef.current = dist
    } else if (pointers.length === 1 && dragRef.current) {
      // Pan drag
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPan(clampPan(dragRef.current.startPanX + dx, dragRef.current.startPanY + dy, zoom))
    }
  }, [zoom, applyZoom, clampPan])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) lastPinchRef.current = null
    if (pointersRef.current.size === 0) dragRef.current = null
  }, [])

  // ── Reset ─────────────────────────────────────────────────────
  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const isDragging = zoom > 1
  const isZoomed   = zoom > 1.01

  return (
    <div
      ref={wrapperRef}
      className="sweater-canvas-wrapper"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={resetZoom}
      style={{ cursor: isDragging ? 'grab' : 'default', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          userSelect: 'none',
        }}
      />
      {isZoomed && (
        <button
          className="zoom-reset-btn"
          onClick={resetZoom}
          title="Reset zoom (or double-click)"
        >
          ×{zoom.toFixed(1)}
        </button>
      )}
    </div>
  )
}
