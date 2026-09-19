import type { AppliedSticker, CrateType, OpenedSkin, SkinItem } from '../types'

export const MAX_STICKER_SLOTS = 5

const STICKER_CRATE_TYPES: CrateType[] = [
  'Sticker Capsule',
  'Autograph Capsule',
]

const NON_WEAPON_CRATE_TYPES: CrateType[] = [
  'Sticker Capsule',
  'Autograph Capsule',
  'Music Kit Box',
  'Patch Capsule',
  'Pins',
  'Graffiti',
  'Souvenir Highlight',
]

export function isStickerItem(item: SkinItem): boolean {
  const name = item.name ?? ''
  if (/^sticker\s*\|/i.test(name)) return true
  if (/autograph/i.test(name) && /\|/.test(name)) return true
  const rarity = (item.rarity?.name ?? '').toLowerCase()
  if (rarity.includes('sticker')) return true
  return false
}

export function isSticker(skin: OpenedSkin): boolean {
  if (STICKER_CRATE_TYPES.includes(skin.crateType)) return true
  return isStickerItem(skin.item)
}

/** True for Case/Souvenir weapon drops that can receive stickers. */
export function canAcceptStickers(skin: OpenedSkin): boolean {
  if (isSticker(skin)) return false
  if (NON_WEAPON_CRATE_TYPES.includes(skin.crateType)) return false
  if (skin.crateType === 'Case' || skin.crateType === 'Souvenir') return true
  // Pragmatic: gun-like if has wear and name doesn't look like accessory
  const name = skin.item.name ?? ''
  if (/^(graffiti|music kit|patch|pin|collectible)\b/i.test(name)) return false
  if (/^sticker\s*\|/i.test(name)) return false
  return skin.hasWear === true
}

export function getStickers(skin: OpenedSkin): AppliedSticker[] {
  return Array.isArray(skin.stickers) ? skin.stickers : []
}

export function occupiedSlots(skin: OpenedSkin): Set<number> {
  return new Set(getStickers(skin).map((s) => s.slot))
}

export function emptySlots(skin: OpenedSkin): number[] {
  const used = occupiedSlots(skin)
  return Array.from({ length: MAX_STICKER_SLOTS }, (_, i) => i).filter(
    (i) => !used.has(i),
  )
}

export function cloneSkinSnapshot(skin: OpenedSkin): OpenedSkin {
  return {
    ...skin,
    item: { ...skin.item, rarity: { ...skin.item.rarity } },
    stickers: getStickers(skin).map((s) => ({
      ...s,
      item: { ...s.item, rarity: { ...s.item.rarity } },
    })),
  }
}
