import { useMemo } from 'react'
import { useSweaterStore } from '@/store/sweater-store'
import { useYarnStore } from '@/store/yarn-store'
import { usePatternStore } from '@/store/pattern-store'
import { estimateYarn } from '@/utils/yarn-estimation'

export function YarnEstimation() {
  const size    = useSweaterStore((s) => s.size)
  const slots   = useYarnStore((s) => s.slots)
  const catalog = useYarnStore((s) => s.catalog)
  const shirtTail     = usePatternStore((s) => s.shirtTail)
  const sleeveOpening = usePatternStore((s) => s.sleeveOpening)
  const yoke          = usePatternStore((s) => s.yoke)

  const estimates = useMemo(
    () => estimateYarn(size, { shirtTail, sleeveOpening, yoke }, slots, catalog),
    [size, shirtTail, sleeveOpening, yoke, slots, catalog],
  )

  const withPaint = estimates.filter((e) => e.estimatedGrams > 0)
  if (withPaint.length === 0) return null

  return (
    <div className="yarn-estimation">
      <p className="yarn-estimation__title">Yarn estimate</p>
      <table className="yarn-estimation__table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>Color</th>
            <th>g</th>
            <th>skeins</th>
          </tr>
        </thead>
        <tbody>
          {withPaint.map((e) => {
            const color = slots[e.slotIndex].yarnColorId
              ? catalog.colors.find((c) => c.id === slots[e.slotIndex].yarnColorId)
              : null
            return (
              <tr key={e.slotIndex}>
                <td>
                  <span
                    className="yarn-estimation__swatch"
                    style={color ? { background: color.hex } : undefined}
                  />
                </td>
                <td className="yarn-estimation__name">{e.colorName}</td>
                <td className="yarn-estimation__num">{e.estimatedGrams}</td>
                <td className="yarn-estimation__num">{e.estimatedSkeins}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
