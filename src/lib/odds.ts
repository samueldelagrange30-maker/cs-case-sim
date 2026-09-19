import type { OpenedSkin, RarityTier, SkinItem, WeaponCase, WearKey } from '../types'

const TIER_ODDS: { tier: RarityTier; chance: number }[] = [
  { tier: 'milspec', chance: 0.7992 },
  { tier: 'restricted', chance: 0.1598 },
  { tier: 'classified', chance: 0.032 },
  { tier: 'covert', chance: 0.0064 },
  { tier: 'rare', chance: 0.0026 },
]

const WEAR_RANGES: { key: WearKey; label: string; min: number; max: number }[] = [
  { key: 'FN', label: 'Factory New', min: 0.0, max: 0.07 },
  { key: 'MW', label: 'Minimal Wear', min: 0.07, max: 0.15 },
  { key: 'FT', label: 'Field-Tested', min: 0.15, max: 0.38 },
  { key: 'WW', label: 'Well-Worn', min: 0.38, max: 0.45 },
  { key: 'BS', label: 'Battle-Scarred', min: 0.45, max: 1.0 },
]

const RARITY_TO_TIER: Record<string, RarityTier> = {
  rarity_rare_weapon: 'milspec',
  rarity_mythical_weapon: 'restricted',
  rarity_legendary_weapon: 'classified',
  rarity_ancient_weapon: 'covert',
}

export const TIER_META: Record<
  RarityTier,
  { label: string; color: string; short: string }
> = {
  milspec: { label: 'Mil-Spec', color: '#4b69ff', short: 'MS' },
  restricted: { label: 'Restricted', color: '#8847ff', short: 'R' },
  classified: { label: 'Classified', color: '#d32ce6', short: 'C' },
  covert: { label: 'Covert', color: '#eb4b4b', short: 'CV' },
  rare: { label: 'Rare Special', color: '#ffd700', short: '★' },
}

export function getItemTier(item: SkinItem, isRarePool = false): RarityTier {
  if (isRarePool) return 'rare'
  return RARITY_TO_TIER[item.rarity.id] ?? 'milspec'
}

export function groupByTier(c: WeaponCase): Record<RarityTier, SkinItem[]> {
  const groups: Record<RarityTier, SkinItem[]> = {
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

function pickWeightedTier(available: RarityTier[]): RarityTier {
  const entries = TIER_ODDS.filter((t) => available.includes(t.tier))
  const total = entries.reduce((s, e) => s + e.chance, 0)
  let r = Math.random() * total
  for (const e of entries) {
    r -= e.chance
    if (r <= 0) return e.tier
  }
  return entries[entries.length - 1]!.tier
}

function pickUniform<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Beta-ish float: skewed toward mid wears (FT/MW). */
function sampleFloat(): number {
  // Average of two uniforms approximates a tent / mild beta(2,2)-like curve
  const a = Math.random()
  const b = Math.random()
  const raw = (a + b) / 2
  // Slight push toward lower floats (better wears a bit more common visually)
  return Math.min(0.9999, Math.max(0.0001, Math.pow(raw, 0.85) * 0.85 + Math.random() * 0.15))
}

export function floatToWear(float: number): { key: WearKey; label: string } {
  for (const w of WEAR_RANGES) {
    if (float >= w.min && float < w.max) return { key: w.key, label: w.label }
  }
  return { key: 'BS', label: 'Battle-Scarred' }
}

function canBeStatTrak(item: SkinItem, isRare: boolean): boolean {
  const n = item.name.toLowerCase()
  if (n.includes('gloves') || n.includes('wraps')) return false
  // Vanilla knives without paint often skip ST in practice — still allow ~10% for painted
  if (isRare && !item.paint_index) return Math.random() < 0.05
  return true
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function openCase(c: WeaponCase): OpenedSkin {
  const groups = groupByTier(c)
  const available = (Object.keys(groups) as RarityTier[]).filter(
    (t) => groups[t].length > 0,
  )
  const tier = pickWeightedTier(available)
  const isRareSpecial = tier === 'rare'
  const item = pickUniform(groups[tier])
  const float = sampleFloat()
  const wear = floatToWear(float)
  const isStatTrak =
    canBeStatTrak(item, isRareSpecial) && Math.random() < 0.1

  return {
    uid: uid(),
    caseId: c.id,
    caseName: c.name,
    item,
    wear: wear.key,
    wearLabel: wear.label,
    float: Number(float.toFixed(8)),
    isStatTrak,
    isRareSpecial,
    openedAt: Date.now(),
  }
}

export function openMultiple(c: WeaponCase, n: number): OpenedSkin[] {
  return Array.from({ length: n }, () => openCase(c))
}

/** Build a long strip of skins for the roulette animation. */
export function buildRouletteStrip(
  c: WeaponCase,
  winner: OpenedSkin,
  length = 50,
  winnerIndex = 42,
): { item: SkinItem; isRareSpecial: boolean; isWinner: boolean }[] {
  const pool: { item: SkinItem; isRareSpecial: boolean }[] = [
    ...c.contains.map((item) => ({ item, isRareSpecial: false })),
    ...c.contains_rare.map((item) => ({ item, isRareSpecial: true })),
  ]
  const strip: { item: SkinItem; isRareSpecial: boolean; isWinner: boolean }[] = []
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
  const st = skin.isStatTrak ? 'StatTrak™ ' : ''
  return `${st}${skin.item.name}`
}

export function rarityColor(skin: OpenedSkin): string {
  if (skin.isRareSpecial) return TIER_META.rare.color
  return skin.item.rarity.color || TIER_META.milspec.color
}
