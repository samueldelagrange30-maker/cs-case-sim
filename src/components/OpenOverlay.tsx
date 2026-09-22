import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { Crate, OpenedSkin } from '../types'
import {
  buildRouletteStrip,
  displayName,
  rarityColor,
  TIER_META,
} from '../lib/odds'
import {
  getSfxVolume,
  isSfxMuted,
  playRevealSfx,
  playSpinTick,
  rarityToSfxTier,
  resumeAudio,
  setSfxMuted,
  setSfxVolume,
} from '../lib/sfx'
import { loadPrefs, prefersReducedMotion, savePrefs } from '../lib/prefs'
import { ResultCard } from './ResultCard'

const ITEM_W = 170
const GAP = 10
const SLOT = ITEM_W + GAP
const CARD_H = 190
const WINNER_INDEX = 42
const STRIP_LEN = 50
const REVEAL_MS = 900
const REVEAL_MS_SHORT = 350

interface Props {
  caseData: Crate
  winners: OpenedSkin[]
  /** Called exactly once when the user confirms results (inventory add + close). */
  onDone: () => void
  /** Optional: reopen ×1 after inventory is committed. */
  onReopenOne?: () => void
  onInspect?: (skin: OpenedSkin) => void
}

type UiPhase = 'spin' | 'reveal' | 'results'

function easeOutQuint(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - x, 5)
}

function isGoldTier(skin: OpenedSkin): boolean {
  if (skin.isRareSpecial) return true
  const id = skin.item.rarity.id
  const name = skin.item.rarity.name.toLowerCase()
  return (
    id === 'rarity_ancient' ||
    id.includes('contraband') ||
    name.includes('extraordinary') ||
    name.includes('contraband')
  )
}

function isCovertPlus(skin: OpenedSkin): boolean {
  if (skin.isRareSpecial) return true
  const id = skin.item.rarity.id
  const name = skin.item.rarity.name.toLowerCase()
  return (
    id.includes('ancient') ||
    id.includes('contraband') ||
    name.includes('covert') ||
    name.includes('extraordinary') ||
    name.includes('contraband')
  )
}

export function OpenOverlay({
  caseData,
  winners,
  onDone,
  onReopenOne,
  onInspect,
}: Props) {
  const [current, setCurrent] = useState(0)
  const [offset, setOffset] = useState(0)
  const [uiPhase, setUiPhase] = useState<UiPhase>('spin')
  const [spinning, setSpinning] = useState(false)
  const [cinematic, setCinematic] = useState(false)
  const [shake, setShake] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [shortAnim, setShortAnim] = useState(() => loadPrefs().shortAnim)
  const [muted, setMuted] = useState(() => isSfxMuted())
  const [volume, setVolume] = useState(() => getSfxVolume())

  const viewportRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const doneRef = useRef(false)
  const targetRef = useRef(0)
  const spinTokenRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const winnersLenRef = useRef(winners.length)
  winnersLenRef.current = winners.length
  const lastTickSlot = useRef(-1)
  const spinStartRef = useRef(0)
  const spinDurationRef = useRef(4500)
  const reducedRef = useRef(prefersReducedMotion())
  const shortAnimRef = useRef(shortAnim)
  shortAnimRef.current = shortAnim
  const landRef = useRef<(fromIndex: number) => void>(() => {})

  const winner = winners[current]!
  const isMulti = winners.length > 1

  const strip = useMemo(
    () => buildRouletteStrip(caseData, winner, STRIP_LEN, WINNER_INDEX),
    // rebuild per winner spin — winner.uid is the single source of truth
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseData, winner.uid],
  )

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const computeTarget = useCallback(() => {
    const viewport = viewportRef.current
    const vw = viewport?.clientWidth ?? window.innerWidth
    // Small jitter so the marker isn't always dead-center of the card
    const jitter = Math.random() * 28 - 14
    return WINNER_INDEX * SLOT - vw / 2 + ITEM_W / 2 + jitter
  }, [])

  const afterReveal = useCallback((fromIndex: number) => {
    setCinematic(false)
    setShake(false)
    setConfetti(false)
    if (fromIndex < winnersLenRef.current - 1) {
      setOffset(0)
      setSpinning(false)
      setUiPhase('spin')
      setCurrent(fromIndex + 1)
    } else {
      setSpinning(false)
      setUiPhase('results')
    }
  }, [])

  const landOnWinner = useCallback(
    (fromIndex: number) => {
      setSpinning(false)
      setOffset(targetRef.current)
      setUiPhase('reveal')
      setCinematic(true)

      const skin = winners[fromIndex]!
      const tier = rarityToSfxTier(
        skin.item.rarity.name,
        skin.item.rarity.id,
        skin.isRareSpecial,
      )
      playRevealSfx(tier)

      if (isCovertPlus(skin)) setConfetti(true)
      if (isGoldTier(skin)) setShake(true)

      const revealMs =
        reducedRef.current || shortAnimRef.current ? REVEAL_MS_SHORT : REVEAL_MS

      schedule(() => {
        setCinematic(false)
        setShake(false)
      }, Math.min(700, revealMs))
      schedule(() => afterReveal(fromIndex), revealMs)
    },
    [afterReveal, winners],
  )
  landRef.current = landOnWinner

  const runSpin = useCallback(
    (fromIndex: number, token: number) => {
      clearTimers()
      lastTickSlot.current = -1
      setUiPhase('spin')
      setOffset(0)
      setSpinning(false)
      setCinematic(false)
      setShake(false)
      setConfetti(false)

      const reduced = prefersReducedMotion()
      reducedRef.current = reduced
      const short = shortAnimRef.current
      const isMultiOpen = winnersLenRef.current > 1
      const duration = reduced
        ? 0
        : short
          ? isMultiOpen
            ? 900
            : 1200
          : isMultiOpen
            ? 3200
            : 4500
      spinDurationRef.current = duration

      // Measure after layout
      const startFrame = () => {
        if (spinTokenRef.current !== token) return
        const target = computeTarget()
        targetRef.current = target

        if (duration === 0) {
          setOffset(target)
          landRef.current(fromIndex)
          return
        }

        setSpinning(true)
        spinStartRef.current = performance.now()

        const tick = (now: number) => {
          if (spinTokenRef.current !== token) return
          const elapsed = now - spinStartRef.current
          const p = Math.min(1, elapsed / duration)
          const eased = easeOutQuint(p)
          const pos = eased * target
          setOffset(pos)

          const slot = Math.floor(eased * WINNER_INDEX)
          if (slot !== lastTickSlot.current && slot < WINNER_INDEX) {
            lastTickSlot.current = slot
            playSpinTick(0.05 * (1 - p * 0.7))
          }

          if (p < 1) {
            rafRef.current = requestAnimationFrame(tick)
          } else {
            rafRef.current = null
            setOffset(target)
            landRef.current(fromIndex)
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }

      // Double-rAF so viewport has measured width
      const r0 = requestAnimationFrame(() => {
        const r1 = requestAnimationFrame(startFrame)
        // track as timer-like cleanup via cancel in clearTimers for main spin only;
        // these two are short-lived
        void r1
      })
      void r0
    },
    [computeTarget],
  )

  // Resume audio on mount
  useEffect(() => {
    void resumeAudio()
  }, [])

  // Spin when active winner changes
  useEffect(() => {
    const token = ++spinTokenRef.current
    runSpin(current, token)
    return () => {
      clearTimers()
      spinTokenRef.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner.uid, current])

  // Finish spin immediately if tab was backgrounded (avoid desync)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'hidden') return
      if (uiPhase !== 'spin' || !spinning) return
      // Jump to end of current spin so reveal stays in sync
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setOffset(targetRef.current)
      setSpinning(false)
      landRef.current(current)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [uiPhase, spinning, current])

  // Recenter target on resize if still spinning (keep progress ratio)
  useEffect(() => {
    const onResize = () => {
      if (uiPhase !== 'spin') return
      const viewport = viewportRef.current
      const vw = viewport?.clientWidth ?? window.innerWidth
      // Preserve relative progress: recompute target without new jitter
      const newTarget = WINNER_INDEX * SLOT - vw / 2 + ITEM_W / 2
      const oldTarget = targetRef.current || 1
      const ratio = offset / oldTarget
      targetRef.current = newTarget
      if (!spinning) setOffset(newTarget)
      else setOffset(Math.min(newTarget, ratio * newTarget))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [uiPhase, spinning, offset])

  useEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    const prevTouch = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
      document.body.style.touchAction = prevTouch
    }
  }, [])

  const confirmClose = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDoneRef.current()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uiPhase === 'results') confirmClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [uiPhase, confirmClose])

  /** Skip remaining animations — keep all rolled winners, jump to results. */
  const handleSkip = () => {
    if (uiPhase === 'results') return
    clearTimers()
    spinTokenRef.current += 1
    setSpinning(false)
    setCinematic(false)
    setShake(false)
    setConfetti(false)
    setOffset(targetRef.current || 0)
    setUiPhase('results')
  }

  const handleBackdrop = () => {
    if (uiPhase === 'results') confirmClose()
  }

  const handleReopen = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDoneRef.current()
    onReopenOne?.()
  }

  const toggleShort = () => {
    const next = !shortAnim
    setShortAnim(next)
    shortAnimRef.current = next
    savePrefs({ shortAnim: next })
  }

  const toggleMute = () => {
    const next = !muted
    setSfxMuted(next)
    setMuted(next)
    if (!next) void resumeAudio()
  }

  const onVolumeChange = (v: number) => {
    setSfxVolume(v)
    setVolume(v)
    if (v > 0 && muted) {
      setSfxMuted(false)
      setMuted(false)
    }
  }

  const color = rarityColor(winner)
  const punch = uiPhase === 'reveal'

  const overlay = (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-[#05070b] safe-overlay ${
        shake ? 'sfx-shake' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Ouverture de caisse"
    >
      {cinematic && (
        <div
          className="pointer-events-none absolute inset-0 z-30 sfx-flash"
          style={{ '--sfx-color': color } as CSSProperties}
          aria-hidden
        />
      )}

      {confetti && uiPhase === 'reveal' && (
        <div
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="sfx-confetti"
              style={
                {
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${(i % 8) * 0.04}s`,
                  background:
                    i % 3 === 0 ? color : i % 3 === 1 ? '#ffd700' : '#fff',
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={uiPhase === 'results' ? 'Fermer' : undefined}
        tabIndex={uiPhase === 'results' ? 0 : -1}
        onClick={handleBackdrop}
      />

      <div className="relative z-10 flex flex-col flex-1 min-h-0 pointer-events-none">
        <div className="pointer-events-auto shrink-0 px-3 pt-3 pb-2 sm:px-8 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-accent truncate">
              {caseData.name}
            </p>
            {uiPhase !== 'results' ? (
              <p className="text-sm text-muted mt-0.5">
                Ouverture {current + 1} / {winners.length}
              </p>
            ) : (
              <p className="text-sm text-muted mt-0.5">
                {winners.length} item{winners.length > 1 ? 's' : ''} obtenu
                {winners.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <label
              className="inline-flex items-center gap-1.5 text-[11px] text-muted min-h-11"
              title="Animation courte"
            >
              <input
                type="checkbox"
                checked={shortAnim}
                onChange={toggleShort}
                className="rounded border-border"
              />
              Anim. courte
            </label>
            <button
              type="button"
              onClick={toggleMute}
              className="btn btn-ghost btn-sm min-h-11 px-3"
              aria-pressed={!muted}
              title={muted ? 'Activer le son' : 'Couper le son'}
            >
              Son {muted ? 'OFF' : 'ON'}
            </button>
            {!muted && (
              <label className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-muted">
                <span className="sr-only">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-20 accent-[var(--color-accent)]"
                />
              </label>
            )}
            {uiPhase !== 'results' && (
              <button
                type="button"
                onClick={handleSkip}
                className="btn btn-secondary btn-sm min-h-11"
                title={
                  isMulti
                    ? 'Passer les animations restantes et voir tous les résultats'
                    : 'Passer l’animation'
                }
              >
                Passer
              </button>
            )}
          </div>
        </div>

        {uiPhase !== 'results' ? (
          <div
            className={`pointer-events-auto flex-1 min-h-0 flex flex-col overflow-hidden px-0 sm:px-4 pb-6 ${
              uiPhase === 'reveal'
                ? 'justify-start gap-4 pt-2 sm:justify-center sm:gap-5'
                : 'justify-center gap-5'
            }`}
          >
            <div
              ref={viewportRef}
              className={`relative overflow-hidden w-full border-y border-border bg-[#0a0d12] shrink-0 transition-[height,opacity] duration-300 ${
                uiPhase === 'reveal' ? 'opacity-70 sm:opacity-100' : ''
              }`}
              style={{
                height:
                  uiPhase === 'reveal'
                    ? Math.round((CARD_H + 24) * 0.72)
                    : CARD_H + 24,
              }}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-1/2 z-20 -translate-x-1/2 w-0.5 bg-accent"
                style={{
                  boxShadow: `0 0 18px 4px ${color}88, 0 0 40px #d4a01766`,
                }}
              />
              <div className="pointer-events-none absolute top-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-accent" />
              <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-accent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-[#0a0d12] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24 bg-gradient-to-l from-[#0a0d12] to-transparent" />

              <div
                className="absolute top-0 left-0 flex items-center h-full will-change-transform px-1"
                style={{
                  gap: GAP,
                  transform: `translate3d(-${offset}px, 0, 0)`,
                }}
              >
                {strip.map((slot, i) => {
                  const c = slot.isRareSpecial
                    ? TIER_META.rare.color
                    : slot.item.rarity.color
                  const isWinnerSlot = i === WINNER_INDEX && uiPhase === 'reveal'
                  return (
                    <div
                      key={`${winner.uid}-${i}`}
                      className={`shrink-0 flex flex-col items-center justify-center rounded-xl border bg-panel-2 ${
                        isWinnerSlot ? 'sfx-punch' : ''
                      }`}
                      style={{
                        width: ITEM_W,
                        height: CARD_H,
                        borderColor: c,
                        boxShadow: isWinnerSlot
                          ? `0 0 28px ${c}aa, inset 0 -4px 0 ${c}`
                          : `inset 0 -3px 0 ${c}, 0 0 12px ${c}22`,
                        transform: isWinnerSlot ? 'scale(1.08)' : undefined,
                      }}
                    >
                      <img
                        src={slot.item.image}
                        alt=""
                        className="h-28 w-28 object-contain"
                        draggable={false}
                      />
                      <span className="mt-1 px-2 text-[11px] text-center text-muted line-clamp-2 w-full">
                        {slot.item.name.replace(/^★ /, '★')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {uiPhase === 'reveal' && (
              <div
                className={`mx-auto max-w-md w-full px-4 text-center space-y-2 ${
                  punch ? 'sfx-punch' : ''
                }`}
                style={{ filter: `drop-shadow(0 0 24px ${color}66)` }}
              >
                <div
                  className="mx-auto h-36 w-36 sm:h-44 sm:w-44 flex items-center justify-center rounded-2xl border bg-panel"
                  style={{
                    borderColor: color,
                    boxShadow: `0 0 40px ${color}55`,
                  }}
                >
                  <img
                    src={winner.item.image}
                    alt=""
                    className="max-h-[90%] max-w-[90%] object-contain"
                  />
                </div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color }}
                >
                  {winner.isRareSpecial
                    ? 'Rare Special'
                    : winner.item.rarity.name}
                  {winner.isStatTrak && (
                    <span className="ml-2 text-orange-400 normal-case">
                      StatTrak™
                    </span>
                  )}
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  {displayName(winner)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className="pointer-events-auto flex-1 overflow-y-auto px-4 sm:px-8 pb-28"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h2 className="text-xl font-bold mb-4 text-center sm:text-left title-display">
              Résultat{winners.length > 1 ? 's' : ''}
            </h2>
            <div className="grid gap-3 max-w-3xl mx-auto sm:mx-0">
              {winners.map((s) => (
                <ResultCard key={s.uid} skin={s} onInspect={onInspect} />
              ))}
            </div>
          </div>
        )}

        {uiPhase === 'results' && (
          <div className="pointer-events-auto shrink-0 border-t border-border bg-[#0a0d12]/95 px-4 py-4 sm:px-8 flex flex-wrap gap-3 justify-center sm:justify-end">
            {onReopenOne && (
              <button
                type="button"
                onClick={handleReopen}
                className="btn btn-secondary"
              >
                Rouvrir ×1
              </button>
            )}
            <Link
              to="/inventory"
              onClick={confirmClose}
              className="btn btn-ghost"
            >
              Inventaire
            </Link>
            <Link
              to="/caisses"
              onClick={confirmClose}
              className="btn btn-ghost"
            >
              Catalogue
            </Link>
            <button
              type="button"
              onClick={confirmClose}
              className="btn btn-primary"
            >
              Ajouter &amp; fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
