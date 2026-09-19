const KEY = 'cs-case-sim-wallet-v1'
export const STARTING_BALANCE = 1000

export function loadWallet(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw == null) return STARTING_BALANCE
    const n = Number(raw)
    return Number.isFinite(n) ? n : STARTING_BALANCE
  } catch {
    return STARTING_BALANCE
  }
}

export function saveWallet(balance: number): void {
  localStorage.setItem(KEY, String(Math.max(0, Math.round(balance))))
}
