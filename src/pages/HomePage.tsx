import { useMemo, useState } from 'react'
import { CaseCard } from '../components/CaseCard'
import type { WeaponCase } from '../types'

export function HomePage({ cases }: { cases: WeaponCase[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return cases
    return cases.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.market_hash_name.toLowerCase().includes(s),
    )
  }, [cases, q])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Caisses d&apos;armes
          </h1>
          <p className="text-muted text-sm mt-1">
            {cases.length} caisses · ouverture simulée gratuite
          </p>
        </div>
        <label className="block w-full sm:w-72">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une caisse…"
            className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16">Aucune caisse trouvée.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}
