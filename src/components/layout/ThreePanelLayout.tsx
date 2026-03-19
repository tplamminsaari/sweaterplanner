import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function ThreePanelLayout({ left, center, right }: Props) {
  return (
    <div className="three-panel">
      <aside className="panel panel--left">{left}</aside>
      <main className="panel panel--center">{center}</main>
      <aside className="panel panel--right">{right}</aside>
    </div>
  )
}
