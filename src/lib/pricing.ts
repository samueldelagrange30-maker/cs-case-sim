import type { OpenedSkin, RarityTier } from '../types'
import { getItemTier } from './odds'

/** Baseline price ranges by tier ($SIM). */
const TIER_BASE: Record<RarityTier, [number, number]> = {
  consumer: [1, 4],
  industrial: [2, 8],
  milspec: [5, 15],
  restricted: [20, 50],
  classified: [80, 200],
  covert: [300, 800],
  rare: [2000, 8000],
}

/** Lower float (better wear) → higher multiplier. */
function floatFactor(float: number | null, hasWear: boolean): number {
  if (!hasWear || float == null) return 1
  // FN ~1.35, MW ~1.15, FT ~1.0, WW ~0.85, BS ~0.7
  if (float < 0.07) return 1.35
  if (float < 0.15) return 1.15
  if (float < 0.38) return 1.0
  if (float < 0.45) return 0.85
  return 0.7
}

export function estimateFairValue(skin: OpenedSkin, jitter = 0): number {
  const tier = skin.isRareSpecial
    ? 'rare'
    : getItemTier(skin.item, false)
  const [lo, hi] = TIER_BASE[tier]
  const mid = (lo + hi) / 2
  const st = skin.isStatTrak ? 1.3 : 1
  const ff = floatFactor(skin.float, skin.hasWear)
  const noise = 1 + jitter
  return Math.max(1, Math.round(mid * st * ff * noise))
}

export function suggestStartPrice(skin: OpenedSkin): number {
  const fair = estimateFairValue(skin, (Math.random() - 0.5) * 0.1)
  return Math.max(1, Math.round(fair * 0.55))
}

export function suggestBuyout(skin: OpenedSkin): number {
  const fair = estimateFairValue(skin, (Math.random() - 0.5) * 0.1)
  return Math.max(1, Math.round(fair * 1.25))
}

export function formatSim(amount: number): string {
  if (amount >= 1000) {
    return `${amount.toLocaleString('fr-FR')} $SIM`
  }
  return `${amount} $SIM`
}

export function normalizeItemName(name: string): string {
  return name
    .replace(/^StatTrak™\s+/i, '')
    .replace(/^Souvenir\s+/i, '')
    .trim()
}
