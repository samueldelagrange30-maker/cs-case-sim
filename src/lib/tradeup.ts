import type { CollectionAlbum } from './collections'
import { getItemTier, floatToWear } from './odds'
import type { OpenedSkin, RarityTier, SkinItem, WearKey } from '../types'

/** Trade-up input tiers → next output tier. Covert cannot trade up. */
export const TRADEUP_NEXT: Partial<Record<RarityTier, RarityTier>> = {
  milspec: 'restricted',
  restricted: 'classified',
  classified: 'covert',
}

export const TRADEUP_INPUT_TIERS: RarityTier[] = [
  'milspec',
  'restricted',
  'classified',
]

const RARITY_BY_TIER: Record<
  RarityTier,
  { id: string; name: string; color: string }
> = {
  consumer: { id: 'rarity_common_weapon', name: 'Consumer Grade', color: '#b0c3d9' },
  industrial: {
    id: 'rarity_uncommon_weapon',
    name: 'Industrial Grade',
    color: '#5e98d9',
  },
  milspec: { id: 'rarity_rare_weapon', name: 'Mil-Spec Grade', color: '#4b69ff' },
  restricted: {
    id: 'rarity_mythical_weapon',
    name: 'Restricted',
    color: '#8847ff',
  },
  classified: {
    id: 'rarity_legendary_weapon',
    name: 'Classified',
    color: '#d32ce6',
  },
  covert: { id: 'rarity_ancient_weapon', name: 'Covert', color: '#eb4b4b' },
  rare: { id: 'rarity_ancient_weapon', name: 'Rare Special', color: '#ffd700' },
}

export function skinTradeTier(skin: OpenedSkin): RarityTier | null {
  if (skin.isRareSpecial) return null
  const tier = getItemTier(skin.item)
  if (!TRADEUP_INPUT_TIERS.includes(tier)) return null
  // Stickers / non-weapon-ish: require paint or weapon-like name with |
  if (!skin.hasWear && skin.crateType !== 'Case' && skin.crateType !== 'Souvenir') {
    // Allow if looks like a weapon skin name
    if (!skin.item.name.includes('|')) return null
  }
  return tier
}

function sampleFloat(): number {
  const a = Math.random()
  const b = Math.random()
  const raw = (a + b) / 2
  return Math.min(
    0.9999,
    Math.max(0.0001, Math.pow(raw, 0.85) * 0.85 + Math.random() * 0.15),
  )
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function pickUniform<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function rarityNameMatchesTier(rarityName: string, tier: RarityTier): boolean {
  const n = rarityName.toLowerCase()
  switch (tier) {
    case 'milspec':
      return n.includes('mil-spec') || n.includes('high grade')
    case 'restricted':
      return n.includes('restricted') || n.includes('remarkable')
    case 'classified':
      return n.includes('classified') || n.includes('exotic')
    case 'covert':
      return n.includes('covert') || n.includes('extraordinary')
    default:
      return false
  }
}

/** Build candidate pool for next-tier outcome (CS-like collection intersect). */
export function buildTradeUpPool(
  inputs: OpenedSkin[],
  albums: CollectionAlbum[],
): SkinItem[] {
  if (inputs.length !== 10) return []
  const tier = skinTradeTier(inputs[0]!)
  if (!tier) return []
  if (!inputs.every((s) => skinTradeTier(s) === tier)) return []
  const next = TRADEUP_NEXT[tier]
  if (!next) return []

  const inputColSets = inputs.map((s) => new Set(s.collections ?? []))
  const hasAnyCol = inputColSets.some((set) => set.size > 0)

  let candidateColIds: Set<string> | null = null
  if (hasAnyCol) {
    // Union of all input collections (CS uses collection of each input)
    candidateColIds = new Set<string>()
    for (const set of inputColSets) {
      for (const id of set) candidateColIds.add(id)
    }
  }

  const pool: SkinItem[] = []
  const seen = new Set<string>()

  for (const album of albums) {
    if (candidateColIds && !candidateColIds.has(album.id)) continue
    for (const it of album.items) {
      if (!rarityNameMatchesTier(it.rarity.name, next)) continue
      if (seen.has(it.id)) continue
      seen.add(it.id)
      pool.push({
        id: it.id,
        name: it.name,
        rarity: {
          id: RARITY_BY_TIER[next].id,
          name: it.rarity.name || RARITY_BY_TIER[next].name,
          color: it.rarity.color || RARITY_BY_TIER[next].color,
        },
        paint_index: null,
        image: it.image,
        phase: null,
      })
    }
  }

  // Fallback: any album item of next tier
  if (pool.length === 0) {
    for (const album of albums) {
      for (const it of album.items) {
        if (!rarityNameMatchesTier(it.rarity.name, next)) continue
        if (seen.has(it.id)) continue
        seen.add(it.id)
        pool.push({
          id: it.id,
          name: it.name,
          rarity: {
            id: RARITY_BY_TIER[next].id,
            name: it.rarity.name || RARITY_BY_TIER[next].name,
            color: it.rarity.color || RARITY_BY_TIER[next].color,
          },
          paint_index: null,
          image: it.image,
          phase: null,
        })
      }
    }
  }

  return pool
}

export function performTradeUp(
  inputs: OpenedSkin[],
  albums: CollectionAlbum[],
): { ok: true; result: OpenedSkin } | { ok: false; error: string } {
  if (inputs.length !== 10) {
    return { ok: false, error: 'Sélectionnez exactement 10 skins.' }
  }
  const tier = skinTradeTier(inputs[0]!)
  if (!tier || !TRADEUP_INPUT_TIERS.includes(tier)) {
    return {
      ok: false,
      error: 'Palier invalide (Mil-Spec, Restricted ou Classified uniquement).',
    }
  }
  if (!inputs.every((s) => skinTradeTier(s) === tier)) {
    return { ok: false, error: 'Tous les skins doivent être du même palier.' }
  }

  const pool = buildTradeUpPool(inputs, albums)
  if (pool.length === 0) {
    return { ok: false, error: 'Aucun skin de palier supérieur trouvé.' }
  }

  const item = pickUniform(pool)
  const float = sampleFloat()
  const wear = floatToWear(float)
  const avgFloat =
    inputs.reduce((s, x) => s + (x.float ?? 0.25), 0) / inputs.length
  const resultFloat = Math.min(
    0.9999,
    Math.max(0.0001, avgFloat * 0.7 + float * 0.3),
  )
  const resultWear = floatToWear(resultFloat)

  // Collections: intersection-ish — use collections of chosen item from map via album
  const resultCols: string[] = []
  for (const album of albums) {
    if (album.items.some((i) => i.id === item.id || i.name === item.name)) {
      resultCols.push(album.id)
    }
  }

  const result: OpenedSkin = {
    uid: uid(),
    caseId: 'tradeup',
    caseName: 'Contrat de trade-up',
    crateType: 'Case',
    item,
    wear: resultWear.key as WearKey,
    wearLabel: resultWear.label,
    float: Number(resultFloat.toFixed(8)),
    paintSeed: Math.floor(Math.random() * 1001),
    hasWear: true,
    isStatTrak: inputs.every((s) => s.isStatTrak),
    isRareSpecial: false,
    openedAt: Date.now(),
    stickers: [],
    collections: resultCols.length ? resultCols : undefined,
  }

  // silence unused
  void wear

  return { ok: true, result }
}
