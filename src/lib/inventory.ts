import type { AppliedSticker, OpenedSkin } from '../types'

const KEY = 'cs-case-sim-inventory-v1'

function normalizeStickers(raw: unknown): AppliedSticker[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (s): s is AppliedSticker =>
        !!s &&
        typeof s === 'object' &&
        typeof (s as AppliedSticker).uid === 'string' &&
        typeof (s as AppliedSticker).slot === 'number' &&
        !!(s as AppliedSticker).item,
    )
    .map((s) => ({
      uid: s.uid,
      item: s.item,
      slot: Math.max(0, Math.min(4, Math.floor(s.slot))),
      scraped: !!s.scraped,
    }))
}


function seedFromUid(uid: string): number {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0
  return h % 1001
}

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
    paintSeed:
      typeof raw.paintSeed === 'number' && Number.isFinite(raw.paintSeed)
        ? Math.floor(raw.paintSeed)
        : hasWear
          ? seedFromUid(raw.uid ?? '')
          : null,
    hasWear,
    isStatTrak: !!raw.isStatTrak,
    isRareSpecial: !!raw.isRareSpecial,
    openedAt: raw.openedAt ?? Date.now(),
    stickers: normalizeStickers(raw.stickers),
    collections: Array.isArray(raw.collections)
      ? raw.collections.filter((x): x is string => typeof x === 'string')
      : undefined,
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
