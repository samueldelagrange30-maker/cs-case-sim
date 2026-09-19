import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CHALLENGES,
  countCompletedAlbums,
  evaluateChallenges,
  ownedNameSet,
  type ChallengeProgress,
} from '../lib/challenges'
import {
  loadCollections,
  type CollectionAlbum,
} from '../lib/collections'
import { normalizeSkinName } from '../lib/normalizeName'
import type { SimStats } from '../lib/stats'
import type { OpenedSkin } from '../types'

interface Props {
  inventory: OpenedSkin[]
  stats: SimStats
  completedBadges: string[]
}

type Tab = 'albums' | 'challenges'

export function CollectionPage({
  inventory,
  stats,
  completedBadges,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab =
    searchParams.get('tab') === 'defis' ? 'challenges' : 'albums'
  const detailId = searchParams.get('album')

  const [albums, setAlbums] = useState<CollectionAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCollections()
      .then((data) => {
        if (!cancelled) {
          setAlbums(data)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const owned = useMemo(() => ownedNameSet(inventory), [inventory])
  const albumsCompleted = useMemo(
    () => countCompletedAlbums(albums, inventory),
    [albums, inventory],
  )

  const challengeRows = useMemo(
    () =>
      evaluateChallenges({
        stats,
        inventory,
        albumsCompleted,
      }),
    [stats, inventory, albumsCompleted],
  )

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (t === 'challenges') next.set('tab', 'defis')
    else next.delete('tab')
    next.delete('album')
    setSearchParams(next)
  }

  const openAlbum = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('album', id)
    next.delete('tab')
    setSearchParams(next)
  }

  const closeAlbum = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('album')
    setSearchParams(next)
  }

  if (loading) {
    return <p className="text-center text-muted py-20">Chargement des albums…</p>
  }
  if (error) {
    return (
      <p className="text-center text-covert py-20">
        Impossible de charger les collections : {error}
      </p>
    )
  }

  const detail = detailId ? albums.find((a) => a.id === detailId) : null

  if (detail) {
    return (
      <AlbumDetail album={detail} owned={owned} onBack={closeAlbum} />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Collection</h1>
        <p className="text-sm text-muted mt-1">
          Albums de skins et défis — progression dérivée de l&apos;inventaire
          (simulé).
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-panel p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('albums')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'albums'
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-text'
          }`}
        >
          Albums
        </button>
        <button
          type="button"
          onClick={() => setTab('challenges')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'challenges'
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-text'
          }`}
        >
          Défis
          {completedBadges.length > 0 && (
            <span className="ml-1.5 text-[11px] text-accent">
              {completedBadges.length}/{CHALLENGES.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'albums' ? (
        <AlbumsGrid albums={albums} owned={owned} onOpen={openAlbum} />
      ) : (
        <ChallengesList
          rows={challengeRows}
          completedBadges={completedBadges}
        />
      )}
    </div>
  )
}

function AlbumsGrid({
  albums,
  owned,
  onOpen,
}: {
  albums: CollectionAlbum[]
  owned: Set<string>
  onOpen: (id: string) => void
}) {
  const sorted = useMemo(() => {
    return [...albums].sort((a, b) => {
      const da = a.release_date || ''
      const db = b.release_date || ''
      return db.localeCompare(da)
    })
  }, [albums])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sorted.map((album) => {
        const total = album.items.length
        const have = album.items.filter((it) =>
          owned.has(normalizeSkinName(it.name)),
        ).length
        const pct = total ? Math.round((have / total) * 100) : 0
        return (
          <button
            key={album.id}
            type="button"
            onClick={() => onOpen(album.id)}
            className="text-left rounded-xl border border-border bg-panel hover:border-accent/50 transition p-3 flex flex-col gap-2"
          >
            <div className="aspect-square rounded-lg bg-panel-2 flex items-center justify-center overflow-hidden">
              <img
                src={album.image}
                alt={album.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain p-2"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold line-clamp-2">{album.name}</p>
              <p className="text-[11px] text-muted mt-0.5">
                {have}/{total} · {pct}%
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-panel-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function AlbumDetail({
  album,
  owned,
  onBack,
}: {
  album: CollectionAlbum
  owned: Set<string>
  onBack: () => void
}) {
  const have = album.items.filter((it) =>
    owned.has(normalizeSkinName(it.name)),
  ).length
  const total = album.items.length

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted hover:text-accent transition"
      >
        ← Tous les albums
      </button>
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <div className="w-28 h-28 shrink-0 rounded-xl border border-border bg-panel flex items-center justify-center p-2">
          <img
            src={album.image}
            alt={album.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-bold">{album.name}</h1>
          {album.release_date && (
            <p className="text-xs text-muted">Sortie : {album.release_date}</p>
          )}
          {album.crates.length > 0 && (
            <p className="text-xs text-muted">
              Caisses : {album.crates.join(', ')}
            </p>
          )}
          <p className="text-sm font-medium text-accent">
            {have}/{total} possédés ({total ? Math.round((have / total) * 100) : 0}
            %)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {album.items.map((it) => {
          const isOwned = owned.has(normalizeSkinName(it.name))
          return (
            <div
              key={it.id}
              className={`rounded-lg border bg-panel p-2 flex flex-col items-center transition ${
                isOwned
                  ? 'border-accent/40 opacity-100'
                  : 'border-border opacity-40 grayscale'
              }`}
              style={{
                boxShadow: isOwned
                  ? `inset 0 -2px 0 ${it.rarity.color || '#d4a017'}`
                  : undefined,
              }}
            >
              <img
                src={it.image}
                alt={it.name}
                loading="lazy"
                className="h-20 w-20 object-contain"
              />
              <p className="mt-1 text-[11px] text-center line-clamp-2 text-muted">
                {it.name}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: it.rarity.color || undefined }}
              >
                {it.rarity.name}
              </p>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted text-center">
        Correspondance par nom (StatTrak™ / Souvenir / ★ ignorés) —{' '}
        <Link to="/inventory" className="text-accent hover:underline">
          inventaire
        </Link>
      </p>
    </div>
  )
}

function ChallengesList({
  rows,
  completedBadges,
}: {
  rows: ChallengeProgress[]
  completedBadges: string[]
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const unlocked =
          row.completed || completedBadges.includes(row.def.id)
        return (
          <div
            key={row.def.id}
            className={`rounded-xl border p-4 flex gap-3 items-start ${
              unlocked
                ? 'border-accent/40 bg-accent/5'
                : 'border-border bg-panel'
            }`}
          >
            <div
              className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border"
              style={{
                borderColor: `${row.def.color}66`,
                background: `${row.def.color}22`,
                color: row.def.color,
              }}
              title={row.def.title}
            >
              {row.def.icon}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-sm">{row.def.title}</h3>
                {unlocked && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">
                    Débloqué
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{row.def.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-panel-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${row.percent}%`,
                      background: row.def.color,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-muted shrink-0">
                  {Math.min(row.current, row.target)}/{row.target}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
