import type { OpenedSkin } from '../types'
import { getItemTier } from './odds'
import { normalizeSkinName } from './normalizeName'
import type { SimStats } from './stats'
import type { CollectionAlbum } from './collections'

export interface ChallengeDef {
  id: string
  title: string
  description: string
  /** Badge emoji / icon */
  icon: string
  /** Tailwind-ish accent color */
  color: string
  target: number
  getProgress: (ctx: ChallengeContext) => number
}

export interface ChallengeContext {
  stats: SimStats
  inventory: OpenedSkin[]
  albumsCompleted: number
}

export interface ChallengeProgress {
  def: ChallengeDef
  current: number
  target: number
  completed: boolean
  percent: number
}

function countCovert(inv: OpenedSkin[]): number {
  return inv.filter((s) => {
    if (s.isRareSpecial) return false
    return getItemTier(s.item) === 'covert'
  }).length
}

function hasKnifeOrGlove(inv: OpenedSkin[]): boolean {
  return inv.some((s) => {
    if (s.isRareSpecial) return true
    const n = s.item.name
    if (n.includes('★')) return true
    const lower = n.toLowerCase()
    return (
      lower.includes('knife') ||
      lower.includes('gloves') ||
      lower.includes('wraps') ||
      lower.includes('karambit') ||
      lower.includes('bayonet') ||
      lower.includes('butterfly')
    )
  })
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'open-10',
    title: 'Ouvrir 10 caisses',
    description: 'Ouvrez 10 caisses ou capsules.',
    icon: '📦',
    color: '#4b69ff',
    target: 10,
    getProgress: (c) => c.stats.opensCount,
  },
  {
    id: 'open-50',
    title: 'Ouvrir 50 caisses',
    description: 'Ouvrez 50 caisses ou capsules.',
    icon: '📦',
    color: '#8847ff',
    target: 50,
    getProgress: (c) => c.stats.opensCount,
  },
  {
    id: 'open-100',
    title: 'Ouvrir 100 caisses',
    description: 'Ouvrez 100 caisses ou capsules.',
    icon: '📦',
    color: '#d32ce6',
    target: 100,
    getProgress: (c) => c.stats.opensCount,
  },
  {
    id: 'covert-1',
    title: 'Premier Covert',
    description: 'Possédez au moins 1 skin Covert.',
    icon: '🔴',
    color: '#eb4b4b',
    target: 1,
    getProgress: (c) => countCovert(c.inventory),
  },
  {
    id: 'covert-5',
    title: 'Collection Covert',
    description: 'Possédez 5 skins Covert.',
    icon: '🔥',
    color: '#eb4b4b',
    target: 5,
    getProgress: (c) => countCovert(c.inventory),
  },
  {
    id: 'knife-glove-1',
    title: 'Premier couteau / gant',
    description: 'Obtenez un Rare Special, couteau ou gant (★).',
    icon: '★',
    color: '#ffd700',
    target: 1,
    getProgress: (c) => (hasKnifeOrGlove(c.inventory) ? 1 : 0),
  },
  {
    id: 'album-1',
    title: 'Album complet',
    description: 'Complétez 1 album de collection à 100 %.',
    icon: '💿',
    color: '#d4a017',
    target: 1,
    getProgress: (c) => c.albumsCompleted,
  },
  {
    id: 'tradeup-1',
    title: 'Premier trade-up',
    description: 'Réussissez 1 contrat de trade-up.',
    icon: '⬆️',
    color: '#5e98d9',
    target: 1,
    getProgress: (c) => c.stats.tradeUpsCount,
  },
  {
    id: 'market-sell-5',
    title: 'Vendeur du marché',
    description: 'Vendez 5 items sur le marché simulé.',
    icon: '💰',
    color: '#4b69ff',
    target: 5,
    getProgress: (c) => c.stats.marketSoldCount,
  },
  {
    id: 'inv-25',
    title: 'Inventaire 25',
    description: 'Possédez 25 items en inventaire.',
    icon: '🎒',
    color: '#8847ff',
    target: 25,
    getProgress: (c) => c.inventory.length,
  },
  {
    id: 'inv-100',
    title: 'Inventaire 100',
    description: 'Possédez 100 items en inventaire.',
    icon: '🏆',
    color: '#d32ce6',
    target: 100,
    getProgress: (c) => c.inventory.length,
  },
]

export function evaluateChallenges(ctx: ChallengeContext): ChallengeProgress[] {
  return CHALLENGES.map((def) => {
    const current = Math.min(def.getProgress(ctx), def.target)
    const completed = current >= def.target
    const percent =
      def.target <= 0 ? 100 : Math.min(100, Math.round((current / def.target) * 100))
    return { def, current, target: def.target, completed, percent }
  })
}

/** Owned set of normalized collection item names from inventory. */
export function ownedNameSet(inventory: OpenedSkin[]): Set<string> {
  const set = new Set<string>()
  for (const s of inventory) {
    set.add(normalizeSkinName(s.item.name))
  }
  return set
}

export function countCompletedAlbums(
  albums: CollectionAlbum[],
  inventory: OpenedSkin[],
): number {
  const owned = ownedNameSet(inventory)
  let n = 0
  for (const a of albums) {
    if (a.items.length === 0) continue
    const all = a.items.every((it) => owned.has(normalizeSkinName(it.name)))
    if (all) n += 1
  }
  return n
}
