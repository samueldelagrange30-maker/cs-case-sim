import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OpenOverlay } from '../components/OpenOverlay'
import { SkinRarityCard } from '../components/SkinRarityCard'
import { ResultCard } from '../components/ResultCard'
import { InspectModal } from '../components/inspect/InspectModal'
import { useCrate } from '../hooks/useCrate'
import { typeLabel } from '../lib/crateTypes'
import {
  crateHasWear,
  groupByTier,
  oddsBlurb,
  openMultiple,
  TIER_META,
} from '../lib/odds'
import { CHARGES_ENABLED } from '../lib/charges'
import { resumeAudio } from '../lib/sfx'
import { previewOpenedFromItem } from '../lib/skinHub'
import type { OpenedSkin, RarityTier, SaleRecord } from '../types'

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
  onOpened: (skins: OpenedSkin[], caseId?: string) => void
  sales?: SaleRecord[]
  charges: number
  tryConsume: (n: number) => boolean
  isNewDiscovery?: (name: string) => boolean
}

type Phase = 'idle' | 'spinning' | 'results'

export function CasePage({ onOpened, sales = [], charges, tryConsume, isNewDiscovery }: Props) {
  const { id } = useParams()
  const { crate: caseData, loading, error } = useCrate(
    id ? decodeURIComponent(id) : undefined,
  )

  const [phase, setPhase] = useState<Phase>('idle')
  const [pending, setPending] = useState<OpenedSkin[]>([])
  const [lastResults, setLastResults] = useState<OpenedSkin[]>([])
  const [inspectSkin, setInspectSkin] = useState<OpenedSkin | null>(null)
  const [openCount, setOpenCount] = useState<1 | 5 | 10>(1)

  const pendingRef = useRef<OpenedSkin[]>([])
  const addedRef = useRef(false)
  const openLockRef = useRef(false)
  const onOpenedRef = useRef(onOpened)
  onOpenedRef.current = onOpened

  const groups = useMemo(
    () => (caseData ? groupByTier(caseData) : null),
    [caseData],
  )

  const startOpen = useCallback(
    (n: number) => {
      if (!caseData || phase === 'spinning' || openLockRef.current) return
      if (CHARGES_ENABLED) {
        if (charges < n) return
        if (!tryConsume(n)) return
      }
      openLockRef.current = true
      void resumeAudio()
      const skins = openMultiple(caseData, n)
      pendingRef.current = skins
      addedRef.current = false
      setPending(skins)
      setLastResults([])
      setPhase('spinning')
    },
    [caseData, phase, charges, tryConsume],
  )

  /** Inventory add exactly once with the skins that were spun. */
  const commitOpened = useCallback(() => {
    const skins = pendingRef.current
    if (!addedRef.current && skins.length > 0) {
      addedRef.current = true
      const cid = caseData?.id ?? skins[0]?.caseId
      onOpenedRef.current(skins, cid)
    }
    setLastResults(skins)
    setPending([])
    pendingRef.current = skins
    openLockRef.current = false
    setPhase('results')
  }, [caseData?.id])

  const handleOverlayDone = useCallback(() => {
    commitOpened()
  }, [commitOpened])

  const handleReopenOne = useCallback(() => {
    if (!caseData || openLockRef.current) return
    if (CHARGES_ENABLED) {
      if (charges < 1) return
      if (!tryConsume(1)) return
    }
    openLockRef.current = true
    const skins = openMultiple(caseData, 1)
    pendingRef.current = skins
    addedRef.current = false
    setPending(skins)
    setLastResults([])
    setPhase('spinning')
  }, [caseData, charges, tryConsume])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <p className="text-muted text-sm">Chargement de la caisse…</p>
      </div>
    )
  }

  if (error || !caseData || !groups) {
    return (
      <div className="text-center py-20 space-y-4 surface p-8 max-w-md mx-auto">
        <p className="text-covert font-semibold">Caisse introuvable</p>
        <p className="body-muted">
          {error ?? 'Cette caisse n’existe pas ou n’a pas pu être chargée.'}
        </p>
        <Link to="/caisses" className="btn btn-primary">
          ← Retour au catalogue
        </Link>
      </div>
    )
  }

  const showWear = crateHasWear(caseData.type)
  const opening = phase === 'spinning'
  const canOpen = !opening && (!CHARGES_ENABLED || charges >= openCount)

  return (
    <div className="space-y-8" aria-hidden={opening || undefined}>
      <div
        className={
          opening
            ? 'invisible h-0 overflow-hidden pointer-events-none'
            : undefined
        }
      >
        <div>
          <Link
            to="/caisses"
            className="text-sm text-muted hover:text-accent transition inline-flex min-h-11 items-center"
          >
            ← Toutes les caisses &amp; capsules
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mt-4">
          <div className="w-44 h-44 sm:w-52 sm:h-52 shrink-0 flex items-center justify-center rounded-2xl border border-border bg-gradient-to-b from-panel-2 to-[#0a0d12] p-4 shadow-lg shadow-black/40">
            <img
              src={caseData.image}
              alt={caseData.name}
              className="max-h-full max-w-full object-contain drop-shadow-xl"
            />
          </div>
          <div className="flex-1 text-center md:text-left space-y-3 w-full">
            <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">
              {typeLabel(caseData.type)}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold title-display">
              {caseData.name}
            </h1>
            <p className="text-sm text-muted leading-relaxed">{oddsBlurb(caseData)}</p>
            <p className="text-[11px] text-muted">
              $SIM fictif — probabilités honnêtes, aucun argent réel.
              {!showWear ? ' · Usure / float : N/A' : ''}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              {([1, 5, 10] as const).map((n) => {
                const active = openCount === n
                const enough = !CHARGES_ENABLED || charges >= n
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={opening || !enough}
                    onClick={() => setOpenCount(n)}
                    className={`chip min-h-11 px-4 ${active ? 'chip-active' : ''}`}
                    aria-pressed={active}
                  >
                    ×{n}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
              <button
                type="button"
                disabled={!canOpen}
                onClick={() => startOpen(openCount)}
                className="btn btn-primary btn-lg min-w-[10rem]"
              >
                Ouvrir ×{openCount}
              </button>
            </div>

            {CHARGES_ENABLED && charges < 1 ? (
              <p className="text-xs text-covert pt-1">
                Pas assez d’ouvertures — attendez la prochaine charge (1 toutes
                les 10 min).
              </p>
            ) : CHARGES_ENABLED && charges < 10 ? (
              <p className="text-xs text-muted pt-1">
                Ouvertures disponibles : {charges}/10
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {phase === 'spinning' && pending.length > 0 && (
        <OpenOverlay
          caseData={caseData}
          winners={pending}
          onDone={handleOverlayDone}
          onReopenOne={
            !CHARGES_ENABLED || charges >= 1 ? handleReopenOne : undefined
          }
          onInspect={setInspectSkin}
          isNewDiscovery={isNewDiscovery}
        />
      )}

      {!opening && phase === 'results' && lastResults.length > 0 && (
        <div className="space-y-4 surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="title-section">
              Résultat{lastResults.length > 1 ? 's' : ''}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={CHARGES_ENABLED && charges < 1}
                onClick={() => startOpen(1)}
                className="btn btn-secondary btn-sm"
              >
                Rouvrir ×1
              </button>
              <Link to="/inventory" className="btn btn-ghost btn-sm">
                Inventaire
              </Link>
              <Link to="/caisses" className="btn btn-ghost btn-sm">
                Catalogue
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            {lastResults.map((s) => (
              <ResultCard key={s.uid} skin={s} onInspect={setInspectSkin} isNouveau={isNewDiscovery?.(s.item.name)} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase('idle')}
            className="text-sm text-muted hover:text-accent min-h-11"
          >
            Fermer les résultats
          </button>
        </div>
      )}

      {!opening && (
        <section className="space-y-6">
          <h2 className="title-section border-b border-border pb-2">Contenu</h2>
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
                    <SkinRarityCard
                      key={item.id}
                      item={item}
                      isRareSpecial={tier === 'rare'}
                      name={item.name}
                      image={item.image}
                      title="Voir en 360°"
                      onClick={() =>
                        setInspectSkin(
                          previewOpenedFromItem(item, caseData, {
                            isRareSpecial: tier === 'rare',
                          }),
                        )
                      }
                      footer={
                        <span className="mt-1 text-[9px] uppercase tracking-wide text-accent/90">
                          360°
                        </span>
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {inspectSkin && (
        <InspectModal
          skin={inspectSkin}
          onClose={() => setInspectSkin(null)}
          sales={sales}
        />
      )}
    </div>
  )
}
