/**
 * Map CS-style market names to procedural mesh families.
 * Procedural only — no Valve game models.
 */

export type WeaponFamily =
  | 'rifle_ar'
  | 'rifle_ak'
  | 'sniper'
  | 'smg'
  | 'shotgun'
  | 'pistol'
  | 'heavy'
  | 'knife'
  | 'gloves'
  | 'other'

/** Strip StatTrak™ / Souvenir / ★ and take the weapon side of "Weapon | Skin". */
export function weaponBaseName(itemName: string): string {
  let name = (itemName ?? '').trim()
  name = name.replace(/^★\s*/u, '')
  name = name.replace(/^stat\s*trak\s*™?\s*/iu, '')
  name = name.replace(/^souvenir\s+/iu, '')
  name = name.replace(/^★\s*/u, '')
  const pipe = name.indexOf('|')
  if (pipe >= 0) name = name.slice(0, pipe)
  return name.trim().toLowerCase()
}

const FAMILY_RULES: { family: WeaponFamily; patterns: RegExp[] }[] = [
  {
    family: 'gloves',
    patterns: [
      /\bgloves?\b/,
      /\bhand\s*wraps?\b/,
      /^★?\s*driver\s+gloves/,
      /^★?\s*sport\s+gloves/,
      /^★?\s*moto\s+gloves/,
      /^★?\s*specialist\s+gloves/,
      /^★?\s*bloodhound\s+gloves/,
      /^★?\s*hydra\s+gloves/,
      /^★?\s*broken\s+fang\s+gloves/,
    ],
  },
  {
    family: 'knife',
    patterns: [
      /\bknife\b/,
      /\bkarambit\b/,
      /\bbayonet\b/,
      /\bshadow\s*daggers?\b/,
      /\bbowie\b/,
      /\bbutterfly\b/,
      /\bfalchion\b/,
      /\bgut\b/,
      /\bhuntsman\b/,
      /\bnavaja\b/,
      /\bstiletto\b/,
      /\btalon\b/,
      /\bursus\b/,
      /\bskeleton\b/,
      /\bnomad\b/,
      /\bparacord\b/,
      /\bsurvival\b/,
      /\bclassic\s+knife\b/,
      /\bcank\b/,
      /\bkukri\b/,
    ],
  },
  {
    family: 'rifle_ak',
    patterns: [/\bak[- ]?47\b/, /\bak[- ]?12\b/],
  },
  {
    family: 'rifle_ar',
    patterns: [
      /\bm4a[14][- ]?s?\b/,
      /\bm4a1-s\b/,
      /\bm4a4\b/,
      /\baug\b/,
      /\bfamas\b/,
      /\bgalil\b/,
      /\bsg\s*553\b/,
      /\bsg553\b/,
    ],
  },
  {
    family: 'sniper',
    patterns: [
      /\bawp\b/,
      /\bssg[- ]?08\b/,
      /\bscar[- ]?20\b/,
      /\bg3sg1\b/,
    ],
  },
  {
    family: 'smg',
    patterns: [
      /\bmp9\b/,
      /\bmp7\b/,
      /\bmp5[- ]?sd\b/,
      /\bmac[- ]?10\b/,
      /\bump[- ]?45\b/,
      /\bp90\b/,
      /\bpp[- ]?bizon\b/,
      /\bbizon\b/,
    ],
  },
  {
    family: 'shotgun',
    patterns: [
      /\bnova\b/,
      /\bxm1014\b/,
      /\bmag[- ]?7\b/,
      /\bsawed[- ]?off\b/,
    ],
  },
  {
    family: 'heavy',
    patterns: [/\bnegev\b/, /\bm249\b/],
  },
  {
    family: 'pistol',
    patterns: [
      /\bglock[- ]?18\b/,
      /\bglock\b/,
      /\busp[- ]?s\b/,
      /\bp250\b/,
      /\bp2000\b/,
      /\bdesert\s*eagle\b/,
      /\bdeagle\b/,
      /\bfive[- ]?seven\b/,
      /\bdual\s*berettas?\b/,
      /\btec[- ]?9\b/,
      /\bcz75[- ]?auto\b/,
      /\bcz75\b/,
      /\br8\s*revolver\b/,
      /\brevolver\b/,
      /\bzeus\b/,
      /\bp\d{3,4}\b/,
    ],
  },
]

/** Non-weapon market items that should stay on the HTML/card path. */
const OTHER_PREFIXES = [
  /^sticker\s*\|/i,
  /^patch\s*\|/i,
  /^graffiti\s*\|/i,
  /^seale[dt]\s+graffiti/i,
  /^music\s*kit\s*\|/i,
  /^pin\s*\|/i,
  /^collectible/i,
  /^charm\s*\|/i,
]

export function parseWeaponFamily(itemName: string): WeaponFamily {
  const raw = (itemName ?? '').trim()
  if (!raw) return 'other'
  if (OTHER_PREFIXES.some((re) => re.test(raw))) return 'other'

  const base = weaponBaseName(raw)
  if (!base) return 'other'

  // Gloves often appear as "★ Sport Gloves | ..." — base already stripped ★
  for (const rule of FAMILY_RULES) {
    for (const re of rule.patterns) {
      if (re.test(base) || re.test(raw.toLowerCase())) {
        return rule.family
      }
    }
  }

  // Heuristic: if it looks like "Something | Skin" with wear-capable naming, default AR silhouette
  if (raw.includes('|') && !/^sticker/i.test(raw)) {
    // Unknown gun → AR-ish silhouette is the most generic long gun
    if (
      /\b(rifle|carbine|machine)\b/i.test(base) ||
      base.length > 2
    ) {
      // Still check gloves/knife leftovers
      if (/\bglove/.test(base)) return 'gloves'
      // Prefer pistol-length names that slipped through
      return 'rifle_ar'
    }
  }

  return 'other'
}

export function isProceduralWeaponFamily(family: WeaponFamily): boolean {
  return family !== 'other' && family !== 'gloves'
}
