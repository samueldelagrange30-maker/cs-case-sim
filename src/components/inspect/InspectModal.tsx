import { useEffect, useMemo } from 'react'
import type { OpenedSkin, SaleRecord } from '../../types'
import { displayName, rarityColor } from '../../lib/odds'
import { normalizeItemName } from '../../lib/pricing'
import { getStickers, MAX_STICKER_SLOTS } from '../../lib/stickers'
import { SalesChart } from '../market/SalesChart'

interface Props {
  skin: OpenedSkin
  onClose: () => void
  /** Final sales history for market chart (matched by normalized item name). */
  sales?: SaleRecord[]
}

/** Horizontal positions (%) for sticker slots overlaid on the weapon image. */
const SLOT_LEFT_PCT = [12, 28, 44, 60, 76]

export function InspectModal({ skin, onClose, sales = [] }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const color = rarityColor(skin)
  const stickers = getStickers(skin)
  const itemKey = normalizeItemName(skin.item.name)
  const chartName = displayName(skin)

  const salePoints = useMemo(
    () =>
      sales
        .filter((s) => s.itemName === itemKey)
        .map((s) => ({ at: s.soldAt, value: s.soldPrice })),
    [sales, itemKey],
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Inspection"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-[#0a0d12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-[#0a0d12]/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted">
              Inspection
            </p>
            <h2 className="text-sm sm:text-base font-bold truncate">
              {chartName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            Fermer
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-4">
          <div
            className="relative rounded-xl border overflow-hidden bg-[#07090d]"
            style={{ borderColor: `${color}66` }}
          >
            <div className="relative flex items-center justify-center min-h-[min(48vh,380px)] p-6 sm:p-10">
              <img
                src={skin.item.image}
                alt={skin.item.name}
                className="max-h-[min(42vh,340px)] max-w-full object-contain drop-shadow-lg"
              />
              {stickers.length > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-[8%] h-14 sm:h-16">
                  {Array.from({ length: MAX_STICKER_SLOTS }, (_, slot) => {
                    const st = stickers.find((s) => s.slot === slot)
                    if (!st) return null
                    return (
                      <img
                        key={`${st.uid}-${slot}`}
                        src={st.item.image}
                        alt={st.item.name}
                        title={st.item.name}
                        className="absolute h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] -translate-x-1/2"
                        style={{ left: `${SLOT_LEFT_PCT[slot]}%`, bottom: 0 }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color }}>
              {skin.isRareSpecial ? '★ Rare Special' : skin.item.rarity.name}
              {skin.isStatTrak ? ' · StatTrak™' : ''}
            </p>
            <p className="text-sm text-muted font-mono">
              {skin.hasWear && skin.float != null
                ? `${skin.wearLabel} (${skin.wear}) · float ${skin.float.toFixed(6)}`
                : 'Usure / float : N/A'}
            </p>
            <p className="text-[11px] text-muted">Depuis {skin.caseName}</p>
          </div>

          <SalesChart
            title={`Historique des ventes — ${chartName}`}
            points={salePoints}
            height={180}
          />
        </div>
      </div>
    </div>
  )
}
