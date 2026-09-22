/** Personal goals — cosmetic progress only; never alters drop odds. */

import type { OpenedSkin } from '../types'
import type { CollectionAlbum } from './collections'
import { ownedNameSet } from './challenges'
import { normalizeSkinName } from './normalizeName'
import {
  loadEngagement,
  VITRINE_MAX,
  type WishlistEntry,
} from './engagement'
import type { SimStats } from './stats'

const KEY = 'cs-case-sim-goals-v1'

export type GoalKind =
  | 'complete_album'
  | 'open_n_cases'
  | 'open_n_different_cases'
  | 'fill_vitrine'
  | 'find_wishlist'
  | 'own_n_unique'

export interface ActiveGoal {
  id: string
  kind: GoalKind
  title: string
  /** Target count when applicable */
  target: number
  /** Album id / wishlist id / etc. */
  ref?: string
  /** Display label for ref */
  refLabel?: string
  startedAt: number
  completedAt: number | null
}

export interface GoalTemplate {
  id: string
  kind: GoalKind
  title: string
  description: string
  target: number
  /** Needs album picker */
  needsAlbum?: boolean
  /** Needs wishlist item */
  needsWishlist?: boolean
  icon: string
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'tpl-album',
    kind: 'complete_album',
    title: 'Compléter un album',
    description: 'Remplir un album de collection à 100 %.',
    target: 100,
    needsAlbum: true,
    icon: '💿',
  },
  {
    id: 'tpl-open-10',
    kind: 'open_n_cases',
    title: 'Ouvrir 10 caisses',
    description: 'Atteindre 10 ouvertures au total.',
    target: 10,
    icon: '📦',
  },
  {
    id: 'tpl-open-25',
    kind: 'open_n_cases',
    title: 'Ouvrir 25 caisses',
    description: 'Atteindre 25 ouvertures au total.',
    target: 25,
    icon: '📦',
  },
  {
    id: 'tpl-diff-5',
    kind: 'open_n_different_cases',
    title: '5 caisses différentes',
    description: 'Ouvrir au moins 5 caisses distinctes.',
    target: 5,
    icon: '🎲',
  },
  {
    id: 'tpl-vitrine',
    kind: 'fill_vitrine',
    title: 'Remplir la vitrine',
    description: `Placer ${VITRINE_MAX} items en vitrine.`,
    target: VITRINE_MAX,
    icon: '✨',
  },
  {
    id: 'tpl-wishlist',
    kind: 'find_wishlist',
    title: 'Trouver un souhait',
    description: 'Obtenir un item de votre wishlist.',
    target: 1,
    needsWishlist: true,
    icon: '⭐',
  },
  {
    id: 'tpl-unique-20',
    kind: 'own_n_unique',
    title: '20 skins uniques',
    description: 'Posséder 20 skins différents (noms).',
    target: 20,
    icon: '🎒',
  },
]

export interface GoalProgress {
  current: number
  target: number
  percent: number
  completed: boolean
  hint: string
  /** Suggested next route */
  ctaPath?: string
  ctaLabel?: string
}

function loadRaw(): ActiveGoal | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const g = JSON.parse(raw) as ActiveGoal
    if (!g?.id || !g.kind) return null
    return g
  } catch {
    return null
  }
}

export function loadActiveGoal(): ActiveGoal | null {
  return loadRaw()
}

export function saveActiveGoal(goal: ActiveGoal | null): void {
  if (!goal) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, JSON.stringify(goal))
}

export function clearActiveGoal(): void {
  saveActiveGoal(null)
}

export function setActiveGoalFromTemplate(
  tpl: GoalTemplate,
  opts?: { album?: CollectionAlbum; wishlist?: WishlistEntry },
): ActiveGoal {
  let title = tpl.title
  let ref: string | undefined
  let refLabel: string | undefined
  let target = tpl.target

  if (tpl.kind === 'complete_album' && opts?.album) {
    ref = opts.album.id
    refLabel = opts.album.name
    title = `Compléter : ${opts.album.name}`
    target = opts.album.items.length || 1
  }
  if (tpl.kind === 'find_wishlist' && opts?.wishlist) {
    ref = opts.wishlist.id
    refLabel = opts.wishlist.name
    title = `Trouver : ${opts.wishlist.name}`
    target = 1
  }

  const goal: ActiveGoal = {
    id: `goal-${Date.now()}`,
    kind: tpl.kind,
    title,
    target,
    ref,
    refLabel,
    startedAt: Date.now(),
    completedAt: null,
  }
  saveActiveGoal(goal)
  return goal
}

export interface GoalEvalContext {
  goal: ActiveGoal
  inventory: OpenedSkin[]
  albums: CollectionAlbum[]
  stats: SimStats
  /** Distinct case ids ever opened — approximate via inventory caseId */
  vitrineCount: number
  wishlist: WishlistEntry[]
}

export function evaluateGoal(ctx: GoalEvalContext): GoalProgress {
  const { goal, inventory, albums, stats, vitrineCount, wishlist } = ctx
  const owned = ownedNameSet(inventory)
  let current = 0
  let target = goal.target
  let hint = ''
  let ctaPath: string | undefined
  let ctaLabel: string | undefined

  switch (goal.kind) {
    case 'complete_album': {
      const album = albums.find((a) => a.id === goal.ref)
      if (!album) {
        hint = 'Choisissez un album dans Collection.'
        ctaPath = '/collection'
        ctaLabel = 'Albums'
        break
      }
      target = album.items.length || 1
      current = album.items.filter((it) =>
        owned.has(normalizeSkinName(it.name)),
      ).length
      hint = `${current}/${target} skins de l’album`
      ctaPath = `/collection?album=${encodeURIComponent(album.id)}`
      ctaLabel = 'Voir l’album'
      break
    }
    case 'open_n_cases': {
      current = stats.opensCount
      target = goal.target
      hint = `${current}/${target} ouvertures`
      ctaPath = '/caisses'
      ctaLabel = 'Ouvrir'
      break
    }
    case 'open_n_different_cases': {
      const ids = new Set(
        inventory.map((s) => s.caseId).filter((id) => !!id),
      )
      current = ids.size
      target = goal.target
      hint = `${current}/${target} caisses distinctes`
      ctaPath = '/caisses'
      ctaLabel = 'Catalogue'
      break
    }
    case 'fill_vitrine': {
      current = vitrineCount
      target = VITRINE_MAX
      hint = `${current}/${target} en vitrine`
      ctaPath = '/inventory'
      ctaLabel = 'Inventaire'
      break
    }
    case 'find_wishlist': {
      const wl =
        wishlist.find((w) => w.id === goal.ref) ?? wishlist[0] ?? null
      if (!wl) {
        hint = 'Ajoutez un item à la wishlist.'
        ctaPath = '/collection'
        ctaLabel = 'Collection'
        break
      }
      if (wl.kind === 'case') {
        const has = inventory.some((s) => s.caseId === wl.target)
        current = has ? 1 : 0
        target = 1
        hint = has ? 'Caisse ouverte !' : `Ouvrir : ${wl.name}`
        ctaPath = `/case/${encodeURIComponent(wl.target)}`
        ctaLabel = 'Ouvrir'
      } else {
        const has = owned.has(normalizeSkinName(wl.target))
        current = has ? 1 : 0
        target = 1
        hint = has ? 'Trouvé !' : `Chercher : ${wl.name}`
        ctaPath = `/caisses?q=${encodeURIComponent(wl.name)}`
        ctaLabel = 'Rechercher'
      }
      break
    }
    case 'own_n_unique': {
      current = owned.size
      target = goal.target
      hint = `${current}/${target} uniques`
      ctaPath = '/caisses'
      ctaLabel = 'Ouvrir'
      break
    }
    default:
      hint = 'Objectif en cours'
  }

  const percent =
    target <= 0 ? 100 : Math.min(100, Math.round((current / target) * 100))
  const completed = current >= target && target > 0

  return {
    current: Math.min(current, target),
    target,
    percent,
    completed,
    hint,
    ctaPath,
    ctaLabel,
  }
}

/** Best incomplete album for resume card. */
export function bestIncompleteAlbum(
  albums: CollectionAlbum[],
  inventory: OpenedSkin[],
): { album: CollectionAlbum; have: number; total: number; pct: number } | null {
  const owned = ownedNameSet(inventory)
  let best: {
    album: CollectionAlbum
    have: number
    total: number
    pct: number
  } | null = null
  for (const a of albums) {
    const total = a.items.length
    if (total === 0) continue
    const have = a.items.filter((it) =>
      owned.has(normalizeSkinName(it.name)),
    ).length
    if (have === 0 || have >= total) continue
    const pct = Math.round((have / total) * 100)
    if (!best || pct > best.pct || (pct === best.pct && have > best.have)) {
      best = { album: a, have, total, pct }
    }
  }
  return best
}

export function nextStepForGoal(progress: GoalProgress): string {
  if (progress.completed) return 'Objectif atteint — choisissez-en un nouveau !'
  return progress.hint
}

/** Sync engagement wishlist into eval without circular imports in callers. */
export function engagementWishlist(): WishlistEntry[] {
  return loadEngagement().wishlist
}
