import { useCallback, useEffect, useState } from 'react'
import type { OpenedSkin } from '../types'
import {
  clearInventoryStorage,
  loadInventory,
  saveInventory,
} from '../lib/inventory'

export function useInventory() {
  const [items, setItems] = useState<OpenedSkin[]>([])

  useEffect(() => {
    setItems(loadInventory())
  }, [])

  const addItems = useCallback((newItems: OpenedSkin[]) => {
    setItems((prev) => {
      const next = [...newItems, ...prev]
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
  }
}
