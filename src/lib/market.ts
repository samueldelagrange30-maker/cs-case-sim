import type { AuctionListing, OpenedSkin, SaleRecord, WearKey } from '../types'
import { randomBotName } from './bots'
import { cloneSkinSnapshot } from './stickers'
import { estimateFairValue, normalizeItemName, suggestBuyout, suggestStartPrice } from './pricing'
import { SEED_SKIN_TEMPLATES } from './seedListings'
import { floatToWear } from './odds'

const KEY = 'cs-case-sim-market-v1'
const SEEDED_KEY = 'cs-case-sim-market-seeded-v1'

const WEAR_KEYS: WearKey[] = ['FN', 'MW', 'FT', 'WW', 'BS']

function uid(): string {
  return `auc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function sampleFloatForWear(key: WearKey): number {
  const ranges: Record<WearKey, [number, number]> = {
    FN: [0.01, 0.06],
    MW: [0.08, 0.14],
    FT: [0.18, 0.35],
    WW: [0.39, 0.44],
    BS: [0.5, 0.85],
  }
  const [lo, hi] = ranges[key]
  return Number((lo + Math.random() * (hi - lo)).toFixed(8))
}

function makeSeedSkin(
  tpl: (typeof SEED_SKIN_TEMPLATES)[number],
): OpenedSkin {
  const hasWear = tpl.preferWear
  const wearKey = hasWear
    ? WEAR_KEYS[Math.floor(Math.random() * WEAR_KEYS.length)]!
    : null
  const float = wearKey ? sampleFloatForWear(wearKey) : null
  const wear = float != null ? floatToWear(float) : null
  return {
    uid: uid(),
    caseId: tpl.caseId,
    caseName: tpl.caseName,
    crateType: tpl.crateType,
    item: tpl.item,
    wear: wear?.key ?? null,
    wearLabel: wear?.label ?? 'N/A',
    float,
    hasWear,
    isStatTrak: !tpl.isRareSpecial && Math.random() < 0.12,
    isRareSpecial: tpl.isRareSpecial,
    openedAt: Date.now() - Math.floor(Math.random() * 86400000),
    stickers: [],
  }
}

export function createSeedListings(now = Date.now()): AuctionListing[] {
  const templates = [...SEED_SKIN_TEMPLATES]
  // shuffle
  for (let i = templates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[templates[i], templates[j]] = [templates[j]!, templates[i]!]
  }
  const count = Math.min(10, templates.length)
  const listings: AuctionListing[] = []
  for (let i = 0; i < count; i++) {
    const skin = makeSeedSkin(templates[i]!)
    const fair = estimateFairValue(skin, (Math.random() - 0.5) * 0.2)
    const start = Math.max(1, Math.round(fair * (0.4 + Math.random() * 0.25)))
    const buyout =
      Math.random() < 0.7
        ? Math.max(start + 1, Math.round(fair * (1.15 + Math.random() * 0.35)))
        : undefined
    const durationMin = [15, 30, 60, 120, 360, 720][
      Math.floor(Math.random() * 6)
    ]!
    const createdAt = now - Math.floor(Math.random() * durationMin * 0.4 * 60_000)
    const endsAt = createdAt + durationMin * 60_000
    const seller = randomBotName()
    const listing: AuctionListing = {
      id: uid(),
      skin,
      seller,
      startPrice: start,
      buyoutPrice: buyout,
      currentBid: start,
      currentBidder: null,
      createdAt,
      endsAt,
      status: 'active',
      bids: [],
      fairValue: fair,
      isBotListing: true,
    }
    // occasional early bot bid
    if (Math.random() < 0.45 && endsAt > now) {
      const bid = Math.min(
        fair * 0.9,
        Math.round(start * (1.05 + Math.random() * 0.15)),
      )
      if (bid > start) {
        listing.currentBid = bid
        listing.currentBidder = randomBotName(seller)
        listing.bids.push({
          at: createdAt + Math.floor((now - createdAt) * Math.random()),
          amount: bid,
          bidder: listing.currentBidder,
        })
      }
    }
    listings.push(listing)
  }
  return listings
}

export interface MarketState {
  listings: AuctionListing[]
}

export function loadMarket(): MarketState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const listings = createSeedListings()
      const state = { listings }
      saveMarket(state)
      localStorage.setItem(SEEDED_KEY, '1')
      return state
    }
    const parsed = JSON.parse(raw) as MarketState
    if (!parsed || !Array.isArray(parsed.listings)) {
      return { listings: [] }
    }
    // migrate / ensure seeded once even if empty array was saved
    if (
      parsed.listings.length === 0 &&
      !localStorage.getItem(SEEDED_KEY)
    ) {
      const listings = createSeedListings()
      const state = { listings }
      saveMarket(state)
      localStorage.setItem(SEEDED_KEY, '1')
      return state
    }
    return {
      listings: parsed.listings.map((l) => ({
        ...l,
        skin: {
          ...l.skin,
          stickers: Array.isArray(l.skin?.stickers) ? l.skin.stickers : [],
        },
      })),
    }
  } catch {
    return { listings: [] }
  }
}

export function saveMarket(state: MarketState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function createUserListing(
  skin: OpenedSkin,
  startPrice: number,
  buyoutPrice: number | undefined,
  durationMinutes: number,
  now = Date.now(),
): AuctionListing {
  const fair = estimateFairValue(skin, (Math.random() - 0.5) * 0.1)
  return {
    id: uid(),
    skin: cloneSkinSnapshot(skin),
    seller: 'you',
    startPrice,
    buyoutPrice:
      buyoutPrice != null && buyoutPrice > startPrice ? buyoutPrice : undefined,
    currentBid: startPrice,
    currentBidder: null,
    createdAt: now,
    endsAt: now + durationMinutes * 60_000,
    status: 'active',
    bids: [],
    fairValue: fair,
    isBotListing: false,
  }
}

export function salesFromListings(listings: AuctionListing[]): SaleRecord[] {
  return listings
    .filter((l) => l.status === 'sold' && l.soldPrice != null && l.soldAt != null)
    .map((l) => ({
      itemName: normalizeItemName(l.skin.item.name),
      rarity: l.skin.isRareSpecial
        ? 'Rare Special'
        : l.skin.item.rarity.name,
      soldPrice: l.soldPrice!,
      soldAt: l.soldAt!,
      listingId: l.id,
    }))
    .sort((a, b) => b.soldAt - a.soldAt)
}

/** Place a bid (user or bot). Returns updated listing or null if invalid. */
export function applyBid(
  listing: AuctionListing,
  amount: number,
  bidder: string,
  now = Date.now(),
): AuctionListing | null {
  if (listing.status !== 'active') return null
  if (now >= listing.endsAt) return null
  const minBid =
    listing.currentBidder == null
      ? listing.startPrice
      : Math.ceil(listing.currentBid * 1.05)
  if (amount < minBid) return null
  if (listing.buyoutPrice != null && amount >= listing.buyoutPrice) {
    return applyBuyout(listing, bidder, listing.buyoutPrice, now)
  }
  return {
    ...listing,
    currentBid: amount,
    currentBidder: bidder,
    bids: [...listing.bids, { at: now, amount, bidder }],
  }
}

export function applyBuyout(
  listing: AuctionListing,
  bidder: string,
  price: number,
  now = Date.now(),
): AuctionListing {
  return {
    ...listing,
    currentBid: price,
    currentBidder: bidder,
    bids: [...listing.bids, { at: now, amount: price, bidder }],
    status: 'sold',
    soldAt: now,
    soldPrice: price,
  }
}

export function finalizeExpired(
  listing: AuctionListing,
  now = Date.now(),
): AuctionListing {
  if (listing.status !== 'active') return listing
  if (now < listing.endsAt) return listing
  if (listing.currentBidder != null && listing.bids.length > 0) {
    return {
      ...listing,
      status: 'sold',
      soldAt: listing.endsAt,
      soldPrice: listing.currentBid,
    }
  }
  return { ...listing, status: 'expired' }
}

export function cancelListing(listing: AuctionListing): AuctionListing {
  if (listing.status !== 'active') return listing
  return { ...listing, status: 'cancelled' }
}

/**
 * Advance one tick of bot bidding for active listings.
 * Mutates nothing — returns new array.
 */
export function tickBotBids(
  listings: AuctionListing[],
  now = Date.now(),
): AuctionListing[] {
  return listings.map((listing) => {
    if (listing.status !== 'active') return listing
    if (now >= listing.endsAt) return finalizeExpired(listing, now)

    const remaining = listing.endsAt - now
    const total = Math.max(1, listing.endsAt - listing.createdAt)
    const progress = 1 - remaining / total // 0→1

    // Cap under fair value (bots don't overpay much)
    const maxBot = listing.fairValue * (0.88 + Math.random() * 0.08)
    if (listing.currentBid >= maxBot) return listing
    if (
      listing.buyoutPrice != null &&
      listing.currentBid >= listing.buyoutPrice * 0.98
    ) {
      return listing
    }

    // Chance rises near end (sniping)
    let chance = 0.04 + progress * 0.12
    if (remaining < 30_000) chance += 0.25
    else if (remaining < 120_000) chance += 0.1
    if (listing.seller === 'you') chance += 0.03 // more action on user listings
    if (Math.random() > chance) return listing

    const bidder =
      listing.currentBidder && Math.random() < 0.3
        ? randomBotName(listing.currentBidder)
        : randomBotName(
            listing.seller === 'you' ? undefined : listing.seller,
          )
    if (bidder === listing.currentBidder) return listing
    if (bidder === 'you') return listing

    const step =
      listing.currentBidder == null
        ? listing.startPrice
        : Math.ceil(listing.currentBid * (1.05 + Math.random() * 0.08))
    let amount = Math.min(Math.round(step), Math.floor(maxBot))
    if (amount <= listing.currentBid && listing.currentBidder != null) {
      return listing
    }
    // occasional near-buyout snipe
    if (
      listing.buyoutPrice &&
      remaining < 60_000 &&
      Math.random() < 0.08 &&
      listing.buyoutPrice <= maxBot * 1.05
    ) {
      return applyBuyout(listing, bidder, listing.buyoutPrice, now)
    }

    const next = applyBid(listing, amount, bidder, now)
    return next ?? listing
  })
}

export { suggestStartPrice, suggestBuyout }
