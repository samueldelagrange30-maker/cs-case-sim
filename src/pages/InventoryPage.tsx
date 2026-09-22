import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InventoryList } from '../components/InventoryList'
import { InspectModal } from '../components/inspect/InspectModal'
import { ListForSaleModal } from '../components/market/ListForSaleModal'
import type { OpenedSkin, SaleRecord } from '../types'
import type { useEngagement } from '../hooks/useEngagement'
import { normalizeSkinName } from '../lib/normalizeName'

type EngagementApi = ReturnType<typeof useEngagement>

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
  engagement: EngagementApi
}

export function InventoryPage({
  items,
  sales,
  onClear,
  onListForSale,
  engagement,
}: Props) {
  const [listingSkin, setListingSkin] = useState<OpenedSkin | null>(null)
  const [inspectSkin, setInspectSkin] = useState<OpenedSkin | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold title-display">
            Inventaire
          </h1>
          <p className="text-sm text-muted mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} (cet appareil) —
            favoris ★ · vitrine ◆
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length === 0 && (
            <Link to="/caisses" className="btn btn-primary btn-sm">
              Ouvrir des caisses
            </Link>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Vider tout l’inventaire ?')) onClear()
              }}
              className="btn btn-danger btn-sm"
            >
              Vider l&apos;inventaire
            </button>
          )}
        </div>
      </div>
      <InventoryList
        items={items}
        onListForSale={setListingSkin}
        onInspect={setInspectSkin}
        favoriteUids={engagement.eng.favoriteUids}
        vitrineUids={engagement.eng.vitrineUids}
        onToggleFavorite={engagement.favToggle}
        onToggleVitrine={engagement.vitrineToggle}
        onWishlistSkin={(skin) => {
          engagement.wishlistAdd({
            kind: 'skin',
            name: skin.item.name,
            image: skin.item.image,
            target: normalizeSkinName(skin.item.name),
          })
        }}
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
          skin={items.find((i) => i.uid === inspectSkin.uid) ?? inspectSkin}
          onClose={() => setInspectSkin(null)}
          sales={sales}
        />
      )}
    </div>
  )
}
