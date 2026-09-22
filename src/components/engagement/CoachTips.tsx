import { useState } from 'react'

const TIPS = [
  {
    title: 'Astuce',
    body: 'Choisissez une caisse et ouvrez ×1 — tout reste sur cet appareil (simulé).',
  },
  {
    title: 'Collection',
    body: 'Les albums suivent vos skins uniques. Marquez des favoris et une vitrine.',
  },
]

interface Props {
  onDismiss: () => void
}

/** Soft non-blocking coach marks — corner tips, dismissible. */
export function CoachTips({ onDismiss }: Props) {
  const [step, setStep] = useState(0)
  const tip = TIPS[step]!

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-[17rem] rounded-xl border border-accent/35 bg-panel/95 backdrop-blur-md px-3.5 py-3 shadow-xl shadow-black/50 pointer-events-auto"
      role="status"
    >
      <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">
        {tip.title}
      </p>
      <p className="text-xs text-muted mt-1 leading-relaxed">{tip.body}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">
          {step + 1}/{TIPS.length}
        </span>
        <div className="flex gap-1.5">
          {step < TIPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm !min-h-8 !px-2.5 !text-xs"
              onClick={() => setStep((s) => s + 1)}
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm !min-h-8 !px-2.5 !text-xs"
              onClick={onDismiss}
            >
              Compris
            </button>
          )}
          <button
            type="button"
            className="text-[11px] text-muted hover:text-text px-1.5"
            onClick={onDismiss}
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  )
}
