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

export interface WeaponCase {
  id: string
  name: string
  description: string
  image: string
  market_hash_name: string
  first_sale_date: string
  contains: SkinItem[]
  contains_rare: SkinItem[]
}

export type WearKey = 'FN' | 'MW' | 'FT' | 'WW' | 'BS'

export interface OpenedSkin {
  uid: string
  caseId: string
  caseName: string
  item: SkinItem
  wear: WearKey
  wearLabel: string
  float: number
  isStatTrak: boolean
  isRareSpecial: boolean
  openedAt: number
}

export type RarityTier = 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare'
