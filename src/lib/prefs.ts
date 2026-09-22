/** UI prefs persisted in localStorage (animation length, etc.). */

const KEY = 'cs-case-sim-prefs-v1'

export type UiPrefs = {
  /** Shorter roulette (~1.2s) instead of full cinematic. */
  shortAnim: boolean
}

const DEFAULTS: UiPrefs = {
  shortAnim: false,
}

function loadRaw(): Partial<UiPrefs> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Partial<UiPrefs>
  } catch {
    return {}
  }
}

export function loadPrefs(): UiPrefs {
  const raw = loadRaw()
  return {
    shortAnim: typeof raw.shortAnim === 'boolean' ? raw.shortAnim : DEFAULTS.shortAnim,
  }
}

export function savePrefs(patch: Partial<UiPrefs>): UiPrefs {
  const next = { ...loadPrefs(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
  return next
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
