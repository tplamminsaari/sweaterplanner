import { useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

const LEFT_MIN = 180
const LEFT_MAX = 400
const RIGHT_MIN = 220
const RIGHT_MAX = 500

interface Props {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function ThreePanelLayout({ left, center, right }: Props) {
  const [leftWidth, setLeftWidth] = useState(260)
  const [rightWidth, setRightWidth] = useState(320)

  const dragRef = useRef<{
    side: 'left' | 'right'
    startX: number
    startWidth: number
  } | null>(null)

  const onDividerPointerDown = useCallback(
    (side: 'left' | 'right') => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      dragRef.current = {
        side,
        startX: e.clientX,
        startWidth: side === 'left' ? leftWidth : rightWidth,
      }
    },
    [leftWidth, rightWidth]
  )

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const { side, startX, startWidth } = dragRef.current
    const delta = e.clientX - startX
    if (side === 'left') {
      setLeftWidth(Math.min(LEFT_MAX, Math.max(LEFT_MIN, startWidth + delta)))
    } else {
      setRightWidth(Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, startWidth - delta)))
    }
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return (
    <div className="three-panel">
      <aside className="panel panel--left" style={{ width: leftWidth }}>
        {left}
      </aside>
      <div
        className="panel-divider"
        onPointerDown={onDividerPointerDown('left')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <main className="panel panel--center">{center}</main>
      <div
        className="panel-divider"
        onPointerDown={onDividerPointerDown('right')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <aside className="panel panel--right" style={{ width: rightWidth }}>
        {right}
      </aside>
    </div>
  )
}
