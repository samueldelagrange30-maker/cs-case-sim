import { useCallback, useEffect, useState } from 'react'
import {
  CHARGES_ENABLED,
  MAX_CHARGES,
  formatCountdown,
  loadCharges,
  msUntilNextCharge,
  tryConsumeCharges,
  type ChargesState,
} from '../lib/charges'

export function useCharges() {
  const [state, setState] = useState<ChargesState>(() => ({
    charges: MAX_CHARGES,
    updatedAt: Date.now(),
  }))
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(() => {
    if (!CHARGES_ENABLED) {
      setState({ charges: MAX_CHARGES, updatedAt: Date.now() })
      setNow(Date.now())
      return
    }
    const next = loadCharges()
    setState(next)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Tick every 1s for countdown UI + regen detection (only when enabled)
  useEffect(() => {
    if (!CHARGES_ENABLED) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      const next = loadCharges(t)
      setState((prev) =>
        prev.charges === next.charges && prev.updatedAt === next.updatedAt
          ? prev
          : next,
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const tryConsume = useCallback(
    (n: number): boolean => {
      if (!CHARGES_ENABLED) return true
      const ok = tryConsumeCharges(n)
      if (ok) refresh()
      return ok
    },
    [refresh],
  )

  if (!CHARGES_ENABLED) {
    return {
      enabled: false as const,
      charges: MAX_CHARGES,
      maxCharges: MAX_CHARGES,
      isFull: true,
      msUntilNext: 0,
      nextLabel: null as string | null,
      tryConsume,
      refresh,
    }
  }

  const msNext = msUntilNextCharge(state, now)
  const isFull = state.charges >= MAX_CHARGES

  return {
    enabled: true as const,
    charges: state.charges,
    maxCharges: MAX_CHARGES,
    isFull,
    msUntilNext: msNext,
    nextLabel: isFull ? null : formatCountdown(msNext),
    tryConsume,
    refresh,
  }
}
