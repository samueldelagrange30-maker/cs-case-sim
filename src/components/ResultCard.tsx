import type { OpenedSkin } from '../types'
import { displayName, rarityColor } from '../lib/odds'
import { getStickers } from '../lib/stickers'

interface Props {
  skin: OpenedSkin
  onInspect?: (skin: OpenedSkin) => void
  /** True when this name was not owned before this open */
  isNouveau?: boolean
}

export function ResultCard({ skin, onInspect, isNouveau }: Props) {
  const color = rarityColor(skin)
  const stickers = getStickers(skin)
  return (
    <button
      type="button"
      onClick={() => onInspect?.(skin)}
      className={`w-full text-left rounded-xl border bg-panel overflow-hidden hover:brightness-110 transition focus-visible:ring-2 focus-visible:ring-accent/50 ${
        isNouveau ? 'ring-1 ring-success/50' : ''
      }`}
      style={{ borderColor: color, boxShadow: `0 0 24px ${color}33` }}
      title={onInspect ? 'Inspecter' : undefined}
    >
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="h-28 w-28 flex items-center justify-center rounded-lg bg-[#0a0d12] relative">
          <img
            src={skin.item.image}
            alt={skin.item.name}
            className="max-h-full max-w-full object-contain"
          />
          {stickers.length > 0 && (
            <span className="absolute bottom-1 right-1 flex -space-x-1">
              {stickers.slice(0, 3).map((s) => (
                <img
                  key={`${s.uid}-${s.slot}`}
                  src={s.item.image}
                  alt=""
                  className="h-5 w-5 object-contain"
                />
              ))}
            </span>
          )}
          {isNouveau != null && (
            <span
              className={`absolute top-1 left-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                isNouveau
                  ? 'bg-success/90 text-[#0a0d12]'
                  : 'bg-panel-2/90 text-muted border border-border'
              }`}
            >
              {isNouveau ? 'Nouveau' : 'Doublon'}
            </span>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color }}
          >
            {skin.isRareSpecial ? 'Rare Special' : skin.item.rarity.name}
            {skin.isStatTrak && (
              <span className="ml-2 text-orange-400 normal-case">StatTrak™</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-text">{displayName(skin)}</h3>
          <p className="text-sm text-muted">
            {skin.hasWear && skin.float != null && skin.wear ? (
              <>
                {skin.wearLabel} ({skin.wear}) · Float{' '}
                <span className="text-text font-mono">
                  {skin.float.toFixed(8)}
                </span>
              </>
            ) : (
              <>Usure / float : N/A</>
            )}
          </p>
          <p className="text-[11px] text-muted">
            Depuis {skin.caseName}
            {onInspect ? ' · Cliquer pour inspecter' : ''}
          </p>
        </div>
      </div>
    </button>
  )
}
