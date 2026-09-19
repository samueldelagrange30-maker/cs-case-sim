import { Link, NavLink } from 'react-router-dom'
import { Disclaimer } from './Disclaimer'
import { formatSim } from '../lib/pricing'

export function Header({
  inventoryCount,
  walletBalance,
}: {
  inventoryCount: number
  walletBalance: number
}) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-muted hover:text-text hover:bg-panel-2'
    }`

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
          <span
            className="hidden sm:inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent font-mono"
            title="Portefeuille simulé — pas d’argent réel"
          >
            {formatSim(walletBalance)}
          </span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Caisses
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
        </div>
      </div>
      <div className="sm:hidden border-t border-border/40 px-4 py-1 flex justify-center">
        <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent font-mono">
          {formatSim(walletBalance)}
        </span>
      </div>
      <div className="border-t border-border/60 px-4 py-1.5">
        <Disclaimer compact />
      </div>
    </header>
  )
}
