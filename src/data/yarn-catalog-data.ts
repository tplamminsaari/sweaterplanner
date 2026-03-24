import type { Brand, YarnType, YarnColor } from '../types'

export const brands: Brand[] = [
  { id: 'istex', name: 'Ístex' },
  { id: 'sandnes', name: 'Sandnes Garn' },
]

export const yarnTypes: YarnType[] = [
  {
    id: 'lettlopi',
    brandId: 'istex',
    name: 'Léttlopi',
    weightGrams: 50,
    metersPerWeight: 100,
    stitchesPer10cm: 18,
    rowsPer10cm: 24,
    needleSizeMm: 4.5,
  },
  {
    id: 'alafoss',
    brandId: 'istex',
    name: 'Álafoss Lopi',
    weightGrams: 100,
    metersPerWeight: 100,
    stitchesPer10cm: 13,
    rowsPer10cm: 18,
    needleSizeMm: 6.0,
  },
  {
    id: 'peer-gynt',
    brandId: 'sandnes',
    name: 'Peer Gynt',
    weightGrams: 50,
    metersPerWeight: 160,
    stitchesPer10cm: 22,
    rowsPer10cm: 30,
    needleSizeMm: 4.0,
  },
]

export const yarnColors: YarnColor[] = [
  // Léttlopi
  { id: 'lettlopi-0051', yarnTypeId: 'lettlopi', colorCode: '0051', name: 'White',            hex: '#f5f0e8' },
  { id: 'lettlopi-0052', yarnTypeId: 'lettlopi', colorCode: '0052', name: 'Bleached White',   hex: '#ede8de' },
  { id: 'lettlopi-0005', yarnTypeId: 'lettlopi', colorCode: '0005', name: 'Black',             hex: '#1a1a1a' },
  { id: 'lettlopi-0054', yarnTypeId: 'lettlopi', colorCode: '0054', name: 'Dark Grey',         hex: '#4a4a4a' },
  { id: 'lettlopi-0056', yarnTypeId: 'lettlopi', colorCode: '0056', name: 'Light Grey',        hex: '#c0b8aa' },
  { id: 'lettlopi-0867', yarnTypeId: 'lettlopi', colorCode: '0867', name: 'Ash',               hex: '#888078' },
  { id: 'lettlopi-0058', yarnTypeId: 'lettlopi', colorCode: '0058', name: 'Light Beige',       hex: '#d4c8aa' },
  { id: 'lettlopi-0085', yarnTypeId: 'lettlopi', colorCode: '0085', name: 'Oatmeal',           hex: '#c8b890' },
  { id: 'lettlopi-0086', yarnTypeId: 'lettlopi', colorCode: '0086', name: 'Brown',             hex: '#6b4c2a' },
  { id: 'lettlopi-0867b',yarnTypeId: 'lettlopi', colorCode: '9974', name: 'Rust',              hex: '#9b3d1e' },
  { id: 'lettlopi-1400', yarnTypeId: 'lettlopi', colorCode: '1400', name: 'Red',               hex: '#b82020' },
  { id: 'lettlopi-1409', yarnTypeId: 'lettlopi', colorCode: '1409', name: 'Garnet Red',        hex: '#7a1a1a' },
  { id: 'lettlopi-1702', yarnTypeId: 'lettlopi', colorCode: '1702', name: 'Burnt Orange',      hex: '#c45c1a' },
  { id: 'lettlopi-1706', yarnTypeId: 'lettlopi', colorCode: '1706', name: 'Golden Yellow',     hex: '#d4a020' },
  { id: 'lettlopi-1412', yarnTypeId: 'lettlopi', colorCode: '1412', name: 'Mustard',           hex: '#b08c18' },
  { id: 'lettlopi-9419', yarnTypeId: 'lettlopi', colorCode: '9419', name: 'Forest Green',      hex: '#2e5a2e' },
  { id: 'lettlopi-1405', yarnTypeId: 'lettlopi', colorCode: '1405', name: 'Pine Green',        hex: '#2a4a30' },
  { id: 'lettlopi-1703', yarnTypeId: 'lettlopi', colorCode: '1703', name: 'Teal',              hex: '#2a6868' },
  { id: 'lettlopi-1432', yarnTypeId: 'lettlopi', colorCode: '1432', name: 'Ocean Blue',        hex: '#1e4878' },
  { id: 'lettlopi-9418', yarnTypeId: 'lettlopi', colorCode: '9418', name: 'Midnight Blue',     hex: '#1a2850' },
  { id: 'lettlopi-1404', yarnTypeId: 'lettlopi', colorCode: '1404', name: 'Violet',            hex: '#5a2878' },

  // Álafoss Lopi
  { id: 'alafoss-0051', yarnTypeId: 'alafoss', colorCode: '0051', name: 'White',               hex: '#f0ece0' },
  { id: 'alafoss-0005', yarnTypeId: 'alafoss', colorCode: '0005', name: 'Black',               hex: '#1a1a1a' },
  { id: 'alafoss-0054', yarnTypeId: 'alafoss', colorCode: '0054', name: 'Dark Grey',           hex: '#484848' },
  { id: 'alafoss-0056', yarnTypeId: 'alafoss', colorCode: '0056', name: 'Light Grey',          hex: '#bab0a0' },
  { id: 'alafoss-0086', yarnTypeId: 'alafoss', colorCode: '0086', name: 'Brown',               hex: '#6b4c2a' },
  { id: 'alafoss-1400', yarnTypeId: 'alafoss', colorCode: '1400', name: 'Red',                 hex: '#b82020' },
  { id: 'alafoss-9419', yarnTypeId: 'alafoss', colorCode: '9419', name: 'Forest Green',        hex: '#2e5a2e' },
  { id: 'alafoss-1432', yarnTypeId: 'alafoss', colorCode: '1432', name: 'Ocean Blue',          hex: '#1e4878' },

  // Peer Gynt (Sandnes Garn)
  { id: 'peer-gynt-1001', yarnTypeId: 'peer-gynt', colorCode: '1001', name: 'Natural White',  hex: '#f0ebe0' },
  { id: 'peer-gynt-1088', yarnTypeId: 'peer-gynt', colorCode: '1088', name: 'Charcoal',       hex: '#3a3a3a' },
  { id: 'peer-gynt-4236', yarnTypeId: 'peer-gynt', colorCode: '4236', name: 'Navy',            hex: '#1a2a5a' },
  { id: 'peer-gynt-4418', yarnTypeId: 'peer-gynt', colorCode: '4418', name: 'Spruce',          hex: '#2a4a38' },
  { id: 'peer-gynt-4065', yarnTypeId: 'peer-gynt', colorCode: '4065', name: 'Red',             hex: '#b01818' },
  { id: 'peer-gynt-2035', yarnTypeId: 'peer-gynt', colorCode: '2035', name: 'Camel',           hex: '#c8a060' },
]
