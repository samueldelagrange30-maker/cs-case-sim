import type { CrateType, OpenedSkin } from '../types'

const FRAME_BASE = 'https://skinhub.gg/frame'
const PAGE_BASE = 'https://skinhub.gg/inspect'

/** Display-name (left of "|") → SkinHub weapon / glove id. */
const WEAPON_NAME_TO_ID: Record<string, string> = {
  // Rifles
  'AK-47': 'weapon_ak47',
  AUG: 'weapon_aug',
  FAMAS: 'weapon_famas',
  'Galil AR': 'weapon_galilar',
  'M4A1-S': 'weapon_m4a1_silencer',
  M4A4: 'weapon_m4a1',
  'SG 553': 'weapon_sg556',
  // Snipers
  AWP: 'weapon_awp',
  G3SG1: 'weapon_g3sg1',
  'SCAR-20': 'weapon_scar20',
  'SSG 08': 'weapon_ssg08',
  // SMGs
  'MAC-10': 'weapon_mac10',
  'MP5-SD': 'weapon_mp5sd',
  MP7: 'weapon_mp7',
  MP9: 'weapon_mp9',
  'PP-Bizon': 'weapon_bizon',
  P90: 'weapon_p90',
  'UMP-45': 'weapon_ump45',
  // Pistols
  'CZ75-Auto': 'weapon_cz75a',
  'Desert Eagle': 'weapon_deagle',
  'Dual Berettas': 'weapon_elite',
  'Five-SeveN': 'weapon_fiveseven',
  'Glock-18': 'weapon_glock',
  P2000: 'weapon_hkp2000',
  P250: 'weapon_p250',
  'R8 Revolver': 'weapon_revolver',
  'Tec-9': 'weapon_tec9',
  'USP-S': 'weapon_usp_silencer',
  // Heavy
  M249: 'weapon_m249',
  'MAG-7': 'weapon_mag7',
  Negev: 'weapon_negev',
  Nova: 'weapon_nova',
  'Sawed-Off': 'weapon_sawedoff',
  XM1014: 'weapon_xm1014',
  // Other
  'Zeus x27': 'weapon_taser',
  // Knives (★ stripped before lookup)
  Bayonet: 'weapon_bayonet',
  'Bowie Knife': 'weapon_knife_survival_bowie',
  'Butterfly Knife': 'weapon_knife_butterfly',
  'Classic Knife': 'weapon_knife_css',
  'Falchion Knife': 'weapon_knife_falchion',
  'Flip Knife': 'weapon_knife_flip',
  'Gut Knife': 'weapon_knife_gut',
  'Huntsman Knife': 'weapon_knife_tactical',
  Karambit: 'weapon_knife_karambit',
  'Kukri Knife': 'weapon_knife_kukri',
  'M9 Bayonet': 'weapon_knife_m9_bayonet',
  'Navaja Knife': 'weapon_knife_gypsy_jackknife',
  'Nomad Knife': 'weapon_knife_outdoor',
  'Paracord Knife': 'weapon_knife_cord',
  'Shadow Daggers': 'weapon_knife_push',
  'Skeleton Knife': 'weapon_knife_skeleton',
  'Stiletto Knife': 'weapon_knife_stiletto',
  'Survival Knife': 'weapon_knife_canis',
  'Talon Knife': 'weapon_knife_widowmaker',
  'Ursus Knife': 'weapon_knife_ursus',
  // Gloves
  'Bloodhound Gloves': 'studded_bloodhound_gloves',
  'Broken Fang Gloves': 'studded_brokenfang_gloves',
  'Driver Gloves': 'slick_gloves',
  'Hand Wraps': 'leather_handwraps',
  'Hydra Gloves': 'studded_hydra_gloves',
  'Moto Gloves': 'motorcycle_gloves',
  'Specialist Gloves': 'specialist_gloves',
  'Sport Gloves': 'sporty_gloves',
}

const NON_VIEWER_CRATE_TYPES: CrateType[] = [
  'Sticker Capsule',
  'Autograph Capsule',
  'Music Kit Box',
  'Patch Capsule',
  'Pins',
  'Graffiti',
  'Souvenir Highlight',
]

const WEAR_SUFFIX_RE =
  /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i

/**
 * How many display-name → SkinHub id entries we ship (for reporting).
 */
export const SKINHUB_WEAPON_MAP_COUNT = Object.keys(WEAPON_NAME_TO_ID).length

/** Strip StatTrak™ / Souvenir / wear suffix; keep ★ for knives/gloves. */
export function baseMarketName(name: string): string {
  let n = name.trim()
  n = n.replace(/^StatTrak™\s+/i, '')
  n = n.replace(/^Souvenir\s+/i, '')
  n = n.replace(WEAR_SUFFIX_RE, '')
  return n.trim()
}

/**
 * Map a full skin name (e.g. "M4A1-S | Hot Rod", "★ Karambit | Fade") to a
 * SkinHub weapon id, or null if unknown.
 */
export function weaponKeyFromSkinName(name: string): string | null {
  const base = baseMarketName(name)
  let weaponPart = base.includes('|') ? base.split('|')[0]!.trim() : base.trim()
  // Keep lookup key without ★; map stores "Karambit" not "★ Karambit"
  if (weaponPart.startsWith('★')) {
    weaponPart = weaponPart.slice(1).trim()
  }
  return WEAPON_NAME_TO_ID[weaponPart] ?? null
}

/** Stickers / graffiti / music / patches / pins — no 3D weapon embed. */
export function isSkinHubNonWeapon(skin: OpenedSkin): boolean {
  if (NON_VIEWER_CRATE_TYPES.includes(skin.crateType)) return true
  const name = skin.item.name ?? ''
  if (/^sticker\s*\|/i.test(name)) return true
  if (/^sealed graffiti\s*\|/i.test(name)) return true
  if (/^graffiti\s*\|/i.test(name)) return true
  if (/^music kit\s*\|/i.test(name)) return true
  if (/^patch\s*\|/i.test(name)) return true
  if (/^pin\s*\|/i.test(name) || /^collectible\s*\|/i.test(name)) return true
  return false
}

export function canUseSkinHubViewer(skin: OpenedSkin): boolean {
  if (isSkinHubNonWeapon(skin)) return false
  const weapon = weaponKeyFromSkinName(skin.item.name)
  const paint = skin.item.paint_index
  if (weapon && paint != null && paint !== '') return true
  // Hash fallback still works for named weapons/knives
  if (weapon || baseMarketName(skin.item.name).includes('|')) return true
  return false
}

export type SkinHubView = 'gun' | 'hands' | 'agent'

export interface SkinHubFrameOptions {
  /** Camera / scene view. Default 'gun'. */
  view?: SkinHubView
  /** Optional camera side (guns default left). */
  side?: 'left' | 'right' | 'muzzle' | 'stock' | 'top' | 'bottom'
  /** Turntable auto-spin. Default false (manual orbit only). */
  autorotate?: boolean
  /** Agent model id when view=agent. Default 5036 (Default T). */
  agent?: string
}

/** Shared weapon/paint/hash + float/seed (+ view/agent) query params. */
function appendItemParams(
  params: URLSearchParams,
  skin: OpenedSkin,
  opts: SkinHubFrameOptions = {},
): void {
  const weapon = weaponKeyFromSkinName(skin.item.name)
  const paintRaw = skin.item.paint_index
  const paint =
    paintRaw != null && paintRaw !== '' && !Number.isNaN(Number(paintRaw))
      ? String(Number(paintRaw))
      : null

  if (weapon && paint != null) {
    params.set('weapon', weapon)
    params.set('paint', paint)
  } else {
    params.set('hash', baseMarketName(skin.item.name))
  }

  if (skin.float != null && Number.isFinite(skin.float)) {
    params.set('float', String(skin.float))
  }
  if (skin.paintSeed != null && Number.isFinite(skin.paintSeed)) {
    params.set('seed', String(Math.floor(skin.paintSeed)))
  }

  const view = opts.view ?? 'gun'
  params.set('view', view)
  if (view === 'agent' && !params.has('agent')) {
    params.set('agent', opts.agent ?? '5036')
  }
}

/**
 * Build https://skinhub.gg/frame URL.
 * Prefers weapon+paint when both known; otherwise hash=baseMarketName.
 */
export function buildSkinHubFrameUrl(
  skin: OpenedSkin,
  opts: SkinHubFrameOptions = {},
): string {
  const params = new URLSearchParams()
  appendItemParams(params, skin, opts)

  // Manual orbit by default; autorotate is opt-in via UI toggle.
  params.set('autorotate', opts.autorotate ? '1' : '0')
  params.set('orbit', '1')
  params.set('wheel', '1')
  params.set('hdrispin', '0')
  params.set('bg', 'transparent')
  params.set('hostloading', '1')
  params.set('map', 'none')

  if (opts.side) params.set('side', opts.side)

  return `${FRAME_BASE}?${params.toString()}`
}

/**
 * Build https://skinhub.gg/inspect page URL for the same item (opens in new tab).
 * Same weapon/paint OR hash + float/seed/view as the frame embed.
 */
export function buildSkinHubPageUrl(
  skin: OpenedSkin,
  opts: SkinHubFrameOptions = {},
): string {
  const params = new URLSearchParams()
  appendItemParams(params, skin, opts)
  return `${PAGE_BASE}?${params.toString()}`
}

/** Build a transient OpenedSkin so catalog / case-contents items can open InspectModal. */
export function previewOpenedFromItem(
  item: import('../types').SkinItem,
  crate: Pick<import('../types').Crate, 'id' | 'name' | 'type'>,
  opts?: { isRareSpecial?: boolean },
): import('../types').OpenedSkin {
  const isCaseLike = crate.type === 'Case' || crate.type === 'Souvenir'
  return {
    uid: `preview-${item.id}-${Date.now()}`,
    caseId: crate.id,
    caseName: crate.name,
    crateType: crate.type,
    item,
    wear: isCaseLike ? 'FN' : null,
    wearLabel: isCaseLike ? 'Factory New' : 'N/A',
    float: isCaseLike ? 0.01 : null,
    paintSeed: 500,
    hasWear: isCaseLike,
    isStatTrak: false,
    isRareSpecial: !!opts?.isRareSpecial,
    openedAt: Date.now(),
    stickers: [],
  }
}
