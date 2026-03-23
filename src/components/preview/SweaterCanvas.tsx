import { useSweaterStore } from '@/store/sweater-store'
import { useYarnStore } from '@/store/yarn-store'
import { useSweaterRenderer } from '@/hooks/useSweaterRenderer'

export function SweaterCanvas() {
  const geometry = useSweaterStore((s) => s.geometry)
  const slots    = useYarnStore((s) => s.slots)
  const catalog  = useYarnStore((s) => s.catalog)

  const slot1ColorId = slots[0].yarnColorId
  const slot1Color   = slot1ColorId
    ? (catalog.colors.find((c) => c.id === slot1ColorId)?.hex ?? null)
    : null

  const canvasRef = useSweaterRenderer({ geometry, slot1Color })

  return (
    <div className="sweater-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  )
}
