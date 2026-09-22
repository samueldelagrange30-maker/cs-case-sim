import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Disclaimer } from './Disclaimer'
import { CHARGES_ENABLED } from '../lib/charges'
import { formatSim } from '../lib/pricing'
import {
  getSfxVolume,
  isSfxMuted,
  resumeAudio,
  setSfxMuted,
  setSfxVolume,
} from '../lib/sfx'
import { loadPrefs, savePrefs } from '../lib/prefs'
import type { AuthUser } from '../lib/auth'
import type { AccentTheme } from '../lib/engagement'

export function Header({
  inventoryCount,
  walletBalance,
  charges,
  maxCharges,
  nextChargeLabel,
  user,
  onLogout,
  compact,
  accentTheme = 'gold',
  onAccentTheme,
  guest,
}: {
  inventoryCount: number
  walletBalance: number
  charges: number
  maxCharges: number
  nextChargeLabel: string | null
  user?: AuthUser | null
  onLogout?: () => void
  compact?: boolean
  accentTheme?: AccentTheme
  onAccentTheme?: (t: AccentTheme) => void
  guest?: boolean
}) {
  const [muted, setMuted] = useState(() => isSfxMuted())
  const [volume, setVolume] = useState(() => getSfxVolume())
  const [shortAnim, setShortAnim] = useState(() => loadPrefs().shortAnim)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMuted(isSfxMuted())
    setVolume(getSfxVolume())
    setShortAnim(loadPrefs().shortAnim)
  }, [])

  const toggleSon = () => {
    const next = !muted
    setSfxMuted(next)
    setMuted(next)
    if (!next) void resumeAudio()
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center min-h-11 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-muted hover:text-text hover:bg-panel-2'
    }`

  const chargesBadge = CHARGES_ENABLED ? (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent min-h-8"
      title="Charges d’ouverture — +1 toutes les 10 min (max 10)"
    >
      <span className="font-mono">
        Ouvertures {charges}/{maxCharges}
      </span>
      {nextChargeLabel && (
        <span className="text-[10px] font-normal text-muted whitespace-nowrap">
          Prochaine dans {nextChargeLabel}
        </span>
      )}
    </span>
  ) : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center gap-3 justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0 min-h-11">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-panel-2 border border-accent/40 text-accent font-bold shadow-[0_0_12px_rgba(212,160,23,0.25)]">
            ★
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-text truncate leading-tight">
              Skin Csgo
            </div>
            <div className="text-[11px] text-muted truncate">
              Simulateur · $SIM fictif
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {compact ? (
            <>
              <Link to="/caisses" className="btn btn-primary btn-sm">
                Jouer
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-muted hover:text-text px-2 py-2 min-h-11"
                  title={user.email}
                >
                  {user.username} · Déco
                </button>
              ) : (
                <Link to="/auth" className="btn btn-ghost btn-sm">
                  Compte
                </Link>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="btn btn-ghost btn-sm"
                aria-expanded={menuOpen}
                aria-label="Options son & animation"
              >
                ⚙
              </button>
              <button
                type="button"
                onClick={toggleSon}
                className="inline-flex items-center rounded-full border border-border bg-panel px-2.5 py-2 text-xs font-semibold text-muted hover:text-text hover:border-accent/50 transition min-h-11"
                title={muted ? 'Activer le son' : 'Couper le son'}
                aria-pressed={!muted}
              >
                Son {muted ? 'OFF' : 'ON'}
              </button>
              {chargesBadge && (
                <span className="hidden sm:inline-flex">{chargesBadge}</span>
              )}
              <span
                className="hidden sm:inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent font-mono min-h-8"
                title="Portefeuille simulé — pas d’argent réel"
              >
                {formatSim(walletBalance)}
              </span>
              <nav className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end">
                <NavLink to="/caisses" end className={linkClass}>
                  Caisses
                </NavLink>
                <NavLink to="/collection" className={linkClass}>
                  Collection
                </NavLink>
                <NavLink to="/tradeup" className={linkClass}>
                  Trade-up
                </NavLink>
                <NavLink to="/market" className={linkClass}>
                  Marché
                </NavLink>
                <NavLink to="/inventory" className={linkClass}>
                  Inventaire
                  {inventoryCount > 0 && (
                    <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-accent/25 px-1.5 text-[11px] text-accent">
                      {inventoryCount}
                    </span>
                  )}
                </NavLink>
              </nav>
              {user ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden sm:inline-flex items-center rounded-full border border-border px-2.5 py-2 text-[11px] text-muted hover:text-text hover:border-accent/40 transition min-h-11"
                  title={user.email}
                >
                  {user.username}
                </button>
              ) : guest ? (
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex items-center rounded-full border border-border px-2.5 py-2 text-[11px] text-muted hover:text-accent hover:border-accent/40 transition min-h-11"
                  title="Compte optionnel — les données restent locales"
                >
                  Invité
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>

      {!compact && menuOpen && (
        <div className="border-t border-border/60 px-4 py-3 mx-auto max-w-6xl flex flex-wrap gap-4 items-center">
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={shortAnim}
              onChange={() => {
                const next = !shortAnim
                setShortAnim(next)
                savePrefs({ shortAnim: next })
              }}
            />
            Animation courte
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSfxVolume(v)
                setVolume(v)
                if (v > 0 && muted) {
                  setSfxMuted(false)
                  setMuted(false)
                }
              }}
              className="w-28 accent-[var(--color-accent)]"
            />
          </label>
          {onAccentTheme && (
            <label className="inline-flex items-center gap-2 text-xs text-muted">
              Thème
              <select
                className="input-field !py-1 !min-h-8 text-xs w-auto"
                value={accentTheme}
                onChange={(e) =>
                  onAccentTheme(e.target.value as AccentTheme)
                }
              >
                <option value="gold">Or</option>
                <option value="blue">Bleu</option>
              </select>
            </label>
          )}
        </div>
      )}

      {!compact && (
        <>
          <div className="sm:hidden border-t border-border/40 px-4 py-1.5 flex flex-wrap justify-center gap-2">
            {chargesBadge}
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent font-mono">
              {formatSim(walletBalance)}
            </span>
          </div>
          <div className="border-t border-border/60 px-4 py-1.5">
            <Disclaimer compact />
          </div>
        </>
      )}
    </header>
  )
}
