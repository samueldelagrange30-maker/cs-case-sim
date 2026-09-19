import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResultCard } from '../components/ResultCard'
import { TIER_META } from '../lib/odds'
import {
  buildTradeUpPool,
  performTradeUp,
  skinTradeTier,
  TRADEUP_INPUT_TIERS,
  TRADEUP_NEXT,
} from '../lib/tradeup'
import type { CollectionAlbum } from '../lib/collections'
import type { OpenedSkin, RarityTier } from '../types'

interface Props {
  inventory: OpenedSkin[]
  albums: CollectionAlbum[]
  albumsLoading: boolean
  onTradeUp: (inputs: OpenedSkin[], result: OpenedSkin) => void
}

export function TradeUpPage({
  inventory,
  albums,
  albumsLoading,
  onTradeUp,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<OpenedSkin | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eligible = useMemo(() => {
    return inventory.filter((s) => skinTradeTier(s) != null)
  }, [inventory])

  const selectedSkins = useMemo(() => {
    const map = new Map(inventory.map((s) => [s.uid, s]))
    return selected
      .map((uid) => map.get(uid))
      .filter((s): s is OpenedSkin => !!s)
  }, [selected, inventory])

  const commonTier: RarityTier | null = useMemo(() => {
    if (selectedSkins.length === 0) return null
    const t = skinTradeTier(selectedSkins[0]!)
    if (!t) return null
    if (!selectedSkins.every((s) => skinTradeTier(s) === t)) return null
    return t
  }, [selectedSkins])

  const poolSize = useMemo(() => {
    if (!commonTier || selectedSkins.length !== 10) return 0
    return buildTradeUpPool(selectedSkins, albums).length
  }, [commonTier, selectedSkins, albums])

  const toggle = (uid: string) => {
    setError(null)
    setResult(null)
    setSelected((prev) => {
      if (prev.includes(uid)) return prev.filter((x) => x !== uid)
      if (prev.length >= 10) return prev
      const skin = inventory.find((s) => s.uid === uid)
      if (!skin) return prev
      const tier = skinTradeTier(skin)
      if (!tier) return prev
      if (prev.length > 0) {
        const first = inventory.find((s) => s.uid === prev[0])
        if (first && skinTradeTier(first) !== tier) {
          setError('Tous les skins doivent être du même palier de rareté.')
          return prev
        }
      }
      return [...prev, uid]
    })
  }

  const clearSel = () => {
    setSelected([])
    setError(null)
    setResult(null)
  }

  const submit = () => {
    setError(null)
    if (selectedSkins.length !== 10) {
      setError('Sélectionnez exactement 10 skins du même palier.')
      return
    }
    if (albumsLoading || albums.length === 0) {
      setError('Données de collections pas encore chargées.')
      return
    }
    const res = performTradeUp(selectedSkins, albums)
    if (!res.ok) {
      setError(res.error)
      return
    }
    onTradeUp(selectedSkins, res.result)
    setResult(res.result)
    setSelected([])
  }

  const nextLabel =
    commonTier && TRADEUP_NEXT[commonTier]
      ? TIER_META[TRADEUP_NEXT[commonTier]!].label
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Trade-up</h1>
        <p className="text-sm text-muted mt-1">
          Contrat simulé : échangez 10 skins du même palier (Mil-Spec →
          Restricted → Classified → Covert). Les Covert ne peuvent pas être
          tradés. Résultat tiré parmi les skins du palier supérieur des
          collections croisées.
        </p>
        <p className="text-[11px] text-muted mt-2 border border-border/60 rounded-lg px-3 py-2 bg-panel">
          ⚠️ Simulation uniquement — aucun item CS:GO / CS2 réel, aucun argent
          réel. Les probabilités sont approximatives.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            Sélection :{' '}
            <span className="text-accent font-mono">{selected.length}/10</span>
            {commonTier && (
              <span className="ml-2 text-xs text-muted">
                ({TIER_META[commonTier].label}
                {nextLabel ? ` → ${nextLabel}` : ''})
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSel}
              className="text-xs text-muted hover:text-accent"
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              disabled={selected.length !== 10 || albumsLoading}
              onClick={submit}
              className="rounded-lg bg-accent text-bg font-bold px-4 py-2 text-sm hover:brightness-110 disabled:opacity-40 transition"
            >
              Lancer le trade-up
            </button>
          </div>
        </div>
        {selected.length === 10 && (
          <p className="text-xs text-muted">
            Pool estimé : {poolSize} skin{poolSize !== 1 ? 's' : ''} possible
            {poolSize !== 1 ? 's' : ''}
          </p>
        )}
        {error && <p className="text-sm text-covert">{error}</p>}
      </div>

      {result && (
        <div className="space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <h2 className="font-semibold text-accent">Résultat du trade-up</h2>
          <ResultCard skin={result} />
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-xs text-muted hover:text-accent"
          >
            Fermer
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">
          Inventaire éligible{' '}
          <span className="text-muted font-normal text-sm">
            ({eligible.length}) — paliers :{' '}
            {TRADEUP_INPUT_TIERS.map((t) => TIER_META[t].short).join(' / ')}
          </span>
        </h2>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">
            Aucun skin éligible.{' '}
            <Link to="/" className="text-accent hover:underline">
              Ouvrir des caisses
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {eligible.map((skin) => {
              const tier = skinTradeTier(skin)!
              const isSel = selected.includes(skin.uid)
              const blocked =
                !isSel &&
                selected.length > 0 &&
                commonTier != null &&
                tier !== commonTier
              return (
                <button
                  key={skin.uid}
                  type="button"
                  disabled={blocked || (!isSel && selected.length >= 10)}
                  onClick={() => toggle(skin.uid)}
                  className={`rounded-lg border p-2 flex flex-col items-center text-left transition disabled:opacity-30 ${
                    isSel
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/40'
                      : 'border-border bg-panel hover:border-accent/40'
                  }`}
                  style={{
                    boxShadow: `inset 0 -2px 0 ${TIER_META[tier].color}`,
                  }}
                >
                  <img
                    src={skin.item.image}
                    alt={skin.item.name}
                    className="h-16 w-16 object-contain"
                  />
                  <p className="mt-1 text-[11px] text-center line-clamp-2 text-muted">
                    {skin.isStatTrak ? 'ST™ ' : ''}
                    {skin.item.name}
                  </p>
                  <p className="text-[10px] text-muted">
                    {skin.wearLabel}
                    {skin.float != null
                      ? ` · ${skin.float.toFixed(4)}`
                      : ''}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
