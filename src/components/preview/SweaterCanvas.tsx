import { useMemo } from 'react'
import { useSweaterStore } from '@/store/sweater-store'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { useSweaterRenderer } from '@/hooks/useSweaterRenderer'

export function SweaterCanvas() {
  const geometry    = useSweaterStore((s) => s.geometry)
  const slots       = useYarnStore((s) => s.slots)
  const catalog     = useYarnStore((s) => s.catalog)
  const shirtTail   = usePatternStore((s) => s.shirtTail)
  const sleeveOpening = usePatternStore((s) => s.sleeveOpening)
  const yoke        = usePatternStore((s) => s.yoke)

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

  const canvasRef = useSweaterRenderer({ geometry, colorMap, patterns })

  return (
    <div className="sweater-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  )
}
