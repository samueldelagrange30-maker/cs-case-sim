import { useMemo, useState } from 'react'
import { CaseCard } from '../components/CaseCard'
import { TYPE_FILTERS } from '../lib/crateTypes'
import type { CrateIndexEntry, CrateType } from '../types'

export function HomePage({ cases }: { cases: CrateIndexEntry[] }) {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CrateType>('all')

  const adminCases = useMemo(
    () => cases.filter((c) => c.type === 'Admin' || c.id.startsWith('admin-')),
    [cases],
  )

  const counts = useMemo(() => {
    const map = new Map<'all' | CrateType, number>()
    map.set('all', cases.length)
    for (const f of TYPE_FILTERS) {
      if (f.type) {
        map.set(f.type, cases.filter((c) => c.type === f.type).length)
      }
    }
    return map
  }, [cases])

  const filtered = useMemo(() => {
    let list = cases
    if (typeFilter !== 'all') {
      list = list.filter((c) => c.type === typeFilter)
    } else {
      // Keep ADMIN out of the main "Toutes" grid — shown in dedicated section
      list = list.filter((c) => c.type !== 'Admin' && !c.id.startsWith('admin-'))
    }
    const s = q.trim().toLowerCase()
    if (!s) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.market_hash_name.toLowerCase().includes(s),
    )
  }, [cases, q, typeFilter])

  const filteredAdmin = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return adminCases
    return adminCases.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.market_hash_name.toLowerCase().includes(s),
    )
  }, [adminCases, q])

  const showAdminSection =
    typeFilter === 'all' || typeFilter === 'Admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Caisses &amp; capsules
          </h1>
          <p className="text-muted text-sm mt-1">
            {cases.length} caisses &amp; capsules · ouverture simulée gratuite
          </p>
        </div>
        <label className="block w-full sm:w-72">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.key
          const n = counts.get(f.key) ?? 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypeFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border transition ${
                active
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-panel border-border text-muted hover:text-text hover:border-accent/40'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{n}</span>
            </button>
          )
        })}
      </div>

      {showAdminSection && filteredAdmin.length > 0 && (
        <section className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div>
            <h2 className="text-lg font-bold text-accent">
              Caisses ADMIN — une rareté pure
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Contenu synthétique : 100 % d&apos;une seule rareté · odds
              uniformes · consomme des charges comme les caisses normales
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredAdmin.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {typeFilter !== 'Admin' && (
        <>
          {filtered.length === 0 ? (
            <p className="text-center text-muted py-16">Aucun résultat.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
