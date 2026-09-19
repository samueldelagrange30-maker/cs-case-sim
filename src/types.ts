export interface RarityInfo {
  id: string
  name: string
  color: string
}

export interface SkinItem {
  id: string
  name: string
  rarity: RarityInfo
  paint_index: string | null
  image: string
  phase: string | null
}

/** Full crate (loaded on case detail). */
export interface Crate {
  id: string
  name: string
  description: string
  type: CrateType
  image: string
  market_hash_name: string
  first_sale_date: string
  contains: SkinItem[]
  contains_rare: SkinItem[]
}

/** Lightweight index entry for the home grid. */
export interface CrateIndexEntry {
  id: string
  name: string
  type: CrateType
  image: string
  market_hash_name: string
  first_sale_date: string
  contains_count: number
  contains_rare_count: number
}

export type CrateType =
  | 'Case'
  | 'Sticker Capsule'
  | 'Autograph Capsule'
  | 'Souvenir'
  | 'Music Kit Box'
  | 'Patch Capsule'
  | 'Pins'
  | 'Graffiti'
  | 'Souvenir Highlight'

/** @deprecated Use Crate — kept as alias for compatibility. */
export type WeaponCase = Crate

export type WearKey = 'FN' | 'MW' | 'FT' | 'WW' | 'BS'

export interface OpenedSkin {
  uid: string
  caseId: string
  caseName: string
  crateType: CrateType
  item: SkinItem
  wear: WearKey | null
  wearLabel: string
  float: number | null
  hasWear: boolean
  isStatTrak: boolean
  isRareSpecial: boolean
  openedAt: number
}

export type RarityTier =
  | 'consumer'
  | 'industrial'
  | 'milspec'
  | 'restricted'
  | 'classified'
  | 'covert'
  | 'rare'
