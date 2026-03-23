import type { YarnColor } from '@/types'
import { useYarnStore } from '@/store/yarn-store'

interface Props {
  colors: YarnColor[]
}

export function ColorPalette({ colors }: Props) {
  const activeSlotIndex = useYarnStore((s) => s.activeSlotIndex)
  const slots = useYarnStore((s) => s.slots)
  const assignColorToSlot = useYarnStore((s) => s.assignColorToSlot)

  if (colors.length === 0) return null

  const activeColorId = slots[activeSlotIndex].yarnColorId

  return (
    <div className="color-palette">
      {colors.map((color) => (
        <button
          key={color.id}
          className={`color-swatch${color.id === activeColorId ? ' color-swatch--active' : ''}`}
          style={{ '--swatch-color': color.hex } as React.CSSProperties}
          title={`${color.name} (${color.colorCode})`}
          onClick={() => assignColorToSlot(activeSlotIndex, color.id)}
        />
      ))}
    </div>
  )
}
