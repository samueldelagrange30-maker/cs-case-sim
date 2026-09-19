export interface CollectionItem {
  id: string
  name: string
  image: string
  rarity: { name: string; color: string }
}

export interface CollectionAlbum {
  id: string
  name: string
  image: string
  release_date: string
  crates: string[]
  items: CollectionItem[]
}

export interface CollectionIndexEntry {
  id: string
  name: string
  image: string
  release_date: string
  crates: string[]
  item_count: number
}

let collectionsCache: CollectionAlbum[] | null = null
let skinMapCache: Record<string, string[]> | null = null

export async function loadCollections(): Promise<CollectionAlbum[]> {
  if (collectionsCache) return collectionsCache
  const base = import.meta.env.BASE_URL
  const res = await fetch(`${base}data/collections.json`)
  if (!res.ok) throw new Error(`collections.json HTTP ${res.status}`)
  const data = (await res.json()) as CollectionAlbum[]
  collectionsCache = data
  return data
}

export async function loadSkinCollectionsMap(): Promise<
  Record<string, string[]>
> {
  if (skinMapCache) return skinMapCache
  const base = import.meta.env.BASE_URL
  const res = await fetch(`${base}data/skin_collections.json`)
  if (!res.ok) throw new Error(`skin_collections.json HTTP ${res.status}`)
  const data = (await res.json()) as Record<string, string[]>
  skinMapCache = data
  return data
}

/** Sync lookup after map has been loaded (may return undefined if not ready). */
export function lookupSkinCollections(
  name: string,
  map?: Record<string, string[]> | null,
): string[] | undefined {
  const m = map ?? skinMapCache
  if (!m) return undefined
  return m[name] ?? undefined
}
