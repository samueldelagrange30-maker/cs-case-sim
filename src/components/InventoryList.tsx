import { useMemo, useState } from 'react'
import type { OpenedSkin, RarityTier } from '../types'
import { displayName, getItemTier, rarityColor, TIER_META } from '../lib/odds'
import { getStickers } from '../lib/stickers'
import { normalizeSkinName } from '../lib/normalizeName'
import { VITRINE_MAX } from '../lib/engagement'

interface Props {
  items: OpenedSkin[]
  onListForSale?: (skin: OpenedSkin) => void
  onInspect?: (skin: OpenedSkin) => void
  favoriteUids?: string[]
  vitrineUids?: string[]
  onToggleFavorite?: (uid: string) => void
  onToggleVitrine?: (uid: string) => void
  onWishlistSkin?: (skin: OpenedSkin) => void
}

type SortKey = 'newest' | 'oldest' | 'name' | 'rarity' | 'float'

const TIER_RANK: Record<RarityTier, number> = {
  rare: 6,
  covert: 5,
  classified: 4,
  restricted: 3,
  milspec: 2,
  industrial: 1,
  consumer: 0,
}

const FILTER_TIERS: { key: 'all' | RarityTier; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'rare', label: '★ Rare' },
  { key: 'covert', label: 'Covert' },
  { key: 'classified', label: 'Classified' },
  { key: 'restricted', label: 'Restricted' },
  { key: 'milspec', label: 'Mil-Spec' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'consumer', label: 'Consumer' },
]

export function InventoryList({
  items,
  onListForSale,
  onInspect,
  favoriteUids = [],
  vitrineUids = [],
  onToggleFavorite,
  onToggleVitrine,
  onWishlistSkin,
}: Props) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [tier, setTier] = useState<'all' | RarityTier>('all')
  const [stOnly, setStOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)

  const nameCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of items) {
      const k = normalizeSkinName(s.item.name)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = items.filter((skin) => {
      if (!skin?.item) return false
      const t = getItemTier(skin.item, skin.isRareSpecial)
      if (tier !== 'all' && t !== tier) return false
      if (stOnly && !skin.isStatTrak) return false
      if (favOnly && !favoriteUids.includes(skin.uid)) return false
      if (!query) return true
      const hay = `${skin.item.name} ${skin.caseName} ${skin.wearLabel ?? ''}`.toLowerCase()
      return hay.includes(query)
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.openedAt ?? 0) - (b.openedAt ?? 0)
        case 'name':
          return displayName(a).localeCompare(displayName(b), 'fr')
        case 'rarity': {
          const ra = TIER_RANK[getItemTier(a.item, a.isRareSpecial)] ?? 0
          const rb = TIER_RANK[getItemTier(b.item, b.isRareSpecial)] ?? 0
          return rb - ra
        }
        case 'float': {
          const fa = a.float ?? 2
          const fb = b.float ?? 2
          return fa - fb
        }
        case 'newest':
        default:
          return (b.openedAt ?? 0) - (a.openedAt ?? 0)
      }
    })
    return list
  }, [items, q, sort, tier, stOnly, favOnly, favoriteUids])

  const vitrineItems = useMemo(
    () =>
      vitrineUids
        .map((uid) => items.find((i) => i.uid === uid))
        .filter((x): x is OpenedSkin => !!x),
    [vitrineUids, items],
  )

  if (items.length === 0) {
    return (
      <div className="surface p-10 text-center space-y-3">
        <p className="text-muted">Inventaire vide</p>
        <p className="body-muted text-sm">
          Ouvrez des caisses ou capsules pour commencer.
        </p>
        <p className="text-xs text-muted">Allez dans Caisses pour ouvrir.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {vitrineItems.length > 0 && (
        <div className="surface p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-accent">
              Vitrine ({vitrineItems.length}/{VITRINE_MAX})
            </h2>
            <p className="text-[10px] text-muted">Sur cet appareil</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {vitrineItems.map((skin) => (
              <button
                key={skin.uid}
                type="button"
                onClick={() => onInspect?.(skin)}
                className="h-16 w-16 rounded-lg border border-accent/40 bg-[#0a0d12] p-1 hover:brightness-110"
                title={skin.item.name}
              >
                <img
                  src={skin.item.image}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="block flex-1 min-w-0">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un skin…"
            className="input-field"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="shrink-0">
          <span className="sr-only">Trier</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-field min-w-[10rem]"
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="rarity">Rareté</option>
            <option value="name">Nom A→Z</option>
            <option value="float">Float (bas→haut)</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TIERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setTier(f.key)}
            className={`chip min-h-11 ${tier === f.key ? 'chip-active' : ''}`}
            aria-pressed={tier === f.key}
            style={
              f.key !== 'all'
                ? { borderColor: `${TIER_META[f.key].color}66` }
                : undefined
            }
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setStOnly((v) => !v)}
          className={`chip min-h-11 ${stOnly ? 'chip-active' : ''}`}
          aria-pressed={stOnly}
        >
          StatTrak™
        </button>
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          className={`chip min-h-11 ${favOnly ? 'chip-active' : ''}`}
          aria-pressed={favOnly}
        >
          ★ Favoris
        </button>
      </div>

      <p className="text-xs text-muted">
        {filtered.length} / {items.length} item{items.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-12">Aucun résultat pour ces filtres.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((skin) => {
            const color = rarityColor(skin)
            const stickers = getStickers(skin)
            const key = normalizeSkinName(skin.item.name)
            const count = nameCounts.get(key) ?? 1
            const isDup = count > 1
            const isFav = favoriteUids.includes(skin.uid)
            const inVit = vitrineUids.includes(skin.uid)
            return (
              <li
                key={skin.uid}
                className="rounded-lg border bg-panel overflow-hidden flex flex-col"
                style={{
                  borderColor: `${color}88`,
                  boxShadow: `inset 0 -2px 0 ${color}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onInspect?.(skin)}
                  className="aspect-square flex items-center justify-center bg-[#0a0d12] p-2 relative hover:brightness-110 transition text-left w-full min-h-[44px]"
                  title="Inspecter"
                >
                  <img
                    src={skin.item.image}
                    alt={skin.item.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                  <span
                    className={`absolute top-1 left-1 text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                      isDup
                        ? 'bg-panel-2/90 text-muted border border-border'
                        : 'bg-success/90 text-[#0a0d12]'
                    }`}
                  >
                    {isDup ? 'Doublon' : 'Unique'}
                  </span>
                  {stickers.length > 0 && (
                    <span className="absolute bottom-1 right-1 flex -space-x-1">
                      {stickers.slice(0, 5).map((s) => (
                        <img
                          key={`${s.uid}-${s.slot}`}
                          src={s.item.image}
                          alt=""
                          className="h-5 w-5 rounded-full border border-border bg-panel object-contain"
                        />
                      ))}
                    </span>
                  )}
                </button>
                <div className="p-2 space-y-0.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-semibold" style={{ color }}>
                      {skin.isRareSpecial ? '★ Rare' : skin.item.rarity.name}
                      {skin.isStatTrak ? ' · ST' : ''}
                    </p>
                    <div className="flex gap-0.5">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          className={`text-sm min-h-8 min-w-8 ${
                            isFav ? 'text-accent' : 'text-muted hover:text-accent'
                          }`}
                          title={isFav ? 'Retirer des favoris' : 'Favori'}
                          onClick={() => onToggleFavorite(skin.uid)}
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                      )}
                      {onToggleVitrine && (
                        <button
                          type="button"
                          className={`text-[11px] min-h-8 px-1 ${
                            inVit ? 'text-accent' : 'text-muted hover:text-accent'
                          }`}
                          title={
                            inVit
                              ? 'Retirer de la vitrine'
                              : vitrineUids.length >= VITRINE_MAX
                                ? 'Vitrine pleine'
                                : 'Ajouter à la vitrine'
                          }
                          onClick={() => onToggleVitrine(skin.uid)}
                        >
                          {inVit ? '◆' : '◇'}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspect?.(skin)}
                    className="text-xs font-medium line-clamp-2 leading-snug text-left hover:text-accent min-h-[2.5rem]"
                  >
                    {displayName(skin)}
                  </button>
                  <p className="text-[10px] text-muted font-mono">
                    {skin.hasWear && skin.float != null && skin.wear
                      ? `${skin.wear} · ${skin.float.toFixed(4)}`
                      : 'N/A'}
                    {stickers.length > 0 ? ` · ${stickers.length} stk` : ''}
                  </p>
                  <div className="mt-auto space-y-1 pt-1">
                    {onWishlistSkin && (
                      <button
                        type="button"
                        onClick={() => onWishlistSkin(skin)}
                        className="w-full rounded-md border border-border text-muted text-[10px] font-semibold py-1.5 hover:text-accent hover:border-accent/40"
                      >
                        + Wishlist
                      </button>
                    )}
                    {onListForSale && (
                      <button
                        type="button"
                        onClick={() => onListForSale(skin)}
                        className="w-full rounded-md bg-accent/15 text-accent text-[11px] font-semibold py-2.5 min-h-11 hover:bg-accent/25 transition"
                      >
                        Mettre en vente
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
