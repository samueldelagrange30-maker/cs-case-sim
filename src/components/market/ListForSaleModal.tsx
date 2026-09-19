import { useMemo, useState } from 'react'
import type { OpenedSkin } from '../../types'
import { displayName, rarityColor } from '../../lib/odds'
import { formatSim, suggestBuyout, suggestStartPrice } from '../../lib/pricing'

const PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 h', minutes: 60 },
  { label: '6 h', minutes: 360 },
  { label: '24 h', minutes: 1440 },
]

interface Props {
  skin: OpenedSkin
  onClose: () => void
  onConfirm: (opts: {
    startPrice: number
    buyoutPrice?: number
    durationMinutes: number
  }) => void
}

export function ListForSaleModal({ skin, onClose, onConfirm }: Props) {
  const suggested = useMemo(() => suggestStartPrice(skin), [skin])
  const suggestedBuy = useMemo(() => suggestBuyout(skin), [skin])
  const [startPrice, setStartPrice] = useState(suggested)
  const [enableBuyout, setEnableBuyout] = useState(true)
  const [buyoutPrice, setBuyoutPrice] = useState(suggestedBuy)
  const [preset, setPreset] = useState(15)
  const [customMin, setCustomMin] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const color = rarityColor(skin)

  const duration = useCustom
    ? Math.max(1, Math.min(10080, Number(customMin) || 1))
    : preset

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 p-4 border-b border-border">
          <div className="h-16 w-16 rounded-lg bg-[#0a0d12] flex items-center justify-center shrink-0">
            <img
              src={skin.item.image}
              alt=""
              className="max-h-14 max-w-14 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold" style={{ color }}>
              {skin.isRareSpecial ? '★ Rare' : skin.item.rarity.name}
            </p>
            <p className="text-sm font-medium line-clamp-2">{displayName(skin)}</p>
            <p className="text-[11px] text-muted font-mono">
              {skin.hasWear && skin.float != null
                ? `${skin.wear} · ${skin.float.toFixed(4)}`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-[11px] text-muted leading-snug">
            Marché simulé — devise fictive $SIM, aucun argent réel. L&apos;item
            quitte votre inventaire jusqu&apos;à vente, expiration ou
            annulation.
          </p>

          <label className="block space-y-1">
            <span className="text-xs text-muted">Prix de départ</span>
            <input
              type="number"
              min={1}
              value={startPrice}
              onChange={(e) => setStartPrice(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
            />
            <span className="text-[10px] text-muted">
              Suggestion : {formatSim(suggested)}
            </span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={enableBuyout}
                onChange={(e) => setEnableBuyout(e.target.checked)}
              />
              Activer l&apos;achat immédiat
            </label>
            {enableBuyout && (
              <input
                type="number"
                min={startPrice + 1}
                value={buyoutPrice}
                onChange={(e) =>
                  setBuyoutPrice(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs text-muted">Durée</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => {
                    setUseCustom(false)
                    setPreset(p.minutes)
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border transition ${
                    !useCustom && preset === p.minutes
                      ? 'border-accent bg-accent/20 text-accent'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium border transition ${
                  useCustom
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-border text-muted hover:text-text'
                }`}
              >
                Perso
              </button>
            </div>
            {useCustom && (
              <input
                type="number"
                min={1}
                max={10080}
                placeholder="Minutes"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-text"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                startPrice,
                buyoutPrice:
                  enableBuyout && buyoutPrice > startPrice
                    ? buyoutPrice
                    : undefined,
                durationMinutes: duration,
              })
            }
            className="flex-1 rounded-lg bg-accent/90 hover:bg-accent text-bg font-semibold px-3 py-2 text-sm"
          >
            Mettre en vente
          </button>
        </div>
      </div>
    </div>
  )
}
