const KEY = 'cs-case-sim-charges-v1'

/** Flip to true to re-enable open-charge gating / Header UI. */
export const CHARGES_ENABLED = false

export const MAX_CHARGES = 10
export const REGEN_MS = 10 * 60 * 1000 // 10 minutes

export interface ChargesState {
  charges: number
  updatedAt: number
}

function clampCharges(n: number): number {
  return Math.max(0, Math.min(MAX_CHARGES, Math.floor(n)))
}

/** Apply regen based on elapsed time; leftover ms preserved via updatedAt. */
export function applyRegen(
  state: ChargesState,
  now: number = Date.now(),
): ChargesState {
  let { charges, updatedAt } = state
  charges = clampCharges(charges)

  if (charges >= MAX_CHARGES) {
    return { charges: MAX_CHARGES, updatedAt: now }
  }

  const elapsed = Math.max(0, now - updatedAt)
  const gained = Math.floor(elapsed / REGEN_MS)
  if (gained <= 0) {
    return { charges, updatedAt }
  }

  const next = clampCharges(charges + gained)
  // Advance updatedAt by consumed intervals so leftover ms aren't lost
  const consumed = Math.min(gained, MAX_CHARGES - charges)
  const nextUpdatedAt = updatedAt + consumed * REGEN_MS

  if (next >= MAX_CHARGES) {
    return { charges: MAX_CHARGES, updatedAt: now }
  }
  return { charges: next, updatedAt: nextUpdatedAt }
}

export function defaultCharges(now: number = Date.now()): ChargesState {
  return { charges: MAX_CHARGES, updatedAt: now }
}

export function loadCharges(now: number = Date.now()): ChargesState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw == null) {
      const fresh = defaultCharges(now)
      saveCharges(fresh)
      return fresh
    }
    const parsed = JSON.parse(raw) as Partial<ChargesState>
    const base: ChargesState = {
      charges: clampCharges(Number(parsed.charges) || 0),
      updatedAt:
        typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : now,
    }
    const regenerated = applyRegen(base, now)
    if (
      regenerated.charges !== base.charges ||
      regenerated.updatedAt !== base.updatedAt
    ) {
      saveCharges(regenerated)
    }
    return regenerated
  } catch {
    const fresh = defaultCharges(now)
    try {
      saveCharges(fresh)
    } catch {
      /* ignore */
    }
    return fresh
  }
}

export function saveCharges(state: ChargesState): void {
  const toSave: ChargesState = {
    charges: clampCharges(state.charges),
    updatedAt: state.updatedAt,
  }
  localStorage.setItem(KEY, JSON.stringify(toSave))
}

/** Ms until next charge, or 0 if full. */
export function msUntilNextCharge(
  state: ChargesState,
  now: number = Date.now(),
): number {
  const current = applyRegen(state, now)
  if (current.charges >= MAX_CHARGES) return 0
  const elapsed = Math.max(0, now - current.updatedAt)
  return Math.max(0, REGEN_MS - (elapsed % REGEN_MS))
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Try to consume `n` charges. Returns true on success (and persists).
 * Re-reads + applies regen before debiting.
 */
export function tryConsumeCharges(
  n: number,
  now: number = Date.now(),
): boolean {
  if (!CHARGES_ENABLED) return true
  if (!Number.isFinite(n) || n <= 0) return false
  const need = Math.floor(n)
  const current = loadCharges(now)
  if (current.charges < need) return false
  const next: ChargesState = {
    charges: current.charges - need,
    updatedAt: current.updatedAt,
  }
  // If we just dropped below cap, start regen clock from now
  // so partial leftover from a full state is reset cleanly.
  if (current.charges >= MAX_CHARGES && next.charges < MAX_CHARGES) {
    next.updatedAt = now
  }
  saveCharges(next)
  return true
}
