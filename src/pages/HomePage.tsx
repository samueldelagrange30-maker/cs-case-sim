import { useMemo, useState } from 'react'
import { CaseCard } from '../components/CaseCard'
import { TYPE_FILTERS } from '../lib/crateTypes'
import {
  compactSearch,
  crateSearchBlob,
  normalizeSearch,
  textMatches,
} from '../lib/searchNormalize'
import type { CrateIndexEntry, CrateType } from '../types'

function findContentMatch(
  c: CrateIndexEntry,
  queryNorm: string,
  queryCompact: string,
): string | null {
  const names = c.contains_names
  if (!names?.length) return null
  for (const n of names) {
    if (textMatches(n, queryNorm, queryCompact)) return n
  }
  return null
}

export function HomePage({ cases }: { cases: CrateIndexEntry[] }) {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CrateType>('all')

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

  /** Precompute haystacks once per cases load (avoids re-joining on every keystroke). */
  const searchIndex = useMemo(() => {
    return cases.map((c) => ({
      crate: c,
      blob: crateSearchBlob(c),
    }))
  }, [cases])

  const filtered = useMemo(() => {
    let list = searchIndex
    if (typeFilter !== 'all') {
      list = list.filter((e) => e.crate.type === typeFilter)
    }
    const queryNorm = normalizeSearch(q)
    const queryCompact = compactSearch(q)
    if (!queryNorm) {
      return list.map((e) => ({
        crate: e.crate,
        contentMatch: null as string | null,
      }))
    }
    const out: { crate: CrateIndexEntry; contentMatch: string | null }[] = []
    for (const { crate, blob } of list) {
      if (!textMatches(blob, queryNorm, queryCompact)) continue
      const nameHit =
        textMatches(crate.name, queryNorm, queryCompact) ||
        textMatches(crate.market_hash_name, queryNorm, queryCompact)
      const contentMatch = nameHit
        ? null
        : findContentMatch(crate, queryNorm, queryCompact)
      out.push({ crate, contentMatch })
    }
    return out
  }, [searchIndex, q, typeFilter])

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
        <label className="block w-full sm:w-80">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caisse ou arme (ex. Mp7, AK, Asiimov)…"
            className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            autoComplete="off"
            spellCheck={false}
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

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16">Aucun résultat.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(({ crate, contentMatch }) => (
            <CaseCard
              key={crate.id}
              c={crate}
              contentMatch={contentMatch}
            />
          ))}
        </div>
      )}
    </div>
  )
}
