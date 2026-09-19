export interface SimStats {
  opensCount: number
  tradeUpsCount: number
  marketSoldCount: number
}

const KEY = 'cs-case-sim-stats-v1'
const BADGES_KEY = 'cs-case-sim-badges-v1'

const DEFAULT: SimStats = {
  opensCount: 0,
  tradeUpsCount: 0,
  marketSoldCount: 0,
}

export function loadStats(): SimStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<SimStats>
    return {
      opensCount: Number(parsed.opensCount) || 0,
      tradeUpsCount: Number(parsed.tradeUpsCount) || 0,
      marketSoldCount: Number(parsed.marketSoldCount) || 0,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveStats(stats: SimStats): void {
  localStorage.setItem(KEY, JSON.stringify(stats))
}

export function loadCompletedBadges(): string[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function saveCompletedBadges(ids: string[]): void {
  localStorage.setItem(BADGES_KEY, JSON.stringify(ids))
}
