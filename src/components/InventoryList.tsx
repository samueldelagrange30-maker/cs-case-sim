import type { OpenedSkin } from '../types'
import { displayName, rarityColor } from '../lib/odds'

export function InventoryList({ items }: { items: OpenedSkin[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted py-12">
        Inventaire vide — ouvrez des caisses pour commencer.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((skin) => {
        const color = rarityColor(skin)
        return (
          <li
            key={skin.uid}
            className="rounded-lg border bg-panel overflow-hidden"
            style={{ borderColor: `${color}88`, boxShadow: `inset 0 -2px 0 ${color}` }}
          >
            <div className="aspect-square flex items-center justify-center bg-[#0a0d12] p-2">
              <img
                src={skin.item.image}
                alt={skin.item.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="p-2 space-y-0.5">
              <p className="text-[10px] font-semibold" style={{ color }}>
                {skin.isRareSpecial ? '★ Rare' : skin.item.rarity.name}
                {skin.isStatTrak ? ' · ST' : ''}
              </p>
              <p className="text-xs font-medium line-clamp-2 leading-snug">
                {displayName(skin)}
              </p>
              <p className="text-[10px] text-muted font-mono">
                {skin.wear} · {skin.float.toFixed(4)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
