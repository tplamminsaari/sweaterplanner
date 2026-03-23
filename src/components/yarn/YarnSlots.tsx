import { useYarnStore } from '@/store/yarn-store'

export function YarnSlots() {
  const slots = useYarnStore((s) => s.slots)
  const activeSlotIndex = useYarnStore((s) => s.activeSlotIndex)
  const catalog = useYarnStore((s) => s.catalog)
  const setActiveSlotIndex = useYarnStore((s) => s.setActiveSlotIndex)
  const clearSlot = useYarnStore((s) => s.clearSlot)

  function handleSlotClick(index: number) {
    if (index === activeSlotIndex) {
      clearSlot(index)
    } else {
      setActiveSlotIndex(index)
    }
  }

  return (
    <div className="yarn-slots">
      {slots.map((slot) => {
        const color = slot.yarnColorId
          ? catalog.colors.find((c) => c.id === slot.yarnColorId)
          : null
        const isActive = slot.slotIndex === activeSlotIndex

        return (
          <button
            key={slot.slotIndex}
            className={`yarn-slot${isActive ? ' yarn-slot--active' : ''}`}
            title={
              color
                ? `Slot ${slot.slotIndex + 1}: ${color.name}${isActive ? ' (click to clear)' : ''}`
                : `Slot ${slot.slotIndex + 1}: empty`
            }
            onClick={() => handleSlotClick(slot.slotIndex)}
          >
            <span
              className="yarn-slot__swatch"
              style={color ? { background: color.hex } : undefined}
            />
            <span className="yarn-slot__number">{slot.slotIndex + 1}</span>
          </button>
        )
      })}
    </div>
  )
}
