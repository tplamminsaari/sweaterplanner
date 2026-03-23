import type { YarnCatalogService } from './yarn-catalog-service'
import type { Brand, YarnType, YarnColor } from '../types'
import { brands, yarnTypes, yarnColors } from '../data/yarn-catalog-data'

export const hardcodedYarnCatalog: YarnCatalogService = {
  getBrands(): Brand[] {
    return brands
  },

  getTypesByBrand(brandId: string): YarnType[] {
    return yarnTypes.filter(t => t.brandId === brandId)
  },

  getColorsByType(yarnTypeId: string): YarnColor[] {
    return yarnColors.filter(c => c.yarnTypeId === yarnTypeId)
  },
}
