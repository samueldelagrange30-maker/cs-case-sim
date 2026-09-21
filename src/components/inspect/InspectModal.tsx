import { useEffect, useMemo, useState } from 'react'
import type { OpenedSkin, SaleRecord } from '../../types'
import { displayName, rarityColor } from '../../lib/odds'
import { normalizeItemName } from '../../lib/pricing'
import { getStickers, MAX_STICKER_SLOTS } from '../../lib/stickers'
import {
  buildSkinHubFrameUrl,
  buildSkinHubPageUrl,
  canUseSkinHubViewer,
  SKINHUB_DECORS,
  type SkinHubDecor,
} from '../../lib/skinHub'
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
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeFailed, setIframeFailed] = useState(false)
  const [autorotate, setAutorotate] = useState(false)
  const [decor, setDecor] = useState<SkinHubDecor>('studio')
  const use3d = canUseSkinHubViewer(skin)
  const frameUrl = useMemo(
    () =>
      use3d
        ? buildSkinHubFrameUrl(skin, {
            side: 'left',
            autorotate,
            view: 'gun',
            decor,
          })
        : '',
    [skin, use3d, autorotate, decor],
  )
  const pageUrl = useMemo(
    () => (use3d ? buildSkinHubPageUrl(skin, { view: 'gun', decor }) : ''),
    [skin, use3d, decor],
  )

  useEffect(() => {
    setIframeLoaded(false)
    setIframeFailed(false)
  }, [frameUrl])

  useEffect(() => {
    setAutorotate(false)
    setDecor('studio')
  }, [skin.uid])

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
  const showIframe = use3d && !iframeFailed

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
            {showIframe ? (
              <div
                className="relative min-h-[420px] h-[min(62vh,520px)] bg-[#07090d] overscroll-contain"
                style={{ touchAction: 'none' }}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div className="absolute top-3 left-3 right-3 z-[2] flex items-start justify-between gap-2 pointer-events-none">
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto rounded-md bg-black/70 border border-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/90 hover:border-accent/60 hover:text-accent transition"
                    title="Ouvrir sur SkinHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    360°
                  </a>
                  <div className="pointer-events-auto flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                        autorotate
                          ? 'border-accent/70 bg-accent/20 text-accent'
                          : 'border-white/20 bg-black/70 text-white/80 hover:border-white/40'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setAutorotate((v) => !v)
                      }}
                      title={
                        autorotate
                          ? 'Désactiver la rotation automatique'
                          : 'Activer la rotation automatique'
                      }
                    >
                      {autorotate ? 'Auto 360° : ON' : 'Auto 360° : OFF'}
                    </button>
                    <div
                      className="flex rounded-md border border-white/20 bg-black/70 overflow-hidden"
                      role="group"
                      aria-label="Décor SkinHub"
                    >
                      {SKINHUB_DECORS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`px-2 py-1 text-[11px] font-semibold transition ${
                            decor === d.id
                              ? 'border-accent/70 bg-accent/20 text-accent'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDecor(d.id)
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {!iframeLoaded && (
                  <div
                    className="absolute inset-0 z-[1] animate-pulse bg-gradient-to-br from-[#0c1018] via-[#121820] to-[#0a0d12]"
                    aria-hidden
                  >
                    <div className="absolute inset-8 rounded-lg border border-white/5 bg-white/5" />
                    <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-muted">
                      Chargement de l&apos;aperçu 360°…
                    </p>
                  </div>
                )}
                <iframe
                  key={frameUrl}
                  src={frameUrl}
                  title="Aperçu 360°"
                  allow="fullscreen; pointer-lock"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 h-full w-full border-0 bg-transparent"
                  style={{ touchAction: 'none' }}
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeFailed(true)}
                />
                <p className="absolute bottom-2 left-0 right-0 z-[2] pointer-events-none text-center text-[10px] sm:text-[11px] text-white/55 drop-shadow">
                  {autorotate
                    ? 'Rotation auto · glisser pour reprendre la main · molette : zoomer'
                    : 'Clic gauche : tourner · clic droit : déplacer · molette : zoomer'}
                </p>
                <img
                  src={skin.item.image}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute bottom-3 right-3 z-[2] h-12 w-12 sm:h-14 sm:w-14 object-contain rounded-md border border-white/10 bg-black/50 p-1 opacity-80"
                />
              </div>
            ) : (
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
            )}
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
              {skin.hasWear && skin.paintSeed != null
                ? ` · seed ${skin.paintSeed}`
                : ''}
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
