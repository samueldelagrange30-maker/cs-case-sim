import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Disclaimer } from './Disclaimer'
import { CHARGES_ENABLED } from '../lib/charges'
import { formatSim } from '../lib/pricing'
import { isSfxMuted, resumeAudio, setSfxMuted } from '../lib/sfx'
import type { AuthUser } from '../lib/auth'

export function Header({
  inventoryCount,
  walletBalance,
  charges,
  maxCharges,
  nextChargeLabel,
  user,
  onLogout,
  compact,
}: {
  inventoryCount: number
  walletBalance: number
  charges: number
  maxCharges: number
  /** Countdown string e.g. "4:32", or null when full */
  nextChargeLabel: string | null
  user?: AuthUser | null
  onLogout?: () => void
  /** Landing / auth: brand only, no app nav */
  compact?: boolean
}) {
  const [muted, setMuted] = useState(() => isSfxMuted())

  useEffect(() => {
    setMuted(isSfxMuted())
  }, [])

  const toggleSon = () => {
    const next = !muted
    setSfxMuted(next)
    setMuted(next)
    if (!next) void resumeAudio()
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-muted hover:text-text hover:bg-panel-2'
    }`

  const chargesBadge = CHARGES_ENABLED ? (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
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
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-panel-2 border border-accent/40 text-accent font-bold">
            ★
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-text truncate leading-tight">
              Skin Csgo
            </div>
            <div className="text-[11px] text-muted truncate">
              Simulateur de caisses &amp; capsules
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {compact ? (
            <>
              {user ? (
                <>
                  <Link
                    to="/caisses"
                    className="rounded-lg bg-accent/90 text-bg font-semibold px-3 py-1.5 text-xs sm:text-sm hover:brightness-110 transition"
                  >
                    Entrer
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs text-muted hover:text-text px-2 py-1"
                    title={user.email}
                  >
                    {user.username} · Déco
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-lg bg-accent/90 text-bg font-semibold px-3 py-1.5 text-xs sm:text-sm hover:brightness-110 transition"
                >
                  Inscription / Connexion
                </Link>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSon}
                className="inline-flex items-center rounded-full border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-muted hover:text-text hover:border-accent/50 transition"
                title={muted ? 'Activer le son' : 'Couper le son'}
                aria-pressed={!muted}
              >
                Son {muted ? 'OFF' : 'ON'}
              </button>
              {chargesBadge && (
                <span className="hidden sm:inline-flex">{chargesBadge}</span>
              )}
              <span
                className="hidden sm:inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent font-mono"
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
              {user && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden sm:inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] text-muted hover:text-text hover:border-accent/40 transition"
                  title={user.email}
                >
                  {user.username}
                </button>
              )}
            </>
          )}
        </div>
      </div>
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
