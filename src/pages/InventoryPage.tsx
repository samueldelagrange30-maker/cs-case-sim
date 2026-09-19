import { InventoryList } from '../components/InventoryList'
import type { OpenedSkin } from '../types'

interface Props {
  items: OpenedSkin[]
  onClear: () => void
}

export function InventoryPage({ items, onClear }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Inventaire</h1>
          <p className="text-sm text-muted mt-1">
            {items.length} skin{items.length !== 1 ? 's' : ''} (stocké localement)
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Vider tout l’inventaire ?')) onClear()
            }}
            className="rounded-lg border border-covert/50 bg-covert/10 px-4 py-2 text-sm font-medium text-covert hover:bg-covert/20 transition"
          >
            Vider l&apos;inventaire
          </button>
        )}
      </div>
      <InventoryList items={items} />
    </div>
  )
}
