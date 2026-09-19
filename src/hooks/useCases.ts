import { useEffect, useState } from 'react'
import type { CrateIndexEntry } from '../types'

export function useCases() {
  const [cases, setCases] = useState<CrateIndexEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.BASE_URL}data/crates_index.json`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as CrateIndexEntry[]
        if (!cancelled) {
          setCases(data)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur de chargement')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { cases, loading, error }
}
