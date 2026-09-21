import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

/** Delay before mounting the heavy SkinHub WebGL iframe (ms). */
const IFRAME_MOUNT_DELAY_MS = 400
/** Auto-advance carousel so users see each weapon without multi-iframe. */
const CAROUSEL_INTERVAL_MS = 9000
/** Soft timeout: if iframe never fires load, keep static + glow. */
const IFRAME_LOAD_TIMEOUT_MS = 12000

function toPreviewSkin(skin: ExtraordinarySkin) {
  const item: SkinItem = {
    id: `extra-${skin.paintIndex}`,
    name: skin.name,
    image: skin.image,
    rarity: {
      id:
        skin.accent === 'rare' ? 'rarity_ancient' : 'rarity_ancient_weapon',
      name: skin.rarityLabel.replace(/^★\s*/, ''),
      color: '#eb4b4b',
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

function scheduleIdle(cb: () => void, timeoutMs: number): () => void {
  const w = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        opts?: IdleRequestOptions,
      ) => number
      cancelIdleCallback?: (id: number) => void
    }
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(() => cb(), { timeout: timeoutMs })
    return () => w.cancelIdleCallback?.(id)
  }
  const t = globalThis.setTimeout(cb, Math.min(timeoutMs, 200))
  return () => globalThis.clearTimeout(t)
}

function StaticPreview({
  skin,
  label,
}: {
  skin: ExtraordinarySkin
  label?: string
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
      <img
        src={skin.image}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="h-[70%] max-h-40 w-auto max-w-[85%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
      />
      {label ? (
        <p className="text-[11px] text-muted text-center">{label}</p>
      ) : null}
    </div>
  )
}

/**
 * Single active SkinHub 360° iframe. Neighbors stay as static Steam images
 * so mobile does not OOM from 3 concurrent WebGL embeds.
 */
function Active360Frame({
  skin,
  active,
  sectionVisible,
}: {
  skin: ExtraordinarySkin
  active: boolean
  sectionVisible: boolean
}) {
  const [allowMount, setAllowMount] = useState(false)
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

  // Gate iframe: only when this slide is active AND section is on screen.
  useEffect(() => {
    if (!active || !sectionVisible) {
      setAllowMount(false)
      setLoaded(false)
      setFailed(false)
      return
    }

    let cancelled = false
    let clearMountTimer: (() => void) | undefined

    const clearIdle = scheduleIdle(() => {
      if (cancelled) return
      clearMountTimer = (() => {
        const t = window.setTimeout(() => {
          if (!cancelled) setAllowMount(true)
        }, IFRAME_MOUNT_DELAY_MS)
        return () => window.clearTimeout(t)
      })()
    }, 800)

    return () => {
      cancelled = true
      clearIdle()
      clearMountTimer?.()
      setAllowMount(false)
      setLoaded(false)
      setFailed(false)
    }
  }, [active, sectionVisible, frameUrl])

  // Soft fallback if iframe never loads (blocked / slow network).
  useEffect(() => {
    if (!allowMount || loaded || failed) return
    const t = window.setTimeout(() => setFailed(true), IFRAME_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [allowMount, loaded, failed])

  const showIframe = allowMount && !failed

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
          {showIframe && loaded ? 'Auto 360°' : 'Aperçu'}
        </span>
      </div>

      <div
        className="relative z-10 mx-2 mb-2 aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[#05070b]"
        style={{ touchAction: 'none' }}
      >
        {/* Always paint static Steam image first (and as fallback). */}
        {(!showIframe || !loaded) && (
          <StaticPreview
            skin={skin}
            label={
              failed
                ? 'Aperçu 360° indisponible — image de secours'
                : showIframe
                  ? 'Chargement 360°…'
                  : undefined
            }
          />
        )}

        {showIframe ? (
          <iframe
            key={frameUrl}
            src={frameUrl}
            title={`${skin.label} — aperçu 360°`}
            allow="fullscreen; pointer-lock"
            referrerPolicy="strict-origin-when-cross-origin"
            className={`absolute inset-0 h-full w-full border-0 bg-transparent transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ touchAction: 'none' }}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>

      <p className="relative z-10 px-3 pb-3 text-[11px] text-muted">
        {skin.subtitle}
        {showIframe && loaded
          ? ' · rotation automatique SkinHub'
          : ' · aperçu Steam'}
      </p>
    </div>
  )
}

function ThumbCard({
  skin,
  selected,
  onSelect,
}: {
  skin: ExtraordinarySkin
  selected: boolean
  onSelect: () => void
}) {
  const glow = ACCENT_GLOW[skin.accent]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Voir ${skin.label}`}
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border bg-[#07090d]/90 p-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        selected
          ? `${ACCENT_BORDER[skin.accent]} scale-[1.02]`
          : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/25'
      }`}
      style={
        selected
          ? {
              boxShadow: `0 0 24px -6px ${glow}`,
            }
          : undefined
      }
    >
      <img
        src={skin.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-14 w-full object-contain drop-shadow-md sm:h-16"
      />
      <span className="w-full truncate text-center text-[10px] font-semibold text-muted">
        {skin.label}
      </span>
    </button>
  )
}

export function ExtraordinaryShowcase({
  skins,
}: {
  skins: ExtraordinarySkin[]
}) {
  const [index, setIndex] = useState(0)
  const [sectionVisible, setSectionVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const count = skins.length
  const active = skins[index] ?? skins[0]

  const go = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  // IntersectionObserver: do not even schedule iframe until section is visible.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setSectionVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        setSectionVisible(hit)
      },
      { rootMargin: '80px 0px', threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Auto-advance carousel (one iframe at a time across weapons).
  useEffect(() => {
    if (paused || count < 2 || !sectionVisible) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [paused, count, sectionVisible])

  // Prefetch Steam preview images for all cards (cheap vs WebGL).
  useEffect(() => {
    for (const s of skins) {
      const img = new Image()
      img.decoding = 'async'
      img.src = s.image
    }
  }, [skins])

  if (!active) return null

  return (
    <div
      ref={rootRef}
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <Active360Frame
        key={active.name}
        skin={active}
        active
        sectionVisible={sectionVisible}
      />

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Skin précédent"
          onClick={() => go(index - 1)}
          className="rounded-lg border border-border/80 bg-panel/60 px-3 py-2 text-sm font-semibold text-muted hover:border-accent/40 hover:text-accent transition"
        >
          ←
        </button>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {skins.map((s, i) => (
            <ThumbCard
              key={s.name}
              skin={s}
              selected={i === index}
              onSelect={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Skin suivant"
          onClick={() => go(index + 1)}
          className="rounded-lg border border-border/80 bg-panel/60 px-3 py-2 text-sm font-semibold text-muted hover:border-accent/40 hover:text-accent transition"
        >
          →
        </button>
      </div>

      <p className="text-center text-[11px] text-muted">
        Un aperçu 360° à la fois — les autres restent en image pour éviter les
        plantages mobile.
      </p>
    </div>
  )
}
