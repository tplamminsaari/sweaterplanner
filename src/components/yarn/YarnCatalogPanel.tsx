import { useEffect, useState } from 'react'
import { useYarnStore } from '@/store/yarn-store'
import { hardcodedYarnCatalog } from '@/services/hardcoded-yarn-catalog'
import { BrandSelector } from './BrandSelector'
import { YarnTypeSelector } from './YarnTypeSelector'
import { ColorPalette } from './ColorPalette'

export function YarnCatalogPanel() {
  const catalog = useYarnStore((s) => s.catalog)
  const loadCatalog = useYarnStore((s) => s.loadCatalog)

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog({
      brands: hardcodedYarnCatalog.getBrands(),
      types: hardcodedYarnCatalog.getBrands().flatMap((b) =>
        hardcodedYarnCatalog.getTypesByBrand(b.id),
      ),
      colors: hardcodedYarnCatalog.getBrands().flatMap((b) =>
        hardcodedYarnCatalog.getTypesByBrand(b.id).flatMap((t) =>
          hardcodedYarnCatalog.getColorsByType(t.id),
        ),
      ),
    })
  }, [loadCatalog])

  // Auto-select first brand/type on load
  useEffect(() => {
    if (catalog.brands.length > 0 && selectedBrandId === null) {
      setSelectedBrandId(catalog.brands[0].id)
    }
  }, [catalog.brands, selectedBrandId])

  useEffect(() => {
    if (selectedBrandId !== null) {
      const types = catalog.types.filter((t) => t.brandId === selectedBrandId)
      if (types.length > 0) setSelectedTypeId(types[0].id)
      else setSelectedTypeId(null)
    }
  }, [selectedBrandId, catalog.types])

  const visibleTypes = selectedBrandId
    ? catalog.types.filter((t) => t.brandId === selectedBrandId)
    : []

  const visibleColors = selectedTypeId
    ? catalog.colors.filter((c) => c.yarnTypeId === selectedTypeId)
    : []

  function handleBrandSelect(brandId: string) {
    setSelectedBrandId(brandId)
  }

  return (
    <div className="yarn-catalog-panel">
      <BrandSelector
        brands={catalog.brands}
        selectedBrandId={selectedBrandId}
        onSelect={handleBrandSelect}
      />
      <YarnTypeSelector
        types={visibleTypes}
        selectedTypeId={selectedTypeId}
        onSelect={setSelectedTypeId}
      />
      <ColorPalette colors={visibleColors} />
    </div>
  )
}
