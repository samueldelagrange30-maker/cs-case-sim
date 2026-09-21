import type { IconicSkin, SkinAccent } from '../lib/iconicSkins'

const ACCENT_GLOW: Record<SkinAccent, string> = {
  covert: 'rgba(235, 75, 75, 0.55)',
  classified: 'rgba(211, 44, 230, 0.5)',
  rare: 'rgba(255, 215, 0, 0.55)',
  restricted: 'rgba(136, 71, 255, 0.5)',
}

const ACCENT_RING: Record<SkinAccent, string> = {
  covert: 'border-covert/50',
  classified: 'border-classified/50',
  rare: 'border-rare/50',
  restricted: 'border-restricted/50',
}

const COLLAGE_LAYOUT = [
  { pos: 'top-[8%] left-[4%] w-[38%]', rotate: '-6deg', anim: 'animate-float-slow' },
  { pos: 'top-[2%] right-[6%] w-[36%]', rotate: '5deg', anim: 'animate-float-med' },
  { pos: 'bottom-[12%] left-[10%] w-[34%]', rotate: '3deg', anim: 'animate-float-fast' },
  { pos: 'bottom-[6%] right-[2%] w-[40%]', rotate: '-4deg', anim: 'animate-float-med' },
  { pos: 'top-[38%] left-[28%] w-[32%] opacity-90', rotate: '2deg', anim: 'animate-float-slow' },
  { pos: 'top-[42%] right-[22%] w-[30%] opacity-85', rotate: '-3deg', anim: 'animate-float-fast' },
] as const

/** Floating / collage cards of iconic skins (decorative). */
export function SkinCollage({
  skins,
  className = '',
}: {
  skins: IconicSkin[]
  className?: string
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {skins.slice(0, 6).map((s, i) => {
        const layout = COLLAGE_LAYOUT[i] ?? COLLAGE_LAYOUT[0]
        return (
          <div
            key={s.name}
            className={`absolute ${layout.pos}`}
            style={{ transform: `rotate(${layout.rotate})` }}
          >
            <div
              className={layout.anim}
              style={{ animationDelay: `${i * 0.35}s` }}
            >
              <SkinCard skin={s} compact />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SkinCard({
  skin,
  compact = false,
}: {
  skin: IconicSkin
  compact?: boolean
}) {
  const glow = ACCENT_GLOW[skin.accent]
  return (
    <div
      className={`relative rounded-xl border bg-panel/80 backdrop-blur-sm shadow-xl shadow-black/50 overflow-hidden ${ACCENT_RING[skin.accent]} ${
        compact ? 'p-2' : 'p-3'
      }`}
      style={{
        boxShadow: `0 0 28px -6px ${glow}, 0 12px 28px -8px rgba(0,0,0,0.65)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${glow} 0%, transparent 70%)`,
        }}
      />
      <img
        src={skin.image}
        alt=""
        loading="lazy"
        className={`relative z-10 mx-auto object-contain drop-shadow-lg ${
          compact ? 'h-16 sm:h-20 md:h-24' : 'h-24 sm:h-28'
        }`}
      />
      {!compact && (
        <p className="relative z-10 mt-1.5 text-center text-[10px] sm:text-xs font-medium text-muted truncate">
          {skin.label}
        </p>
      )}
    </div>
  )
}

/** Horizontal row of iconic skins with rarity accents. */
export function SkinStrip({ skins }: { skins: IconicSkin[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
      {skins.map((s) => (
        <div key={s.name} className="snap-start shrink-0 w-[7.5rem] sm:w-36">
          <SkinCard skin={s} />
        </div>
      ))}
    </div>
  )
}

/** Soft ambient orbs behind content. */
export function AmbientOrbs() {
  return (
    <>
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(212,160,23,0.45) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(235,75,75,0.35) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(211,44,230,0.3) 0%, transparent 70%)',
        }}
        aria-hidden
      />
    </>
  )
}
