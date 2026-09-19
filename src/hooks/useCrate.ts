import { useEffect, useState } from 'react'
import type { Crate } from '../types'

const cache = new Map<string, Crate>()

export function useCrate(id: string | undefined) {
  const [crate, setCrate] = useState<Crate | null>(() =>
    id && cache.has(id) ? cache.get(id)! : null,
  )
  const [loading, setLoading] = useState(() => !(id && cache.has(id)))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setCrate(null)
      setLoading(false)
      setError(null)
      return
    }
    if (cache.has(id)) {
      setCrate(cache.get(id)!)
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const safe = encodeURIComponent(id.replace(/\//g, '_'))
        const res = await fetch(
          `${import.meta.env.BASE_URL}data/crates/${safe}.json`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Crate
        cache.set(id, data)
        if (!cancelled) {
          setCrate(data)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setCrate(null)
          setError(e instanceof Error ? e.message : 'Erreur de chargement')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return { crate, loading, error }
}
