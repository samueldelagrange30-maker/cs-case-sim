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
import type { useEngagement } from '../hooks/useEngagement'
import { GoalPanel } from '../components/engagement/GoalPanel'

type EngagementApi = ReturnType<typeof useEngagement>

interface Props {
  inventory: OpenedSkin[]
  stats: SimStats
  completedBadges: string[]
  engagement: EngagementApi
  albums?: CollectionAlbum[]
  albumsLoading?: boolean
}

type Tab = 'albums' | 'challenges' | 'wishlist'

export function CollectionPage({
  inventory,
  stats,
  completedBadges,
  engagement,
  albums: albumsProp,
  albumsLoading: albumsLoadingProp,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab =
    tabParam === 'defis'
      ? 'challenges'
      : tabParam === 'wishlist'
        ? 'wishlist'
        : 'albums'
  const detailId = searchParams.get('album')

  const [albumsLocal, setAlbumsLocal] = useState<CollectionAlbum[]>([])
  const [loadingLocal, setLoadingLocal] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const useProp = albumsProp != null
  const albums = useProp ? albumsProp : albumsLocal
  const loading = useProp ? !!albumsLoadingProp : loadingLocal

  useEffect(() => {
    if (useProp) return
    let cancelled = false
    loadCollections()
      .then((data) => {
        if (!cancelled) {
          setAlbumsLocal(data)
          setLoadingLocal(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur')
          setLoadingLocal(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [useProp])

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

  const goalProgress = engagement.getProgress(inventory, albums, stats)

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (t === 'challenges') next.set('tab', 'defis')
    else if (t === 'wishlist') next.set('tab', 'wishlist')
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
      <AlbumDetail
        album={detail}
        owned={owned}
        onBack={closeAlbum}
        onWishlistMissing={(name, image) => {
          engagement.wishlistAdd({
            kind: 'skin',
            name,
            image,
            target: normalizeSkinName(name),
          })
        }}
        onSetAlbumGoal={() => {
          const tpl = {
            id: 'tpl-album',
            kind: 'complete_album' as const,
            title: 'Compléter un album',
            description: '',
            target: detail.items.length,
            needsAlbum: true,
            icon: '💿',
          }
          engagement.pickGoal(tpl, { album: detail })
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Collection</h1>
        <p className="text-sm text-muted mt-1">
          Albums, objectifs et défis — progression sur cet appareil (simulé).
        </p>
      </div>

      <GoalPanel
        goal={engagement.goal}
        progress={goalProgress}
        albums={albums}
        wishlist={engagement.eng.wishlist}
        onPick={engagement.pickGoal}
        onClear={engagement.clearGoal}
      />

      <div className="flex gap-1 rounded-lg border border-border bg-panel p-1 w-fit flex-wrap">
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
          onClick={() => setTab('wishlist')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === 'wishlist'
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-text'
          }`}
        >
          Wishlist
          {engagement.eng.wishlist.length > 0 && (
            <span className="ml-1.5 text-[11px] text-accent">
              {engagement.eng.wishlist.length}
            </span>
          )}
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
      ) : tab === 'wishlist' ? (
        <WishlistPanel
          wishlist={engagement.eng.wishlist}
          owned={owned}
          onRemove={engagement.wishlistRemove}
        />
      ) : (
        <ChallengesList
          rows={challengeRows}
          completedBadges={completedBadges}
          goalHint={
            goalProgress && !goalProgress.completed
              ? goalProgress.hint
              : null
          }
          goalCta={
            goalProgress?.ctaPath
              ? { path: goalProgress.ctaPath, label: goalProgress.ctaLabel }
              : null
          }
        />
      )}
    </div>
  )
}

function WishlistPanel({
  wishlist,
  owned,
  onRemove,
}: {
  wishlist: EngagementApi['eng']['wishlist']
  owned: Set<string>
  onRemove: (id: string) => void
}) {
  if (wishlist.length === 0) {
    return (
      <div className="surface p-8 text-center space-y-2">
        <p className="text-muted">Wishlist vide</p>
        <p className="text-xs text-muted">
          Ajoutez des skins depuis l’inventaire ou un album, ou une caisse via
          la recherche.
        </p>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {wishlist.map((w) => {
        const found =
          w.kind === 'skin' && owned.has(normalizeSkinName(w.target))
        const link =
          w.kind === 'case'
            ? `/case/${encodeURIComponent(w.target)}`
            : `/caisses?q=${encodeURIComponent(w.name)}`
        return (
          <li
            key={w.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-panel p-3"
          >
            {w.image ? (
              <img src={w.image} alt="" className="h-12 w-12 object-contain" />
            ) : (
              <span className="h-12 w-12 rounded-lg bg-panel-2 flex items-center justify-center text-lg">
                {w.kind === 'case' ? '📦' : '⭐'}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{w.name}</p>
              <p className="text-[11px] text-muted">
                {w.kind === 'case' ? 'Caisse' : 'Skin'}
                {found ? ' · Trouvé ✓' : ''}
              </p>
            </div>
            <Link to={link} className="btn btn-ghost btn-sm !min-h-9 !text-xs">
              Chercher
            </Link>
            <button
              type="button"
              className="text-xs text-muted hover:text-covert"
              onClick={() => onRemove(w.id)}
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
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
      const ha = a.items.filter((it) =>
        owned.has(normalizeSkinName(it.name)),
      ).length
      const hb = b.items.filter((it) =>
        owned.has(normalizeSkinName(it.name)),
      ).length
      const pa = a.items.length ? ha / a.items.length : 0
      const pb = b.items.length ? hb / b.items.length : 0
      // In-progress first, then by % desc
      const ia = ha > 0 && ha < a.items.length ? 1 : 0
      const ib = hb > 0 && hb < b.items.length ? 1 : 0
      if (ib !== ia) return ib - ia
      if (pb !== pa) return pb - pa
      const da = a.release_date || ''
      const db = b.release_date || ''
      return db.localeCompare(da)
    })
  }, [albums, owned])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sorted.map((album) => {
        const total = album.items.length
        const have = album.items.filter((it) =>
          owned.has(normalizeSkinName(it.name)),
        ).length
        const pct = total ? Math.round((have / total) * 100) : 0
        const done = total > 0 && have >= total
        return (
          <button
            key={album.id}
            type="button"
            onClick={() => onOpen(album.id)}
            className={`text-left rounded-xl border bg-panel hover:border-accent/50 transition p-3 flex flex-col gap-2 ${
              done ? 'border-success/40' : 'border-border'
            }`}
          >
            <div className="aspect-square rounded-lg bg-panel-2 flex items-center justify-center overflow-hidden relative">
              <img
                src={album.image}
                alt={album.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain p-2"
              />
              {done && (
                <span className="absolute top-1 right-1 text-[10px] font-bold bg-success/90 text-[#0a0d12] px-1.5 py-0.5 rounded">
                  Complet
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold line-clamp-2">{album.name}</p>
              <p className="text-[11px] text-muted mt-0.5">
                {have}/{total} uniques · {pct}%
              </p>
              <div className="mt-1.5 h-2 rounded-full bg-panel-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    done ? 'bg-success' : 'bg-accent'
                  }`}
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
  onWishlistMissing,
  onSetAlbumGoal,
}: {
  album: CollectionAlbum
  owned: Set<string>
  onBack: () => void
  onWishlistMissing: (name: string, image: string) => void
  onSetAlbumGoal: () => void
}) {
  const have = album.items.filter((it) =>
    owned.has(normalizeSkinName(it.name)),
  ).length
  const total = album.items.length
  const pct = total ? Math.round((have / total) * 100) : 0

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
        <div className="text-center sm:text-left space-y-2 flex-1">
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
            {have}/{total} uniques ({pct}%)
          </p>
          <div className="h-2 max-w-xs mx-auto sm:mx-0 rounded-full bg-panel-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onSetAlbumGoal}
          >
            Objectif : compléter cet album
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {album.items.map((it) => {
          const isOwned = owned.has(normalizeSkinName(it.name))
          return (
            <div
              key={it.id}
              className={`rounded-lg border bg-panel p-2 flex flex-col items-center transition relative ${
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
              {!isOwned && (
                <button
                  type="button"
                  className="mt-1 text-[10px] text-accent hover:underline"
                  onClick={() => onWishlistMissing(it.name, it.image)}
                >
                  + Wishlist
                </button>
              )}
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
  goalHint,
  goalCta,
}: {
  rows: ChallengeProgress[]
  completedBadges: string[]
  goalHint: string | null
  goalCta: { path: string; label?: string } | null
}) {
  return (
    <div className="space-y-3">
      {goalHint && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted">
          Prochaine étape (objectif) : {goalHint}
          {goalCta && (
            <>
              {' · '}
              <Link to={goalCta.path} className="text-accent hover:underline">
                {goalCta.label ?? 'Continuer'}
              </Link>
            </>
          )}
        </div>
      )}
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
