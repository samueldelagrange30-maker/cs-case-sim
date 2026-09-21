/**
 * Normalize free-text search so weapon queries match skin names robustly.
 * - case-insensitive
 * - strip ★ ™ and punctuation (M4A1-S ↔ m4a1s, MP7 | … ↔ mp7)
 * - collapse whitespace
 */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[★*™|/\\_\-.,;:'"()[\]{}<>+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Compact form without spaces — "m4a1 s" and "m4a1s" both match. */
export function compactSearch(s: string): string {
  return normalizeSearch(s).replace(/\s+/g, '')
}

/** True if haystack contains query as substring (normalized + compact). */
export function textMatches(haystack: string, queryNorm: string, queryCompact: string): boolean {
  if (!queryNorm) return true
  const h = normalizeSearch(haystack)
  if (h.includes(queryNorm)) return true
  if (queryCompact.length >= 2 && compactSearch(haystack).includes(queryCompact)) {
    return true
  }
  return false
}

/** Build a single searchable blob from crate index fields. */
export function crateSearchBlob(c: {
  name: string
  market_hash_name: string
  contains_names?: string[]
}): string {
  const parts = [c.name, c.market_hash_name, ...(c.contains_names ?? [])]
  return parts.join(' \n ')
}
