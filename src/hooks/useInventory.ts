import { useCallback, useEffect, useState } from 'react'
import type { OpenedSkin } from '../types'
import {
  clearInventoryStorage,
  loadInventory,
  saveInventory,
} from '../lib/inventory'
import { getStickers } from '../lib/stickers'

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


  const removeMany = useCallback((uids: string[]): OpenedSkin[] => {
    const want = new Set(uids)
    const current = loadInventory()
    const removed: OpenedSkin[] = []
    const next: OpenedSkin[] = []
    for (const item of current) {
      if (want.has(item.uid)) {
        removed.push(item)
        want.delete(item.uid)
      } else {
        next.push(item)
      }
    }
    if (removed.length === 0) return []
    saveInventory(next)
    setItems(next)
    return removed
  }, [])

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
    removeMany,
    updateSkin,
  }
}
