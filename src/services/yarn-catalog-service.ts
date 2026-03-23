import type { Brand, YarnType, YarnColor } from '../types'

export interface YarnCatalogService {
  getBrands(): Brand[]
  getTypesByBrand(brandId: string): YarnType[]
  getColorsByType(yarnTypeId: string): YarnColor[]
}
