import { Link, useParams } from 'react-router-dom'
import type { AuctionListing } from '../types'
import { displayName, rarityColor } from '../lib/odds'
import { formatSim } from '../lib/pricing'
import { Countdown } from '../components/market/Countdown'
import { SalesChart } from '../components/market/SalesChart'

interface Props {
  getById: (id: string) => AuctionListing | undefined
  onBid: (listing: AuctionListing) => void
  onBuyout: (listing: AuctionListing) => void
  onCancel: (listing: AuctionListing) => void
}

export function MarketListingPage({
  getById,
  onBid,
  onBuyout,
  onCancel,
}: Props) {
  const { listingId } = useParams()
  const listing = listingId ? getById(listingId) : undefined

  if (!listing) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted">Enchère introuvable.</p>
        <Link to="/market" className="text-accent underline text-sm">
          Retour au marché
        </Link>
      </div>
    )
  }

  const { skin } = listing
  const color = rarityColor(skin)
  const isYours = listing.seller === 'you'
  const bidPoints = [
    { at: listing.createdAt, value: listing.startPrice },
    ...listing.bids.map((b) => ({ at: b.at, value: b.amount })),
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/market" className="text-sm text-muted hover:text-accent">
        ← Marché
      </Link>

      <div className="grid sm:grid-cols-2 gap-6">
        <div
          className="rounded-xl border bg-panel p-4 flex items-center justify-center aspect-square"
          style={{ borderColor: `${color}88` }}
        >
          <img
            src={skin.item.image}
            alt={skin.item.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color }}>
            {skin.isRareSpecial ? '★ Rare Special' : skin.item.rarity.name}
            {skin.isStatTrak ? ' · StatTrak™' : ''}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold">{displayName(skin)}</h1>
          <p className="text-sm text-muted font-mono">
            {skin.hasWear && skin.float != null
              ? `${skin.wearLabel} (${skin.wear}) · float ${skin.float.toFixed(6)}`
              : 'Usure N/A'}
          </p>
          <p className="text-sm text-muted">
            Vendeur : {isYours ? 'Vous' : listing.seller}
          </p>

          <div className="rounded-lg border border-border bg-panel-2 p-3 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted">Enchère actuelle</span>
              <span className="text-lg font-bold text-accent">
                {formatSim(listing.currentBid)}
              </span>
            </div>
            {listing.buyoutPrice != null && listing.status === 'active' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Achat immédiat</span>
                <span>{formatSim(listing.buyoutPrice)}</span>
              </div>
            )}
            {listing.status === 'active' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Temps restant</span>
                <Countdown endsAt={listing.endsAt} />
              </div>
            )}
            {listing.status === 'sold' && (
              <p className="text-sm text-milspec">
                Vendu {formatSim(listing.soldPrice ?? listing.currentBid)}
                {listing.currentBidder
                  ? ` à ${listing.currentBidder === 'you' ? 'vous' : listing.currentBidder}`
                  : ''}
              </p>
            )}
            {listing.status === 'expired' && (
              <p className="text-sm text-muted">Enchère expirée sans offre.</p>
            )}
          </div>

          {listing.status === 'active' && !isYours && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onBid(listing)}
                className="rounded-lg bg-accent/90 text-bg font-semibold px-4 py-2 text-sm hover:bg-accent"
              >
                Enchérir
              </button>
              {listing.buyoutPrice != null && (
                <button
                  type="button"
                  onClick={() => onBuyout(listing)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-panel-2"
                >
                  Achat immédiat ({formatSim(listing.buyoutPrice)})
                </button>
              )}
            </div>
          )}
          {listing.status === 'active' && isYours && (
            <button
              type="button"
              onClick={() => onCancel(listing)}
              disabled={listing.bids.length > 0}
              className="rounded-lg border border-covert/50 text-covert px-4 py-2 text-sm disabled:opacity-40"
            >
              Annuler la vente
            </button>
          )}
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Historique des enchères</h2>
        {listing.bids.length === 0 ? (
          <p className="text-sm text-muted">Aucune enchère pour le moment.</p>
        ) : (
          <ul className="rounded-lg border border-border divide-y divide-border text-sm">
            {[...listing.bids].reverse().map((b, i) => (
              <li
                key={`${b.at}-${i}`}
                className="flex justify-between px-3 py-2"
              >
                <span>
                  {b.bidder === 'you' ? (
                    <span className="text-accent font-medium">Vous</span>
                  ) : (
                    b.bidder
                  )}
                </span>
                <span className="font-mono text-accent">
                  {formatSim(b.amount)}
                </span>
                <span className="text-muted text-xs">
                  {new Date(b.at).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bidPoints.length >= 1 && (
        <SalesChart
          title="Courbe des enchères (cette vente)"
          points={bidPoints}
          height={160}
        />
      )}
    </div>
  )
}
