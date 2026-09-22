import { Link } from 'react-router-dom'
import type { ActiveGoal, GoalProgress } from '../../lib/goals'
import type { CollectionAlbum } from '../../lib/collections'
import type { LastDiscovered } from '../../lib/engagement'

interface Props {
  bestAlbum: {
    album: CollectionAlbum
    have: number
    total: number
    pct: number
  } | null
  lastDiscovered: LastDiscovered | null
  goal: ActiveGoal | null
  goalProgress: GoalProgress | null
  lastCaseId: string | null
}

export function ResumeCard({
  bestAlbum,
  lastDiscovered,
  goal,
  goalProgress,
  lastCaseId,
}: Props) {
  const hasAnything =
    bestAlbum || lastDiscovered || goal || lastCaseId
  if (!hasAnything) return null

  const resumePath = lastCaseId
    ? `/case/${encodeURIComponent(lastCaseId)}`
    : bestAlbum
      ? `/collection?album=${encodeURIComponent(bestAlbum.album.id)}`
      : '/caisses'

  return (
    <div className="surface p-4 sm:p-5 space-y-3 border-accent/25">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-accent">Reprendre</h2>
          <p className="text-[11px] text-muted mt-0.5">
            Progression stockée sur cet appareil uniquement.
          </p>
        </div>
        <Link to={resumePath} className="btn btn-primary btn-sm">
          Reprendre
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {bestAlbum && (
          <Link
            to={`/collection?album=${encodeURIComponent(bestAlbum.album.id)}`}
            className="rounded-lg border border-border bg-panel-2/60 p-3 hover:border-accent/40 transition space-y-1.5"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted">
              Album en cours
            </p>
            <p className="text-xs font-medium line-clamp-2">
              {bestAlbum.album.name}
            </p>
            <div className="h-1.5 rounded-full bg-panel overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${bestAlbum.pct}%` }}
              />
            </div>
            <p className="text-[11px] text-muted">
              {bestAlbum.have}/{bestAlbum.total} · {bestAlbum.pct}%
            </p>
          </Link>
        )}

        {lastDiscovered && (
          <div className="rounded-lg border border-border bg-panel-2/60 p-3 flex gap-2 items-center">
            <img
              src={lastDiscovered.image}
              alt=""
              className="h-12 w-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Dernière découverte
              </p>
              <p className="text-xs font-medium line-clamp-2">
                {lastDiscovered.name}
              </p>
            </div>
          </div>
        )}

        {goal && goalProgress && (
          <div className="rounded-lg border border-border bg-panel-2/60 p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted">
              Objectif actif
            </p>
            <p className="text-xs font-medium line-clamp-2">{goal.title}</p>
            <div className="h-1.5 rounded-full bg-panel overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  goalProgress.completed ? 'bg-success' : 'bg-accent'
                }`}
                style={{ width: `${goalProgress.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted">{goalProgress.hint}</p>
            {goalProgress.ctaPath && (
              <Link
                to={goalProgress.ctaPath}
                className="text-[11px] text-accent hover:underline"
              >
                {goalProgress.ctaLabel ?? 'Continuer'} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
