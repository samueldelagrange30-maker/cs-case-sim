import { Link } from 'react-router-dom'
import type { ActiveGoal, GoalProgress } from '../../lib/goals'
import { GOAL_TEMPLATES, type GoalTemplate } from '../../lib/goals'
import type { CollectionAlbum } from '../../lib/collections'
import type { WishlistEntry } from '../../lib/engagement'
import { useState } from 'react'

interface Props {
  goal: ActiveGoal | null
  progress: GoalProgress | null
  albums: CollectionAlbum[]
  wishlist: WishlistEntry[]
  onPick: (
    tpl: GoalTemplate,
    opts?: { album?: CollectionAlbum; wishlist?: WishlistEntry },
  ) => void
  onClear: () => void
}

export function GoalPanel({
  goal,
  progress,
  albums,
  wishlist,
  onPick,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false)
  const [tplId, setTplId] = useState(GOAL_TEMPLATES[0]!.id)
  const [albumId, setAlbumId] = useState('')
  const [wlId, setWlId] = useState(wishlist[0]?.id ?? '')

  const tpl = GOAL_TEMPLATES.find((t) => t.id === tplId) ?? GOAL_TEMPLATES[0]!

  const confirm = () => {
    const album = albums.find((a) => a.id === albumId)
    const wl = wishlist.find((w) => w.id === wlId)
    if (tpl.needsAlbum && !album) return
    if (tpl.needsWishlist && !wl) return
    onPick(tpl, { album, wishlist: wl })
    setOpen(false)
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Objectif personnel</h2>
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Fermer' : goal ? 'Changer' : 'Définir'}
        </button>
      </div>

      {goal && progress && !open ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">{goal.title}</p>
          <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress.completed ? 'bg-success' : 'bg-accent'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted">{progress.hint}</p>
          {progress.completed && (
            <p className="text-xs text-success font-semibold">
              🎉 Objectif atteint ! (cosmétique — odds inchangés)
            </p>
          )}
          {progress.ctaPath && (
            <Link
              to={progress.ctaPath}
              className="inline-flex text-xs text-accent hover:underline"
            >
              Prochaine étape : {progress.ctaLabel ?? 'Continuer'} →
            </Link>
          )}
          {goal.completedAt && (
            <button
              type="button"
              className="text-[11px] text-muted hover:text-text"
              onClick={onClear}
            >
              Effacer l’objectif
            </button>
          )}
        </div>
      ) : !open ? (
        <p className="text-xs text-muted">
          Aucun objectif actif. Définissez-en un pour un fil rouge léger.
        </p>
      ) : null}

      {open && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
            {GOAL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTplId(t.id)}
                className={`text-left rounded-lg border px-2 py-1.5 text-xs ${
                  tplId === t.id
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border'
                }`}
              >
                {t.icon} {t.title}
              </button>
            ))}
          </div>
          {tpl.needsAlbum && (
            <select
              className="input-field text-sm"
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
            >
              <option value="">Album…</option>
              {albums.slice(0, 60).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          {tpl.needsWishlist && (
            <select
              className="input-field text-sm"
              value={wlId}
              onChange={(e) => setWlId(e.target.value)}
            >
              {wishlist.length === 0 ? (
                <option value="">Wishlist vide</option>
              ) : (
                wishlist.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))
              )}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={confirm}>
              Activer
            </button>
            {goal && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
                Effacer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
