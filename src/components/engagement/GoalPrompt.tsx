import { useMemo, useState } from 'react'
import {
  GOAL_TEMPLATES,
  type GoalTemplate,
} from '../../lib/goals'
import type { CollectionAlbum } from '../../lib/collections'
import type { WishlistEntry } from '../../lib/engagement'

interface Props {
  albums: CollectionAlbum[]
  wishlist: WishlistEntry[]
  onPick: (
    tpl: GoalTemplate,
    opts?: { album?: CollectionAlbum; wishlist?: WishlistEntry },
  ) => void
  onDismiss: () => void
}

/** Gentle post-first-open prompt to pick a personal goal. */
export function GoalPrompt({ albums, wishlist, onPick, onDismiss }: Props) {
  const [tplId, setTplId] = useState(GOAL_TEMPLATES[0]!.id)
  const tpl = useMemo(
    () => GOAL_TEMPLATES.find((t) => t.id === tplId) ?? GOAL_TEMPLATES[0]!,
    [tplId],
  )
  const incompleteAlbums = useMemo(
    () => albums.filter((a) => a.items.length > 0).slice(0, 40),
    [albums],
  )
  const [albumId, setAlbumId] = useState('')
  const [wlId, setWlId] = useState(wishlist[0]?.id ?? '')

  const confirm = () => {
    const album = incompleteAlbums.find((a) => a.id === albumId)
    const wl = wishlist.find((w) => w.id === wlId)
    if (tpl.needsAlbum && !album) return
    if (tpl.needsWishlist && !wl) return
    onPick(tpl, { album, wishlist: wl })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-xl border border-accent/40 bg-panel shadow-2xl shadow-black/50 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-accent">Objectif perso</p>
            <p className="text-xs text-muted mt-0.5">
              Choisissez un but — purement cosmétique, n’affecte pas les drops.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted hover:text-text shrink-0"
          >
            Plus tard
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
          {GOAL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTplId(t.id)}
              className={`text-left rounded-lg border px-2.5 py-2 text-xs transition ${
                tplId === t.id
                  ? 'border-accent/50 bg-accent/10 text-text'
                  : 'border-border bg-panel-2 text-muted hover:text-text'
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              {t.title}
            </button>
          ))}
        </div>

        {tpl.needsAlbum && (
          <label className="block space-y-1">
            <span className="text-[11px] text-muted">Album</span>
            <select
              className="input-field text-sm"
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {incompleteAlbums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {tpl.needsWishlist && (
          <label className="block space-y-1">
            <span className="text-[11px] text-muted">Wishlist</span>
            {wishlist.length === 0 ? (
              <p className="text-xs text-muted">
                Ajoutez d’abord un souhait (collection / inventaire).
              </p>
            ) : (
              <select
                className="input-field text-sm"
                value={wlId}
                onChange={(e) => setWlId(e.target.value)}
              >
                {wishlist.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        )}

        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={confirm}
          disabled={
            (tpl.needsAlbum && !albumId) ||
            (tpl.needsWishlist && wishlist.length === 0)
          }
        >
          C’est parti
        </button>
      </div>
    </div>
  )
}
