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

  const clear = useCallback(() => {
    clearInventoryStorage()
    setItems([])
  }, [])

  return { items, addItems, clear, count: items.length }
}
