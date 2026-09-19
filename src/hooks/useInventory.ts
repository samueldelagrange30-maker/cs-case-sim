import { useCallback, useEffect, useState } from 'react'
import type { AppliedSticker, OpenedSkin } from '../types'
import {
  clearInventoryStorage,
  loadInventory,
  saveInventory,
} from '../lib/inventory'
import {
  canAcceptStickers,
  getStickers,
  isSticker,
  MAX_STICKER_SLOTS,
} from '../lib/stickers'

export function useInventory() {
  const [items, setItems] = useState<OpenedSkin[]>([])

  useEffect(() => {
    setItems(loadInventory())
  }, [])

  const addItems = useCallback((newItems: OpenedSkin[]) => {
    setItems((prev) => {
      const normalized = newItems.map((s) => ({
        ...s,
        stickers: getStickers(s),
      }))
      const next = [...normalized, ...prev]
      saveInventory(next)
      return next
    })
  }, [])

  const removeFromInventory = useCallback((uid: string): OpenedSkin | null => {
    const current = loadInventory()
    const idx = current.findIndex((x) => x.uid === uid)
    if (idx < 0) return null
    const removed = current[idx]!
    const next = [...current.slice(0, idx), ...current.slice(idx + 1)]
    saveInventory(next)
    setItems(next)
    return removed
  }, [])

  const updateSkin = useCallback(
    (uid: string, updater: (skin: OpenedSkin) => OpenedSkin): OpenedSkin | null => {
      const current = loadInventory()
      const idx = current.findIndex((x) => x.uid === uid)
      if (idx < 0) return null
      const updated = updater(current[idx]!)
      const next = [...current]
      next[idx] = { ...updated, stickers: getStickers(updated) }
      saveInventory(next)
      setItems(next)
      return next[idx]!
    },
    [],
  )

  /** Consume sticker from inventory and apply onto weapon. */
  const applySticker = useCallback(
    (
      weaponUid: string,
      stickerUid: string,
      slot: number,
    ): { ok: true; weapon: OpenedSkin } | { ok: false; error: string } => {
      if (slot < 0 || slot >= MAX_STICKER_SLOTS) {
        return { ok: false, error: 'Emplacement invalide.' }
      }
      const current = loadInventory()
      const weaponIdx = current.findIndex((x) => x.uid === weaponUid)
      const stickerIdx = current.findIndex((x) => x.uid === stickerUid)
      if (weaponIdx < 0) return { ok: false, error: 'Arme introuvable.' }
      if (stickerIdx < 0) return { ok: false, error: 'Sticker introuvable.' }
      const weapon = current[weaponIdx]!
      const sticker = current[stickerIdx]!
      if (!canAcceptStickers(weapon)) {
        return { ok: false, error: 'Cet item n’accepte pas les stickers.' }
      }
      if (!isSticker(sticker)) {
        return { ok: false, error: 'Cet item n’est pas un sticker.' }
      }
      const existing = getStickers(weapon)
      if (existing.some((s) => s.slot === slot)) {
        return { ok: false, error: 'Emplacement déjà occupé.' }
      }
      if (existing.length >= MAX_STICKER_SLOTS) {
        return { ok: false, error: 'Tous les emplacements sont remplis.' }
      }
      const applied: AppliedSticker = {
        uid: sticker.uid,
        item: { ...sticker.item, rarity: { ...sticker.item.rarity } },
        slot,
        scraped: false,
      }
      const nextWeapon: OpenedSkin = {
        ...weapon,
        stickers: [...existing, applied].sort((a, b) => a.slot - b.slot),
      }
      const next = current.filter((_, i) => i !== stickerIdx)
      const wIdx = next.findIndex((x) => x.uid === weaponUid)
      if (wIdx < 0) return { ok: false, error: 'Arme introuvable.' }
      next[wIdx] = nextWeapon
      saveInventory(next)
      setItems(next)
      return { ok: true, weapon: nextWeapon }
    },
    [],
  )

  /** Remove sticker from slot (destroyed, not returned). */
  const removeSticker = useCallback(
    (
      weaponUid: string,
      slot: number,
    ): { ok: true; weapon: OpenedSkin } | { ok: false; error: string } => {
      const current = loadInventory()
      const idx = current.findIndex((x) => x.uid === weaponUid)
      if (idx < 0) return { ok: false, error: 'Arme introuvable.' }
      const weapon = current[idx]!
      const existing = getStickers(weapon)
      if (!existing.some((s) => s.slot === slot)) {
        return { ok: false, error: 'Aucun sticker sur cet emplacement.' }
      }
      const nextWeapon: OpenedSkin = {
        ...weapon,
        stickers: existing.filter((s) => s.slot !== slot),
      }
      const next = [...current]
      next[idx] = nextWeapon
      saveInventory(next)
      setItems(next)
      return { ok: true, weapon: nextWeapon }
    },
    [],
  )

  const clear = useCallback(() => {
    clearInventoryStorage()
    setItems([])
  }, [])

  return {
    items,
    addItems,
    clear,
    count: items.length,
    removeFromInventory,
    updateSkin,
    applySticker,
    removeSticker,
  }
}
