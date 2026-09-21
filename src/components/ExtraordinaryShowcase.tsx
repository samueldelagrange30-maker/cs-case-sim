import { useEffect, useMemo, useState } from 'react'
import type { ExtraordinarySkin } from '../lib/iconicSkins'
import {
  buildSkinHubFrameUrl,
  previewOpenedFromItem,
} from '../lib/skinHub'
import type { SkinItem } from '../types'

const ACCENT_GLOW: Record<ExtraordinarySkin['accent'], string> = {
  covert: 'rgba(235, 75, 75, 0.55)',
  classified: 'rgba(211, 44, 230, 0.5)',
  rare: 'rgba(255, 215, 0, 0.6)',
  restricted: 'rgba(136, 71, 255, 0.5)',
}

const ACCENT_BORDER: Record<ExtraordinarySkin['accent'], string> = {
  covert: 'border-covert/60',
  classified: 'border-classified/60',
  rare: 'border-rare/60',
  restricted: 'border-restricted/60',
}

function toPreviewSkin(skin: ExtraordinarySkin) {
  const item: SkinItem = {
    id: `extra-${skin.paintIndex}`,
    name: skin.name,
    image: skin.image,
    rarity: {
      id:
        skin.accent === 'rare' ? 'rarity_ancient' : 'rarity_ancient_weapon',
      name: skin.rarityLabel.replace(/^★\s*/, ''),
      color: skin.accent === 'rare' ? '#eb4b4b' : '#eb4b4b',
    },
    paint_index: skin.paintIndex,
    phase: null,
  }
  return previewOpenedFromItem(
    item,
    { id: 'landing', name: 'Landing', type: 'Case' },
    { isRareSpecial: skin.accent === 'rare' },
  )
}

function ExtraordinaryFrame({ skin }: { skin: ExtraordinarySkin }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const glow = ACCENT_GLOW[skin.accent]

  const frameUrl = useMemo(() => {
    const opened = toPreviewSkin(skin)
    return buildSkinHubFrameUrl(opened, {
      view: 'gun',
      side: 'left',
      autorotate: true,
      decor: 'studio',
    })
  }, [skin])

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [frameUrl])

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-[#07090d] shadow-2xl shadow-black/60 ${ACCENT_BORDER[skin.accent]}`}
      style={{
        boxShadow: `0 0 40px -8px ${glow}, 0 16px 40px -12px rgba(0,0,0,0.7)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 65%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pt-3 pb-1">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold truncate">
            {skin.rarityLabel}
          </p>
          <p className="text-sm font-bold truncate">{skin.label}</p>
        </div>
        <span className="shrink-0 rounded-md border border-accent/50 bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent tracking-wide">
          Auto 360°
        </span>
      </div>

      <div
        className="relative z-10 mx-2 mb-2 aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-xl border border-white/10 bg-[#05070b]"
        style={{ touchAction: 'none' }}
      >
        {!failed ? (
          <>
            {!loaded && (
              <div
                className="absolute inset-0 z-[1] animate-pulse bg-gradient-to-br from-[#0c1018] via-[#121820] to-[#0a0d12]"
                aria-hidden
              >
                <img
                  src={skin.image}
                  alt=""
                  className="absolute inset-0 m-auto h-24 w-24 object-contain opacity-40"
                />
                <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-muted">
                  Chargement 360°…
                </p>
              </div>
            )}
            <iframe
              key={frameUrl}
              src={frameUrl}
              title={`${skin.label} — aperçu 360°`}
              allow="fullscreen; pointer-lock"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0 bg-transparent"
              style={{ touchAction: 'none' }}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <img
              src={skin.image}
              alt=""
              className="h-28 w-28 object-contain drop-shadow-lg"
            />
            <p className="text-xs text-muted text-center">
              Aperçu 360° indisponible — image de secours
            </p>
          </div>
        )}
      </div>

      <p className="relative z-10 px-3 pb-3 text-[11px] text-muted">
        {skin.subtitle} · rotation automatique SkinHub
      </p>
    </div>
  )
}

export function ExtraordinaryShowcase({
  skins,
}: {
  skins: ExtraordinarySkin[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skins.map((s) => (
        <ExtraordinaryFrame key={s.name} skin={s} />
      ))}
    </div>
  )
}
