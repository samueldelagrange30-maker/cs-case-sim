import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OpenOverlay } from '../components/OpenOverlay'
import { ResultCard } from '../components/ResultCard'
import { useCrate } from '../hooks/useCrate'
import { typeLabel } from '../lib/crateTypes'
import {
  crateHasWear,
  groupByTier,
  oddsBlurb,
  openMultiple,
  TIER_META,
} from '../lib/odds'
import type { OpenedSkin, RarityTier } from '../types'

const TIER_ORDER: RarityTier[] = [
  'consumer',
  'industrial',
  'milspec',
  'restricted',
  'classified',
  'covert',
  'rare',
]

interface Props {
  onOpened: (skins: OpenedSkin[]) => void
}

type Phase = 'idle' | 'spinning' | 'results'

export function CasePage({ onOpened }: Props) {
  const { id } = useParams()
  const { crate: caseData, loading, error } = useCrate(
    id ? decodeURIComponent(id) : undefined,
  )

  const [phase, setPhase] = useState<Phase>('idle')
  const [pending, setPending] = useState<OpenedSkin[]>([])
  const [lastResults, setLastResults] = useState<OpenedSkin[]>([])

  const pendingRef = useRef<OpenedSkin[]>([])
  const addedRef = useRef(false)
  const onOpenedRef = useRef(onOpened)
  onOpenedRef.current = onOpened

  const groups = useMemo(
    () => (caseData ? groupByTier(caseData) : null),
    [caseData],
  )

  const startOpen = useCallback(
    (n: number) => {
      if (!caseData || phase === 'spinning') return
      const skins = openMultiple(caseData, n)
      pendingRef.current = skins
      addedRef.current = false
      setPending(skins)
      setLastResults([])
      setPhase('spinning')
    },
    [caseData, phase],
  )

  /** Inventory add exactly once with the skins that were spun. */
  const commitOpened = useCallback(() => {
    const skins = pendingRef.current
    if (!addedRef.current && skins.length > 0) {
      addedRef.current = true
      onOpenedRef.current(skins)
    }
    setLastResults(skins)
    setPending([])
    pendingRef.current = skins
    setPhase('results')
  }, [])

  const handleOverlayDone = useCallback(() => {
    commitOpened()
  }, [commitOpened])

  const handleReopenOne = useCallback(() => {
    if (!caseData) return
    const skins = openMultiple(caseData, 1)
    pendingRef.current = skins
    addedRef.current = false
    setPending(skins)
    setLastResults([])
    setPhase('spinning')
  }, [caseData])

  if (loading) {
    return <p className="text-center text-muted py-20">Chargement…</p>
  }

  if (error || !caseData || !groups) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted">Caisse introuvable.</p>
        <Link to="/" className="text-accent hover:underline">
          ← Retour
        </Link>
      </div>
    )
  }

  const showWear = crateHasWear(caseData.type)

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="text-sm text-muted hover:text-accent transition"
        >
          ← Toutes les caisses &amp; capsules
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-40 h-40 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center rounded-2xl border border-border bg-panel p-4">
          <img
            src={caseData.image}
            alt={caseData.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3">
          <p className="text-xs uppercase tracking-wide text-accent">
            {typeLabel(caseData.type)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">{caseData.name}</h1>
          <p className="text-sm text-muted">{oddsBlurb(caseData)}</p>
          {!showWear && (
            <p className="text-xs text-muted">
              Usure / float : N/A (pas applicable à ce type)
            </p>
          )}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
            <button
              type="button"
              disabled={phase === 'spinning'}
              onClick={() => startOpen(1)}
              className="rounded-lg bg-accent text-bg font-bold px-5 py-2.5 text-sm hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-accent/20"
            >
              Ouvrir ×1
            </button>
            <button
              type="button"
              disabled={phase === 'spinning'}
              onClick={() => startOpen(5)}
              className="rounded-lg border border-accent/60 bg-accent/10 text-accent font-semibold px-4 py-2.5 text-sm hover:bg-accent/20 disabled:opacity-50 transition"
            >
              Ouvrir ×5
            </button>
            <button
              type="button"
              disabled={phase === 'spinning'}
              onClick={() => startOpen(10)}
              className="rounded-lg border border-accent/60 bg-accent/10 text-accent font-semibold px-4 py-2.5 text-sm hover:bg-accent/20 disabled:opacity-50 transition"
            >
              Ouvrir ×10
            </button>
          </div>
        </div>
      </div>

      {phase === 'spinning' && pending.length > 0 && (
        <OpenOverlay
          caseData={caseData}
          winners={pending}
          onDone={handleOverlayDone}
          onReopenOne={handleReopenOne}
        />
      )}

      {phase === 'results' && lastResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Résultat{lastResults.length > 1 ? 's' : ''}
          </h2>
          <div className="grid gap-3">
            {lastResults.map((s) => (
              <ResultCard key={s.uid} skin={s} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase('idle')}
            className="text-sm text-muted hover:text-accent"
          >
            Fermer les résultats
          </button>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          Contenu
        </h2>
        {TIER_ORDER.map((tier) => {
          const items = groups[tier]
          if (!items.length) return null
          const meta = TIER_META[tier]
          return (
            <div key={tier} className="space-y-3">
              <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label}{' '}
                <span className="text-muted font-normal normal-case">
                  ({items.length})
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-panel p-2 flex flex-col items-center"
                    style={{
                      borderColor: `${meta.color}55`,
                      boxShadow: `inset 0 -2px 0 ${meta.color}`,
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-20 w-20 object-contain"
                    />
                    <p className="mt-1 text-[11px] text-center line-clamp-2 text-muted">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
