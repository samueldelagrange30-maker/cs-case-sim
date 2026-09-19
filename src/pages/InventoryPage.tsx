import { useState } from 'react'
import { InventoryList } from '../components/InventoryList'
import { InspectModal } from '../components/inspect/InspectModal'
import { ListForSaleModal } from '../components/market/ListForSaleModal'
import type { OpenedSkin, SaleRecord } from '../types'

interface Props {
  items: OpenedSkin[]
  sales: SaleRecord[]
  onClear: () => void
  onListForSale: (
    skin: OpenedSkin,
    opts: {
      startPrice: number
      buyoutPrice?: number
      durationMinutes: number
    },
  ) => void
}

export function InventoryPage({
  items,
  sales,
  onClear,
  onListForSale,
}: Props) {
  const [listingSkin, setListingSkin] = useState<OpenedSkin | null>(null)
  const [inspectSkin, setInspectSkin] = useState<OpenedSkin | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Inventaire</h1>
          <p className="text-sm text-muted mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} (stocké
            localement) — cliquez pour inspecter et voir l&apos;historique des
            ventes
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
      <InventoryList
        items={items}
        onListForSale={setListingSkin}
        onInspect={setInspectSkin}
      />

      {listingSkin && (
        <ListForSaleModal
          skin={listingSkin}
          onClose={() => setListingSkin(null)}
          onConfirm={(opts) => {
            onListForSale(listingSkin, opts)
            setListingSkin(null)
          }}
        />
      )}

      {inspectSkin && (
        <InspectModal
          skin={
            items.find((i) => i.uid === inspectSkin.uid) ?? inspectSkin
          }
          onClose={() => setInspectSkin(null)}
          sales={sales}
        />
      )}
    </div>
  )
}
