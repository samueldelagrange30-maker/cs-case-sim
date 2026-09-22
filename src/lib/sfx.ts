/** Web Audio SFX for case opens — no external assets. */

const STORAGE_KEY = 'cs-case-sim-sfx-v1'
const VOLUME_KEY = 'cs-case-sim-sfx-vol-v1'

let ctx: AudioContext | null = null
let muted = loadMuted()
let volume = loadVolume()

function loadMuted(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === null) return false
    return v === '0' || v === 'false' || v === 'off'
  } catch {
    return false
  }
}

function loadVolume(): number {
  try {
    const v = localStorage.getItem(VOLUME_KEY)
    if (v === null) return 0.7
    const n = Number(v)
    if (!Number.isFinite(n)) return 0.7
    return Math.min(1, Math.max(0, n))
  } catch {
    return 0.7
  }
}

export function isSfxMuted(): boolean {
  return muted
}

export function setSfxMuted(next: boolean): void {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? '0' : '1')
  } catch {
    /* ignore */
  }
}

export function toggleSfxMuted(): boolean {
  setSfxMuted(!muted)
  return muted
}

export function getSfxVolume(): number {
  return volume
}

export function setSfxVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next))
  try {
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch {
    /* ignore */
  }
}

function effectiveGain(peak: number): number {
  if (muted) return 0
  return peak * volume
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

/** Resume AudioContext after a user gesture (call on open click). */
export async function resumeAudio(): Promise<void> {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      /* ignore */
    }
  }
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gainPeak: number,
  dest?: AudioNode,
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, effectiveGain(gainPeak)), start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g)
  g.connect(dest ?? c.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

function noiseBurst(
  c: AudioContext,
  start: number,
  dur: number,
  gainPeak: number,
  dest?: AudioNode,
) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 2000
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, effectiveGain(gainPeak)), start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(dest ?? c.destination)
  src.start(start)
  src.stop(start + dur + 0.02)
}

export type SfxRarity =
  | 'consumer'
  | 'industrial'
  | 'milspec'
  | 'restricted'
  | 'classified'
  | 'covert'
  | 'extraordinary'
  | 'rare'

/** Light tick while roulette spins. */
export function playSpinTick(intensity = 0.04): void {
  if (muted) return
  const c = getCtx()
  if (!c || c.state !== 'running') return
  const t = c.currentTime
  tone(c, 880 + Math.random() * 120, t, 0.035, 'square', intensity * 0.35)
}

/** Reveal SFX keyed by rarity tier. */
export function playRevealSfx(tier: SfxRarity): void {
  if (muted) return
  const c = getCtx()
  if (!c) return
  void c.resume()
  const t = c.currentTime
  const master = c.createGain()
  master.gain.value = 0.55 * volume
  master.connect(c.destination)

  switch (tier) {
    case 'consumer':
    case 'industrial':
      // soft click
      tone(c, 420, t, 0.06, 'triangle', 0.18, master)
      noiseBurst(c, t, 0.04, 0.06, master)
      break
    case 'milspec':
      // short blip
      tone(c, 660, t, 0.1, 'sine', 0.22, master)
      tone(c, 990, t + 0.04, 0.08, 'sine', 0.12, master)
      break
    case 'restricted':
      // richer chime
      tone(c, 523.25, t, 0.22, 'sine', 0.2, master)
      tone(c, 659.25, t + 0.05, 0.25, 'sine', 0.16, master)
      tone(c, 783.99, t + 0.1, 0.28, 'sine', 0.12, master)
      break
    case 'classified':
      // stronger chime
      tone(c, 392, t, 0.15, 'triangle', 0.22, master)
      tone(c, 523.25, t + 0.04, 0.3, 'sine', 0.2, master)
      tone(c, 659.25, t + 0.08, 0.35, 'sine', 0.18, master)
      tone(c, 830.61, t + 0.12, 0.4, 'sine', 0.14, master)
      break
    case 'covert':
    case 'extraordinary':
    case 'rare': {
      // deep hit + sparkle arpeggio
      tone(c, 80, t, 0.35, 'sine', 0.35, master)
      tone(c, 110, t, 0.28, 'triangle', 0.22, master)
      noiseBurst(c, t, 0.08, 0.12, master)
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
      notes.forEach((f, i) => {
        tone(c, f, t + 0.12 + i * 0.07, 0.22, 'sine', 0.14 - i * 0.015, master)
      })
      break
    }
  }
}

export function rarityToSfxTier(
  rarityName: string,
  rarityId: string,
  isRareSpecial: boolean,
): SfxRarity {
  if (isRareSpecial) return 'rare'
  const id = rarityId.toLowerCase()
  const name = rarityName.toLowerCase()
  if (id.includes('contraband') || name.includes('contraband')) return 'rare'
  if (id === 'rarity_ancient' || name.includes('extraordinary'))
    return 'extraordinary'
  if (id.includes('ancient') || name.includes('covert')) return 'covert'
  if (id.includes('legendary') || name.includes('classified') || name.includes('exotic'))
    return 'classified'
  if (id.includes('mythical') || name.includes('restricted') || name.includes('remarkable'))
    return 'restricted'
  if (id.includes('rare') || name.includes('mil-spec') || name.includes('high grade'))
    return 'milspec'
  if (id.includes('uncommon') || name.includes('industrial')) return 'industrial'
  if (id.includes('common') || name.includes('consumer')) return 'consumer'
  return 'milspec'
}
