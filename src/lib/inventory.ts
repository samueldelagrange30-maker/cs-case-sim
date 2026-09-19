import type { OpenedSkin } from '../types'

const KEY = 'cs-case-sim-inventory-v1'

export function loadInventory(): OpenedSkin[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OpenedSkin[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveInventory(items: OpenedSkin[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function clearInventoryStorage(): void {
  localStorage.removeItem(KEY)
}
