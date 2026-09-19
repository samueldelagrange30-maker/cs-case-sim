import type { OpenedSkin } from '../types'
import { displayName, rarityColor } from '../lib/odds'

export function ResultCard({ skin }: { skin: OpenedSkin }) {
  const color = rarityColor(skin)
  return (
    <div
      className="rounded-xl border bg-panel overflow-hidden"
      style={{ borderColor: color, boxShadow: `0 0 24px ${color}33` }}
    >
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="h-28 w-28 flex items-center justify-center rounded-lg bg-[#0a0d12]">
          <img
            src={skin.item.image}
            alt={skin.item.name}
            className="max-h-full max-w-full object-contain"
          />
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
          <p className="text-[11px] text-muted">Depuis {skin.caseName}</p>
        </div>
      </div>
    </div>
  )
}
