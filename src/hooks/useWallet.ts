import { useCallback, useEffect, useState } from 'react'
import { loadWallet, saveWallet } from '../lib/wallet'

export function useWallet() {
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    setBalance(loadWallet())
  }, [])

  const tryDebit = useCallback((amount: number): boolean => {
    const current = loadWallet()
    if (current < amount) return false
    const next = Math.round(current - amount)
    saveWallet(next)
    setBalance(next)
    return true
  }, [])

  const tryCredit = useCallback((amount: number) => {
    const current = loadWallet()
    const next = Math.round(current + amount)
    saveWallet(next)
    setBalance(next)
  }, [])

  return { balance, credit: tryCredit, debit: tryDebit, setBalance }
}
