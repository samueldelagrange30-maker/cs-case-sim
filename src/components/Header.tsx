import { Link, NavLink } from 'react-router-dom'
import { Disclaimer } from './Disclaimer'

export function Header({ inventoryCount }: { inventoryCount: number }) {
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
              Simulateur de caisses
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Caisses
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
      <div className="border-t border-border/60 px-4 py-1.5">
        <Disclaimer compact />
      </div>
    </header>
  )
}
