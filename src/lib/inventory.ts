import type { OpenedSkin } from '../types'

const KEY = 'cs-case-sim-inventory-v1'

function normalize(raw: Partial<OpenedSkin> & { item: OpenedSkin['item'] }): OpenedSkin {
  const hasWear =
    raw.hasWear ??
    (raw.float != null && raw.wear != null && raw.wearLabel !== 'N/A')
  return {
    uid: raw.uid ?? `${Date.now()}-${Math.random()}`,
    caseId: raw.caseId ?? '',
    caseName: raw.caseName ?? '',
    crateType: raw.crateType ?? 'Case',
    item: raw.item,
    wear: hasWear ? (raw.wear ?? null) : null,
    wearLabel: hasWear ? (raw.wearLabel ?? 'Factory New') : 'N/A',
    float: hasWear ? (raw.float ?? null) : null,
    hasWear,
    isStatTrak: !!raw.isStatTrak,
    isRareSpecial: !!raw.isRareSpecial,
    openedAt: raw.openedAt ?? Date.now(),
  }
}

export function loadInventory(): OpenedSkin[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x) => x && typeof x === 'object' && 'item' in x)
      .map((x) => normalize(x as Partial<OpenedSkin> & { item: OpenedSkin['item'] }))
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
