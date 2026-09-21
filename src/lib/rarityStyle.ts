import type { CSSProperties } from 'react'
import type { RarityTier, SkinItem } from '../types'
import { TIER_META, getItemTier } from './odds'

/** Canonical CS2 rarity hex (fallback when item.rarity.color missing). */
export const RARITY_HEX: Record<RarityTier, string> = {
  consumer: '#b0c3d9',
  industrial: '#5e98d9',
  milspec: '#4b69ff',
  restricted: '#8847ff',
  classified: '#d32ce6',
  covert: '#eb4b4b',
  rare: '#e4ae39',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    }
  }
  if (h.length !== 6) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function resolveRarityColor(
  item: Pick<SkinItem, 'rarity'>,
  opts?: { isRareSpecial?: boolean },
): string {
  if (opts?.isRareSpecial) return RARITY_HEX.rare
  const fromItem = item.rarity?.color?.trim()
  if (fromItem) return fromItem
  const tier = getItemTier(item as SkinItem, false)
  return RARITY_HEX[tier] ?? TIER_META.milspec.color
}

/**
 * Soft gradient + glow + vignette for case-content / inventory tiles.
 */
export function rarityCardStyle(
  color: string,
  opts?: { intense?: boolean },
): CSSProperties {
  const rgb = hexToRgb(color) ?? { r: 75, g: 105, b: 255 }
  const { r, g, b } = rgb
  const intense = opts?.intense ?? false
  const topAlpha = intense ? 0.55 : 0.42
  const midAlpha = intense ? 0.22 : 0.14
  const glow = intense ? 0.45 : 0.32

  return {
    borderColor: `rgba(${r},${g},${b},0.55)`,
    background: [
      `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(${r},${g},${b},${topAlpha}) 0%, transparent 55%)`,
      `radial-gradient(ellipse 90% 70% at 50% 100%, rgba(0,0,0,0.65) 0%, transparent 50%)`,
      `linear-gradient(165deg, rgba(${r},${g},${b},${midAlpha}) 0%, rgba(10,13,18,0.92) 42%, rgba(7,9,13,0.98) 100%)`,
    ].join(', '),
    boxShadow: [
      `inset 0 -2px 0 ${color}`,
      `inset 0 0 24px rgba(${r},${g},${b},${glow * 0.35})`,
      `0 0 18px rgba(${r},${g},${b},${glow * 0.25})`,
    ].join(', '),
  }
}

export function tierCardStyle(
  tier: RarityTier,
  opts?: { intense?: boolean },
): CSSProperties {
  return rarityCardStyle(RARITY_HEX[tier] ?? TIER_META[tier].color, opts)
}
