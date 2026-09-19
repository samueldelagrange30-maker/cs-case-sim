import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Crate, OpenedSkin } from '../types'
import {
  buildRouletteStrip,
  displayName,
  rarityColor,
  TIER_META,
} from '../lib/odds'
import { ResultCard } from './ResultCard'

const ITEM_W = 170
const GAP = 10
const SLOT = ITEM_W + GAP
const CARD_H = 190
const WINNER_INDEX = 42
const STRIP_LEN = 50
const REVEAL_MS = 950
const EASING = 'cubic-bezier(0.12, 0.75, 0.08, 1)'

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

  const viewportRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const doneRef = useRef(false)
  const targetRef = useRef(0)
  const spinTokenRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number[]>([])
  const winnersLenRef = useRef(winners.length)
  winnersLenRef.current = winners.length
  const currentRef = useRef(current)
  currentRef.current = current

  const winner = winners[current]!
  const isMulti = winners.length > 1
  const spinDurationMs = isMulti ? 3200 : 4500
  const spinDurationRef = useRef(spinDurationMs)
  spinDurationRef.current = spinDurationMs

  const strip = useMemo(
    () => buildRouletteStrip(caseData, winner, STRIP_LEN, WINNER_INDEX),
    // rebuild per winner spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseData, winner.uid],
  )

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
    for (const id of rafRef.current) cancelAnimationFrame(id)
    rafRef.current = []
  }

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const computeTarget = () => {
    const viewport = viewportRef.current
    const vw = viewport?.clientWidth ?? window.innerWidth
    const jitter = Math.random() * 40 - 20
    return WINNER_INDEX * SLOT - vw / 2 + ITEM_W / 2 + jitter
  }

  const afterReveal = (fromIndex: number) => {
    if (fromIndex < winnersLenRef.current - 1) {
      setOffset(0)
      setSpinning(false)
      setUiPhase('spin')
      setCurrent(fromIndex + 1)
    } else {
      setSpinning(false)
      setUiPhase('results')
    }
  }

  const landOnWinner = (fromIndex: number) => {
    setSpinning(false)
    setOffset(targetRef.current)
    setUiPhase('reveal')
    schedule(() => afterReveal(fromIndex), REVEAL_MS)
  }

  // Only re-run when the active winner changes — never when onDone identity changes.
  useEffect(() => {
    clearTimers()
    const token = ++spinTokenRef.current
    const fromIndex = current

    setUiPhase('spin')
    setOffset(0)
    setSpinning(false)

    const raf0 = requestAnimationFrame(() => {
      if (spinTokenRef.current !== token) return
      const target = computeTarget()
      targetRef.current = target

      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          if (spinTokenRef.current !== token) return
          setSpinning(true)
          setOffset(target)
        })
        rafRef.current.push(raf2)
      })
      rafRef.current.push(raf1)
    })
    rafRef.current.push(raf0)

    schedule(() => {
      if (spinTokenRef.current !== token) return
      landOnWinner(fromIndex)
    }, spinDurationRef.current)

    return () => {
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner.uid, current])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
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

  const handleSkip = () => {
    if (uiPhase !== 'spin') return
    clearTimers()
    spinTokenRef.current += 1
    if (!targetRef.current) {
      targetRef.current = computeTarget()
    }
    landOnWinner(currentRef.current)
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

  const color = rarityColor(winner)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#05070b]/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Ouverture de caisse"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={uiPhase === 'results' ? 'Fermer' : undefined}
        tabIndex={uiPhase === 'results' ? 0 : -1}
        onClick={handleBackdrop}
      />

      <div className="relative z-10 flex flex-col flex-1 min-h-0 pointer-events-none">
        <div className="pointer-events-auto shrink-0 px-4 pt-4 pb-2 sm:px-8 flex items-start justify-between gap-3">
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
          {uiPhase === 'spin' && (
            <button
              type="button"
              onClick={handleSkip}
              className="shrink-0 rounded-lg border border-border bg-panel/80 px-4 py-2 text-sm font-semibold text-text hover:border-accent hover:text-accent transition"
            >
              Passer
            </button>
          )}
        </div>

        {uiPhase !== 'results' ? (
          <div className="pointer-events-auto flex-1 flex flex-col justify-center gap-6 px-0 sm:px-4 pb-8">
            <div
              ref={viewportRef}
              className="relative overflow-hidden w-full border-y border-border bg-[#0a0d12]"
              style={{ height: CARD_H + 24 }}
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
                  transform: `translateX(-${offset}px)`,
                  transition: spinning
                    ? `transform ${spinDurationMs}ms ${EASING}`
                    : 'none',
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
                      className="shrink-0 flex flex-col items-center justify-center rounded-xl border bg-panel-2"
                      style={{
                        width: ITEM_W,
                        height: CARD_H,
                        borderColor: c,
                        boxShadow: isWinnerSlot
                          ? `0 0 28px ${c}aa, inset 0 -4px 0 ${c}`
                          : `inset 0 -3px 0 ${c}, 0 0 12px ${c}22`,
                        transform: isWinnerSlot ? 'scale(1.04)' : undefined,
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
                className="mx-auto max-w-md w-full px-4 text-center space-y-2"
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
            <h2 className="text-xl font-bold mb-4 text-center sm:text-left">
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
                className="rounded-lg border border-accent/60 bg-accent/10 text-accent font-semibold px-4 py-2.5 text-sm hover:bg-accent/20 transition"
              >
                Rouvrir ×1
              </button>
            )}
            <button
              type="button"
              onClick={confirmClose}
              className="rounded-lg bg-accent text-bg font-bold px-5 py-2.5 text-sm hover:brightness-110 transition shadow-lg shadow-accent/20"
            >
              Ajouter à l&apos;inventaire &amp; fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
