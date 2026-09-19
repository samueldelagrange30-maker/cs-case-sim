import { Link } from 'react-router-dom'
import type { WeaponCase } from '../types'

export function CaseCard({ c }: { c: WeaponCase }) {
  return (
    <Link
      to={`/case/${encodeURIComponent(c.id)}`}
      className="group flex flex-col rounded-xl border border-border bg-panel hover:border-accent/50 hover:bg-panel-2 transition overflow-hidden shadow-lg shadow-black/20"
    >
      <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-b from-[#1c2433] to-[#0e1218] p-4">
        <img
          src={c.image}
          alt={c.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="px-3 py-3 border-t border-border">
        <h2 className="text-sm font-semibold text-text line-clamp-2 group-hover:text-accent transition-colors">
          {c.name}
        </h2>
        <p className="mt-1 text-[11px] text-muted">
          {c.contains.length} skins · {c.contains_rare.length} rares
        </p>
      </div>
    </Link>
  )
}
