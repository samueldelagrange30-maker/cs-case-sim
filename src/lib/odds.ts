import type {
  Crate,
  CrateType,
  OpenedSkin,
  RarityTier,
  SkinItem,
  WearKey,
} from '../types'

/** Official-ish weapon-case rates (Case type only). */
const CASE_TIER_ODDS: { tier: RarityTier; chance: number }[] = [
  { tier: 'milspec', chance: 0.7992 },
  { tier: 'restricted', chance: 0.1598 },
  { tier: 'classified', chance: 0.032 },
  { tier: 'covert', chance: 0.0064 },
  { tier: 'rare', chance: 0.0026 },
]

/**
 * Capsule / non-Case odds: when multiple rarity tiers are present, assign
 * capsule-style weights favoring common tiers (≈80 / 16 / 3 / 0.8 / 0.2),
 * then normalize to the tiers that actually exist in `contains` (+ rare pool).
 * Single-tier crates → 100%. No yellow rare pool unless contains_rare nonempty.
 */
const CAPSULE_WEIGHTS = [0.8, 0.16, 0.03, 0.008, 0.002]

const TIER_ORDER: RarityTier[] = [
  'consumer',
  'industrial',
  'milspec',
  'restricted',
  'classified',
  'covert',
  'rare',
]

const WEAR_RANGES: { key: WearKey; label: string; min: number; max: number }[] =
  [
    { key: 'FN', label: 'Factory New', min: 0.0, max: 0.07 },
    { key: 'MW', label: 'Minimal Wear', min: 0.07, max: 0.15 },
    { key: 'FT', label: 'Field-Tested', min: 0.15, max: 0.38 },
    { key: 'WW', label: 'Well-Worn', min: 0.38, max: 0.45 },
    { key: 'BS', label: 'Battle-Scarred', min: 0.45, max: 1.0 },
  ]

/** Map CS rarity ids (weapons + stickers/graffiti/etc.) to internal tiers. */
const RARITY_TO_TIER: Record<string, RarityTier> = {
  rarity_common_weapon: 'consumer',
  rarity_uncommon_weapon: 'industrial',
  rarity_rare_weapon: 'milspec',
  rarity_mythical_weapon: 'restricted',
  rarity_legendary_weapon: 'classified',
  rarity_ancient_weapon: 'covert',
  // Stickers, graffiti, pins, patches, music kits
  rarity_common: 'consumer',
  rarity_uncommon: 'industrial',
  rarity_rare: 'milspec',
  rarity_mythical: 'restricted',
  rarity_legendary: 'classified',
  rarity_ancient: 'covert',
}

const NO_WEAR_TYPES: ReadonlySet<CrateType> = new Set([
  'Sticker Capsule',
  'Autograph Capsule',
  'Music Kit Box',
  'Patch Capsule',
  'Pins',
  'Graffiti',
])

export const TIER_META: Record<
  RarityTier,
  { label: string; color: string; short: string }
> = {
  consumer: { label: 'Consumer', color: '#b0c3d9', short: 'CG' },
  industrial: { label: 'Industrial', color: '#5e98d9', short: 'IG' },
  milspec: { label: 'Mil-Spec / High Grade', color: '#4b69ff', short: 'MS' },
  restricted: { label: 'Restricted / Remarkable', color: '#8847ff', short: 'R' },
  classified: { label: 'Classified / Exotic', color: '#d32ce6', short: 'C' },
  covert: { label: 'Covert / Extraordinary', color: '#eb4b4b', short: 'CV' },
  rare: { label: 'Rare Special', color: '#ffd700', short: '★' },
}

export function crateHasWear(type: CrateType): boolean {
  return !NO_WEAR_TYPES.has(type)
}

export function getItemTier(item: SkinItem, isRarePool = false): RarityTier {
  if (isRarePool) return 'rare'
  return RARITY_TO_TIER[item.rarity.id] ?? 'milspec'
}

export function groupByTier(c: Crate): Record<RarityTier, SkinItem[]> {
  const groups: Record<RarityTier, SkinItem[]> = {
    consumer: [],
    industrial: [],
    milspec: [],
    restricted: [],
    classified: [],
    covert: [],
    rare: [...c.contains_rare],
  }
  for (const item of c.contains) {
    const tier = getItemTier(item)
    if (tier !== 'rare') groups[tier].push(item)
  }
  return groups
}

function pickWeighted(
  entries: { tier: RarityTier; chance: number }[],
): RarityTier {
  const total = entries.reduce((s, e) => s + e.chance, 0)
  let r = Math.random() * total
  for (const e of entries) {
    r -= e.chance
    if (r <= 0) return e.tier
  }
  return entries[entries.length - 1]!.tier
}

function pickTierForCrate(
  crateType: CrateType,
  available: RarityTier[],
): RarityTier {
  if (available.length === 1) return available[0]!

  if (crateType === 'Case') {
    const entries = CASE_TIER_ODDS.filter((t) => available.includes(t.tier))
    if (entries.length === 0) return available[0]!
    return pickWeighted(entries)
  }

  // Capsule-style: sort available common→rare, assign CAPSULE_WEIGHTS prefix
  const ordered = TIER_ORDER.filter((t) => available.includes(t))
  const entries = ordered.map((tier, i) => ({
    tier,
    chance: CAPSULE_WEIGHTS[Math.min(i, CAPSULE_WEIGHTS.length - 1)]!,
  }))
  return pickWeighted(entries)
}

function pickUniform<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Beta-ish float: skewed toward mid wears (FT/MW). */
function sampleFloat(): number {
  const a = Math.random()
  const b = Math.random()
  const raw = (a + b) / 2
  return Math.min(
    0.9999,
    Math.max(0.0001, Math.pow(raw, 0.85) * 0.85 + Math.random() * 0.15),
  )
}

export function floatToWear(float: number): { key: WearKey; label: string } {
  for (const w of WEAR_RANGES) {
    if (float >= w.min && float < w.max) return { key: w.key, label: w.label }
  }
  return { key: 'BS', label: 'Battle-Scarred' }
}

function nameHasStatTrak(name: string): boolean {
  return /stattrak/i.test(name)
}

function canRollStatTrak(item: SkinItem, crate: Crate, isRare: boolean): boolean {
  // Item already labeled StatTrak (e.g. music kits in ST boxes)
  if (nameHasStatTrak(item.name)) return false
  // Stickers / graffiti / pins / patches: never
  if (!crateHasWear(crate.type) && crate.type !== 'Music Kit Box') return false
  // Music kit boxes: only if box name suggests StatTrak and item isn't already ST
  if (crate.type === 'Music Kit Box') {
    return /stattrak/i.test(crate.name) && Math.random() < 0.1
  }
  // Weapon skins / souvenirs
  const n = item.name.toLowerCase()
  if (n.includes('gloves') || n.includes('wraps')) return false
  if (isRare && !item.paint_index) return Math.random() < 0.05
  return Math.random() < 0.1
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function openCase(c: Crate): OpenedSkin {
  const groups = groupByTier(c)
  const available = (Object.keys(groups) as RarityTier[]).filter(
    (t) => groups[t].length > 0,
  )
  const tier = pickTierForCrate(c.type, available)
  const isRareSpecial = tier === 'rare'
  const item = pickUniform(groups[tier])
  const hasWear = crateHasWear(c.type)
  const float = hasWear ? sampleFloat() : null
  const wear = float != null ? floatToWear(float) : null
  const alreadyST = nameHasStatTrak(item.name)
  const isStatTrak =
    alreadyST || canRollStatTrak(item, c, isRareSpecial)

  return {
    uid: uid(),
    caseId: c.id,
    caseName: c.name,
    crateType: c.type,
    item,
    wear: wear?.key ?? null,
    wearLabel: wear?.label ?? 'N/A',
    float: float != null ? Number(float.toFixed(8)) : null,
    hasWear,
    isStatTrak,
    isRareSpecial,
    openedAt: Date.now(),
  }
}

export function openMultiple(c: Crate, n: number): OpenedSkin[] {
  return Array.from({ length: n }, () => openCase(c))
}

/** Build a long strip of skins for the roulette animation. */
export function buildRouletteStrip(
  c: Crate,
  winner: OpenedSkin,
  length = 50,
  winnerIndex = 42,
): { item: SkinItem; isRareSpecial: boolean; isWinner: boolean }[] {
  const pool: { item: SkinItem; isRareSpecial: boolean }[] = [
    ...c.contains.map((item) => ({ item, isRareSpecial: false })),
    ...c.contains_rare.map((item) => ({ item, isRareSpecial: true })),
  ]
  const strip: { item: SkinItem; isRareSpecial: boolean; isWinner: boolean }[] =
    []
  for (let i = 0; i < length; i++) {
    if (i === winnerIndex) {
      strip.push({
        item: winner.item,
        isRareSpecial: winner.isRareSpecial,
        isWinner: true,
      })
    } else {
      const pick = pickUniform(pool)
      strip.push({ ...pick, isWinner: false })
    }
  }
  return strip
}

export function displayName(skin: OpenedSkin): string {
  if (skin.isStatTrak && !nameHasStatTrak(skin.item.name)) {
    return `StatTrak™ ${skin.item.name}`
  }
  return skin.item.name
}

export function rarityColor(skin: OpenedSkin): string {
  if (skin.isRareSpecial) return TIER_META.rare.color
  return skin.item.rarity.color || TIER_META.milspec.color
}

/** Human-readable odds blurb for the case page. */
export function oddsBlurb(c: Crate): string {
  if (c.type === 'Case') {
    return 'Probabilités approx. : Mil-Spec 79,92% · Restricted 15,98% · Classified 3,2% · Covert 0,64% · Rare Special 0,26%'
  }
  const groups = groupByTier(c)
  const available = TIER_ORDER.filter((t) => groups[t].length > 0)
  if (available.length <= 1) {
    return 'Probabilités : un seul palier de rareté (100% sur les items présents).'
  }
  const parts = available.map((tier, i) => {
    const w = CAPSULE_WEIGHTS[Math.min(i, CAPSULE_WEIGHTS.length - 1)]!
    const total = available.reduce(
      (s, _, j) =>
        s + CAPSULE_WEIGHTS[Math.min(j, CAPSULE_WEIGHTS.length - 1)]!,
      0,
    )
    const pct = ((w / total) * 100).toFixed(1).replace('.', ',')
    return `${TIER_META[tier].label} ~${pct}%`
  })
  return `Probabilités approx. (capsule) : ${parts.join(' · ')}`
}
