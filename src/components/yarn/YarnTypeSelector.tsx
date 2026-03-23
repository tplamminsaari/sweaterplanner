import type { YarnType } from '@/types'

interface Props {
  types: YarnType[]
  selectedTypeId: string | null
  onSelect(typeId: string): void
}

export function YarnTypeSelector({ types, selectedTypeId, onSelect }: Props) {
  if (types.length === 0) return null

  return (
    <div className="yarn-type-selector">
      {types.map((type) => (
        <button
          key={type.id}
          className={`yarn-type-selector__item${type.id === selectedTypeId ? ' yarn-type-selector__item--active' : ''}`}
          onClick={() => onSelect(type.id)}
        >
          <span className="yarn-type-selector__name">{type.name}</span>
          <span className="yarn-type-selector__meta">
            {type.weightGrams}g · {type.stitchesPer10cm} sts/10cm
          </span>
        </button>
      ))}
    </div>
  )
}
