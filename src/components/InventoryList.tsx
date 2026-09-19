import type { OpenedSkin } from '../types'
import { displayName, rarityColor } from '../lib/odds'
import { getStickers } from '../lib/stickers'

interface Props {
  items: OpenedSkin[]
  onListForSale?: (skin: OpenedSkin) => void
  onInspect?: (skin: OpenedSkin) => void
}

export function InventoryList({ items, onListForSale, onInspect }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted py-12">
        Inventaire vide — ouvrez des caisses ou capsules pour commencer.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((skin) => {
        const color = rarityColor(skin)
        const stickers = getStickers(skin)
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
              className="aspect-square flex items-center justify-center bg-[#0a0d12] p-2 relative hover:brightness-110 transition text-left w-full"
              title="Inspecter"
            >
              <img
                src={skin.item.image}
                alt={skin.item.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
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
              <p className="text-[10px] font-semibold" style={{ color }}>
                {skin.isRareSpecial ? '★ Rare' : skin.item.rarity.name}
                {skin.isStatTrak ? ' · ST' : ''}
              </p>
              <button
                type="button"
                onClick={() => onInspect?.(skin)}
                className="text-xs font-medium line-clamp-2 leading-snug text-left hover:text-accent"
              >
                {displayName(skin)}
              </button>
              <p className="text-[10px] text-muted font-mono">
                {skin.hasWear && skin.float != null && skin.wear
                  ? `${skin.wear} · ${skin.float.toFixed(4)}`
                  : 'N/A'}
                {stickers.length > 0 ? ` · ${stickers.length} stk` : ''}
              </p>
              {onListForSale && (
                <button
                  type="button"
                  onClick={() => onListForSale(skin)}
                  className="mt-auto w-full rounded-md bg-accent/15 text-accent text-[11px] font-semibold py-1.5 hover:bg-accent/25 transition"
                >
                  Mettre en vente
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
