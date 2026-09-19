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
  | 'Admin'

/** @deprecated Use Crate — kept as alias for compatibility. */
export type WeaponCase = Crate

export type WearKey = 'FN' | 'MW' | 'FT' | 'WW' | 'BS'

/** Sticker applied onto a weapon skin (CS-like slots 0..4). */
export interface AppliedSticker {
  /** Sticker inventory uid consumed */
  uid: string
  /** Sticker snapshot (name, image, rarity) */
  item: SkinItem
  /** Slot index 0..4 */
  slot: number
  scraped?: boolean
}

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
  /** Applied stickers (max 5 slots). Normalized to [] on load. */
  stickers?: AppliedSticker[]
  /** Collection ids this skin belongs to (for trade-up / albums). */
  collections?: string[]
}

export type RarityTier =
  | 'consumer'
  | 'industrial'
  | 'milspec'
  | 'restricted'
  | 'classified'
  | 'covert'
  | 'rare'

/** Bid on an auction listing. */
export interface AuctionBid {
  at: number
  amount: number
  bidder: string
}

export type AuctionStatus = 'active' | 'sold' | 'expired' | 'cancelled'

/** Marketplace auction listing (client-only simulation). */
export interface AuctionListing {
  id: string
  skin: OpenedSkin
  seller: 'you' | string
  startPrice: number
  buyoutPrice?: number
  currentBid: number
  currentBidder: string | null
  createdAt: number
  endsAt: number
  status: AuctionStatus
  bids: AuctionBid[]
  soldAt?: number
  soldPrice?: number
  /** Hidden fair value used by bot bidding (not shown in UI). */
  fairValue: number
  /** Bot seller listings are synthetic seed / bot inventory. */
  isBotListing: boolean
  /** True after wallet/inventory side-effects applied. */
  settled?: boolean
}

/** Derived sale for market history / price curves. */
export interface SaleRecord {
  itemName: string
  rarity: string
  soldPrice: number
  soldAt: number
  listingId: string
}

export const SIM_CURRENCY = '$SIM'