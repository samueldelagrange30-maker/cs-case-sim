import { useEffect, useMemo, useRef, useState } from 'react'
import type { OpenedSkin, WeaponCase } from '../types'
import { buildRouletteStrip, rarityColor, TIER_META } from '../lib/odds'

const ITEM_W = 128
const GAP = 8
const SLOT = ITEM_W + GAP
const WINNER_INDEX = 42
const STRIP_LEN = 50

interface Props {
  caseData: WeaponCase
  winners: OpenedSkin[]
  onDone: () => void
}

export function Roulette({ caseData, winners, onDone }: Props) {
  const [current, setCurrent] = useState(0)
  const [offset, setOffset] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)

  const winner = winners[current]!

  const strip = useMemo(
    () => buildRouletteStrip(caseData, winner, STRIP_LEN, WINNER_INDEX),
    // rebuild per winner spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseData, winner.uid],
  )

  useEffect(() => {
    doneRef.current = false
    setSpinning(true)
    const viewport = viewportRef.current
    const vw = viewport?.clientWidth ?? 360
    // Center the winner under the marker
    const target =
      WINNER_INDEX * SLOT - vw / 2 + ITEM_W / 2 + (Math.random() * 40 - 20)

    // Force reflow start at 0
    setOffset(0)
    const t0 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(target))
    })

    const timer = window.setTimeout(() => {
      setSpinning(false)
      if (current < winners.length - 1) {
        window.setTimeout(() => setCurrent((c) => c + 1), 900)
      } else if (!doneRef.current) {
        doneRef.current = true
        window.setTimeout(onDone, 700)
      }
    }, 5200)

    return () => {
      cancelAnimationFrame(t0)
      clearTimeout(timer)
    }
  }, [winner.uid, current, winners.length, onDone])

  const color = rarityColor(winner)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted px-1">
        <span>
          Ouverture {current + 1} / {winners.length}
        </span>
        {!spinning && (
          <span className="font-medium" style={{ color }}>
            {winner.isStatTrak ? 'StatTrak™ ' : ''}
            {winner.item.name}
          </span>
        )}
      </div>

      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded-xl border border-border bg-[#0a0d12] h-[160px]"
      >
        {/* center marker */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 -translate-x-1/2 w-0.5 bg-accent shadow-[0_0_12px_#d4a017]" />
        <div className="pointer-events-none absolute top-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-10 border-l-transparent border-r-transparent border-t-accent" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-10 border-l-transparent border-r-transparent border-b-accent" />

        <div
          className="absolute top-0 left-0 flex items-center h-full will-change-transform"
          style={{
            gap: GAP,
            transform: `translateX(-${offset}px)`,
            transition: spinning
              ? 'transform 5s cubic-bezier(0.12, 0.75, 0.08, 1)'
              : 'none',
          }}
        >
          {strip.map((slot, i) => {
            const c = slot.isRareSpecial
              ? TIER_META.rare.color
              : slot.item.rarity.color
            return (
              <div
                key={`${winner.uid}-${i}`}
                className="shrink-0 flex flex-col items-center justify-center rounded-lg border bg-panel-2"
                style={{
                  width: ITEM_W,
                  height: 140,
                  borderColor: c,
                  boxShadow: `inset 0 -3px 0 ${c}`,
                }}
              >
                <img
                  src={slot.item.image}
                  alt=""
                  className="h-20 w-20 object-contain"
                  draggable={false}
                />
                <span className="mt-1 px-1 text-[10px] text-center text-muted line-clamp-2 w-full">
                  {slot.item.name.replace(/^★ /, '★')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
