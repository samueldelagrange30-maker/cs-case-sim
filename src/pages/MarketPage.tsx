import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuctionCard } from '../components/market/AuctionCard'
import { SalesChart } from '../components/market/SalesChart'
import type { AuctionListing, OpenedSkin, SaleRecord } from '../types'
import { formatSim } from '../lib/pricing'

type Tab = 'active' | 'mine' | 'sold'

interface Props {
  active: AuctionListing[]
  mine: AuctionListing[]
  sales: SaleRecord[]
  listings: AuctionListing[]
  onBid: (listing: AuctionListing) => void
  onBuyout: (listing: AuctionListing) => void
  onCancel: (listing: AuctionListing) => void
  onInspect?: (skin: OpenedSkin) => void
}

export function MarketPage({
  active,
  mine,
  sales,
  listings,
  onBid,
  onBuyout,
  onCancel,
  onInspect,
}: Props) {
  const [tab, setTab] = useState<Tab>('active')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const itemNames = useMemo(() => {
    const set = new Set(sales.map((s) => s.itemName))
    return [...set].sort()
  }, [sales])

  const chartPoints = useMemo(() => {
    const name = selectedItem
    if (!name) return []
    return sales
      .filter((s) => s.itemName === name)
      .map((s) => ({ at: s.soldAt, value: s.soldPrice }))
  }, [sales, selectedItem])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'active', label: 'Enchères actives', count: active.length },
    { id: 'mine', label: 'Mes ventes', count: mine.length },
    { id: 'sold', label: 'Vendus / courbe', count: sales.length },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Marché aux enchères</h1>
        <p className="text-sm text-muted mt-1">
          Marché <strong className="text-accent">simulé</strong> — devise fictive
          $SIM, pas d&apos;argent réel. Les bots enchérissent automatiquement.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-1.5 text-[11px] opacity-70">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <>
          {active.length === 0 ? (
            <p className="text-center text-muted py-12">
              Aucune enchère active. Mettez un item en vente depuis{' '}
              <Link to="/inventory" className="text-accent underline">
                l&apos;inventaire
              </Link>
              .
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {active.map((l) => (
                <li key={l.id}>
                  <AuctionCard
                    listing={l}
                    onBid={onBid}
                    onBuyout={onBuyout}
                    onCancel={onCancel}
                    onInspect={onInspect}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'mine' && (
        <>
          {mine.length === 0 ? (
            <p className="text-center text-muted py-12">
              Vous n&apos;avez pas encore mis d&apos;item en vente.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mine.map((l) => (
                <li key={l.id}>
                  <AuctionCard
                    listing={l}
                    onCancel={onCancel}
                    onInspect={onInspect}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'sold' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-muted">Item :</label>
            <select
              value={selectedItem ?? ''}
              onChange={(e) =>
                setSelectedItem(e.target.value || null)
              }
              className="rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-sm max-w-full"
            >
              <option value="">— Choisir un item —</option>
              {itemNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <SalesChart
              title={`Courbe des prix — ${selectedItem}`}
              points={chartPoints}
            />
          )}

          <div>
            <h2 className="text-lg font-semibold mb-3">Ventes récentes</h2>
            {sales.length === 0 ? (
              <p className="text-sm text-muted">
                Aucune vente enregistrée pour l&apos;instant. Laissez les bots
                enchérir ou vendez vos propres items.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {sales.slice(0, 40).map((s) => {
                  const listing = listings.find((l) => l.id === s.listingId)
                  return (
                    <li key={`${s.listingId}-${s.soldAt}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedItem(s.itemName)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-panel-2 transition"
                      >
                        {listing && (
                          <img
                            src={listing.skin.item.image}
                            alt=""
                            className="h-10 w-10 object-contain bg-[#0a0d12] rounded"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {s.itemName}
                          </p>
                          <p className="text-[11px] text-muted">
                            {s.rarity} ·{' '}
                            {new Date(s.soldAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-accent shrink-0">
                          {formatSim(s.soldPrice)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
