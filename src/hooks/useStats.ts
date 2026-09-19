import { useCallback, useEffect, useState } from 'react'
import {
  loadCompletedBadges,
  loadStats,
  saveCompletedBadges,
  saveStats,
  type SimStats,
} from '../lib/stats'

export function useStats() {
  const [stats, setStats] = useState<SimStats>(loadStats)
  const [completedBadges, setCompletedBadges] = useState<string[]>(
    loadCompletedBadges,
  )

  useEffect(() => {
    setStats(loadStats())
    setCompletedBadges(loadCompletedBadges())
  }, [])

  const patchStats = useCallback((partial: Partial<SimStats>) => {
    setStats((prev) => {
      const next = { ...prev, ...partial }
      saveStats(next)
      return next
    })
  }, [])

  const incrementOpens = useCallback((n: number) => {
    if (n <= 0) return
    setStats((prev) => {
      const next = { ...prev, opensCount: prev.opensCount + n }
      saveStats(next)
      return next
    })
  }, [])

  const incrementTradeUps = useCallback((n = 1) => {
    setStats((prev) => {
      const next = { ...prev, tradeUpsCount: prev.tradeUpsCount + n }
      saveStats(next)
      return next
    })
  }, [])

  const incrementMarketSold = useCallback((n = 1) => {
    setStats((prev) => {
      const next = { ...prev, marketSoldCount: prev.marketSoldCount + n }
      saveStats(next)
      return next
    })
  }, [])

  const markBadgesCompleted = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setCompletedBadges((prev) => {
      const set = new Set(prev)
      let changed = false
      for (const id of ids) {
        if (!set.has(id)) {
          set.add(id)
          changed = true
        }
      }
      if (!changed) return prev
      const next = [...set]
      saveCompletedBadges(next)
      return next
    })
  }, [])

  return {
    stats,
    completedBadges,
    patchStats,
    incrementOpens,
    incrementTradeUps,
    incrementMarketSold,
    markBadgesCompleted,
  }
}
