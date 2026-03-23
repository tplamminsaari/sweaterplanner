import type { Brand } from '@/types'

interface Props {
  brands: Brand[]
  selectedBrandId: string | null
  onSelect(brandId: string): void
}

export function BrandSelector({ brands, selectedBrandId, onSelect }: Props) {
  return (
    <div className="brand-selector">
      {brands.map((brand) => (
        <button
          key={brand.id}
          className={`brand-selector__tab${brand.id === selectedBrandId ? ' brand-selector__tab--active' : ''}`}
          onClick={() => onSelect(brand.id)}
        >
          {brand.name}
        </button>
      ))}
    </div>
  )
}
