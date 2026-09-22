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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight title-display">
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
            className="input-field"
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
              className={`chip min-h-11 text-xs sm:text-sm ${
                active ? 'chip-active' : ''
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{n}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-10 text-center space-y-2">
          <p className="text-muted font-medium">Aucun résultat</p>
          <p className="body-muted text-sm">Essayez un autre terme ou filtre de type.</p>
        </div>
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
