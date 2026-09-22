/** Local engagement state: discovery, favorites, vitrine, wishlist, session resume. */

import { normalizeSkinName } from './normalizeName'

const KEY = 'cs-case-sim-engagement-v1'
export const VITRINE_MAX = 6

export type WishlistKind = 'skin' | 'case'

export interface WishlistEntry {
  id: string
  kind: WishlistKind
  /** Display name */
  name: string
  /** Optional image URL */
  image?: string
  /** For cases: crate id; for skins: normalized name */
  target: string
  addedAt: number
}

export interface LastDiscovered {
  name: string
  image: string
  rarityColor?: string
  caseId?: string
  at: number
}

export type AccentTheme = 'gold' | 'blue'

export interface EngagementState {
  /** Soft coach tips dismissed */
  coachDone: boolean
  /** After first successful open — goal picker shown once */
  goalPromptDone: boolean
  /** Normalized skin names ever owned (for Nouveau vs Doublon) */
  seenNames: string[]
  /** Favorited inventory item uids */
  favoriteUids: string[]
  /** Showcase inventory uids (max VITRINE_MAX) */
  vitrineUids: string[]
  wishlist: WishlistEntry[]
  /** Last opened case id for "Reprendre" */
  lastCaseId: string | null
  lastDiscovered: LastDiscovered | null
  accentTheme: AccentTheme
}

function loadRaw(): Partial<EngagementState> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Partial<EngagementState>
  } catch {
    return {}
  }
}

export function loadEngagement(): EngagementState {
  const raw = loadRaw()
  return {
    coachDone: !!raw.coachDone,
    goalPromptDone: !!raw.goalPromptDone,
    seenNames: Array.isArray(raw.seenNames)
      ? raw.seenNames.filter((x): x is string => typeof x === 'string')
      : [],
    favoriteUids: Array.isArray(raw.favoriteUids)
      ? raw.favoriteUids.filter((x): x is string => typeof x === 'string')
      : [],
    vitrineUids: Array.isArray(raw.vitrineUids)
      ? raw.vitrineUids.filter((x): x is string => typeof x === 'string').slice(0, VITRINE_MAX)
      : [],
    wishlist: Array.isArray(raw.wishlist)
      ? (raw.wishlist as WishlistEntry[]).filter(
          (w) =>
            w &&
            typeof w.id === 'string' &&
            (w.kind === 'skin' || w.kind === 'case') &&
            typeof w.name === 'string' &&
            typeof w.target === 'string',
        )
      : [],
    lastCaseId: typeof raw.lastCaseId === 'string' ? raw.lastCaseId : null,
    lastDiscovered:
      raw.lastDiscovered &&
      typeof raw.lastDiscovered === 'object' &&
      typeof (raw.lastDiscovered as LastDiscovered).name === 'string'
        ? (raw.lastDiscovered as LastDiscovered)
        : null,
    accentTheme: raw.accentTheme === 'blue' ? 'blue' : 'gold',
  }
}

export function saveEngagement(patch: Partial<EngagementState>): EngagementState {
  const next = { ...loadEngagement(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
  return next
}

export function seenNameSet(state?: EngagementState): Set<string> {
  const s = state ?? loadEngagement()
  return new Set(s.seenNames)
}

/** Returns which of the given names are new (not previously seen). Marks them as seen. */
export function markOpenedNames(names: string[]): {
  nouveaus: string[]
  doublons: string[]
  state: EngagementState
} {
  const state = loadEngagement()
  const seen = new Set(state.seenNames)
  const nouveaus: string[] = []
  const doublons: string[] = []
  for (const n of names) {
    const key = normalizeSkinName(n)
    if (seen.has(key)) doublons.push(key)
    else {
      nouveaus.push(key)
      seen.add(key)
    }
  }
  const next = saveEngagement({ seenNames: [...seen] })
  return { nouveaus, doublons, state: next }
}

export function isNouveauName(name: string, state?: EngagementState): boolean {
  const seen = seenNameSet(state)
  return !seen.has(normalizeSkinName(name))
}

/** Count how many inventory items with this normalized name already exist (before adding). */
export function countOwnedByName(
  inventoryNames: string[],
  name: string,
): number {
  const key = normalizeSkinName(name)
  return inventoryNames.filter((n) => normalizeSkinName(n) === key).length
}

export function toggleFavorite(uid: string): EngagementState {
  const s = loadEngagement()
  const set = new Set(s.favoriteUids)
  if (set.has(uid)) set.delete(uid)
  else set.add(uid)
  return saveEngagement({ favoriteUids: [...set] })
}

export function isFavorite(uid: string, state?: EngagementState): boolean {
  return (state ?? loadEngagement()).favoriteUids.includes(uid)
}

export function toggleVitrine(uid: string): EngagementState {
  const s = loadEngagement()
  const list = [...s.vitrineUids]
  const idx = list.indexOf(uid)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else if (list.length < VITRINE_MAX) {
    list.push(uid)
  }
  return saveEngagement({ vitrineUids: list })
}

export function isInVitrine(uid: string, state?: EngagementState): boolean {
  return (state ?? loadEngagement()).vitrineUids.includes(uid)
}

export function addWishlist(entry: Omit<WishlistEntry, 'id' | 'addedAt'>): EngagementState {
  const s = loadEngagement()
  const exists = s.wishlist.some(
    (w) => w.kind === entry.kind && w.target === entry.target,
  )
  if (exists) return s
  const full: WishlistEntry = {
    ...entry,
    id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    addedAt: Date.now(),
  }
  return saveEngagement({ wishlist: [...s.wishlist, full] })
}

export function removeWishlist(id: string): EngagementState {
  const s = loadEngagement()
  return saveEngagement({ wishlist: s.wishlist.filter((w) => w.id !== id) })
}

export function setLastCaseId(caseId: string): EngagementState {
  return saveEngagement({ lastCaseId: caseId })
}

export function setLastDiscovered(item: LastDiscovered): EngagementState {
  return saveEngagement({ lastDiscovered: item })
}

export function dismissCoach(): EngagementState {
  return saveEngagement({ coachDone: true })
}

export function dismissGoalPrompt(): EngagementState {
  return saveEngagement({ goalPromptDone: true })
}

export function setAccentTheme(theme: AccentTheme): EngagementState {
  return saveEngagement({ accentTheme: theme })
}

export function applyAccentTheme(theme: AccentTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'blue') {
    root.style.setProperty('--color-accent', '#4b69ff')
    root.style.setProperty('--color-accent-soft', '#6b85ff')
    root.style.setProperty('--color-accent-dim', '#3a52cc')
  } else {
    root.style.setProperty('--color-accent', '#d4a017')
    root.style.setProperty('--color-accent-soft', '#e8b84a')
    root.style.setProperty('--color-accent-dim', '#a67c12')
  }
}
