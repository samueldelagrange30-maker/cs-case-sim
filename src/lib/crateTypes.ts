import type { CrateType } from '../types'

export interface TypeFilter {
  key: 'all' | CrateType
  label: string
  /** Match crate.type — empty for "all" */
  type: CrateType | null
}

export const TYPE_FILTERS: TypeFilter[] = [
  { key: 'all', label: 'Toutes', type: null },
  { key: 'Case', label: 'Caisses', type: 'Case' },
  { key: 'Sticker Capsule', label: 'Stickers', type: 'Sticker Capsule' },
  { key: 'Autograph Capsule', label: 'Autographes', type: 'Autograph Capsule' },
  { key: 'Souvenir', label: 'Souvenirs', type: 'Souvenir' },
  { key: 'Music Kit Box', label: 'Music Kits', type: 'Music Kit Box' },
  { key: 'Patch Capsule', label: 'Patches', type: 'Patch Capsule' },
  { key: 'Pins', label: 'Pins', type: 'Pins' },
  { key: 'Graffiti', label: 'Graffiti', type: 'Graffiti' },
  { key: 'Souvenir Highlight', label: 'Highlights', type: 'Souvenir Highlight' },
  { key: 'Admin', label: 'ADMIN', type: 'Admin' },
]

export function typeLabel(type: CrateType): string {
  return TYPE_FILTERS.find((f) => f.type === type)?.label ?? type
}
