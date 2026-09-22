import { Link } from 'react-router-dom'
import { typeLabel } from '../lib/crateTypes'
import type { CrateIndexEntry } from '../types'

export function CaseCard({
  c,
  contentMatch,
}: {
  c: CrateIndexEntry
  contentMatch?: string | null
}) {
  return (
    <Link
      to={`/case/${encodeURIComponent(c.id)}`}
      className="group card flex flex-col hover:bg-panel-2 shadow-lg shadow-black/20 focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-b from-[#1c2433] to-[#0e1218] p-3 sm:p-5">
        <img
          src={c.image}
          alt={c.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="px-3 py-3 border-t border-border">
        <p className="text-[10px] uppercase tracking-wide text-accent/80 mb-0.5 font-semibold">
          {typeLabel(c.type)}
        </p>
        <h2 className="text-sm font-semibold text-text line-clamp-2 group-hover:text-accent transition-colors">
          {c.name}
        </h2>
        {contentMatch ? (
          <p
            className="mt-1 text-[11px] text-accent/90 line-clamp-2"
            title={contentMatch}
          >
            Contient : {contentMatch}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-muted">
            {c.contains_count} items
            {c.contains_rare_count > 0
              ? ` · ${c.contains_rare_count} rares`
              : ''}
          </p>
        )}
      </div>
    </Link>
  )
}
