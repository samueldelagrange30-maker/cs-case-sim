import { Link } from 'react-router-dom'
import type { AuctionListing, OpenedSkin } from '../../types'
import { displayName, rarityColor } from '../../lib/odds'
import { formatSim } from '../../lib/pricing'
import { getStickers } from '../../lib/stickers'
import { Countdown } from './Countdown'

interface Props {
  listing: AuctionListing
  onBid?: (listing: AuctionListing) => void
  onBuyout?: (listing: AuctionListing) => void
  onCancel?: (listing: AuctionListing) => void
  onInspect?: (skin: OpenedSkin) => void
  compact?: boolean
}

export function AuctionCard({
  listing,
  onBid,
  onBuyout,
  onCancel,
  onInspect,
  compact,
}: Props) {
  const { skin } = listing
  const color = rarityColor(skin)
  const stickers = getStickers(skin)
  const isYours = listing.seller === 'you'
  const bidderLabel =
    listing.currentBidder == null
      ? 'Aucune enchère'
      : listing.currentBidder === 'you'
        ? 'Vous'
        : listing.currentBidder

  return (
    <article
      className="rounded-lg border bg-panel overflow-hidden flex flex-col"
      style={{
        borderColor: `${color}66`,
        boxShadow: `inset 0 -2px 0 ${color}`,
      }}
    >
      <div className="relative aspect-square flex items-center justify-center bg-[#0a0d12] p-2">
        <Link to={`/market/${listing.id}`} className="absolute inset-0 z-0" />
        <button
          type="button"
          className="relative z-10 h-full w-full flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onInspect?.(skin)
          }}
          title="Inspecter en 3D"
        >
          <img
            src={skin.item.image}
            alt={skin.item.name}
            className="max-h-full max-w-full object-contain pointer-events-none"
            loading="lazy"
          />
        </button>
        {stickers.length > 0 && (
          <span className="absolute bottom-1 right-1 z-10 flex -space-x-1 pointer-events-none">
            {stickers.slice(0, 5).map((s) => (
              <img
                key={`${s.uid}-${s.slot}`}
                src={s.item.image}
                alt=""
                className="h-5 w-5 rounded-full border border-border bg-panel object-contain"
              />
            ))}
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <p className="text-[10px] font-semibold" style={{ color }}>
          {skin.isRareSpecial ? '★ Rare' : skin.item.rarity.name}
          {skin.isStatTrak ? ' · ST' : ''}
          {stickers.length > 0 ? ` · ${stickers.length} stk` : ''}
        </p>
        <Link
          to={`/market/${listing.id}`}
          className="text-xs font-medium line-clamp-2 leading-snug hover:text-accent"
        >
          {displayName(skin)}
        </Link>
        {onInspect && (
          <button
            type="button"
            onClick={() => onInspect(skin)}
            className="text-[10px] text-accent text-left hover:underline"
          >
            Inspecter 3D
          </button>
        )}
        <p className="text-[10px] text-muted">
          Vendeur : {isYours ? 'Vous' : listing.seller}
        </p>
        <div className="flex items-baseline justify-between gap-2 mt-auto pt-1">
          <div>
            <p className="text-[10px] text-muted">Enchère actuelle</p>
            <p className="text-sm font-bold text-accent">
              {formatSim(listing.currentBid)}
            </p>
          </div>
          {listing.status === 'active' && (
            <div className="text-right">
              <p className="text-[10px] text-muted">Temps restant</p>
              <Countdown endsAt={listing.endsAt} />
            </div>
          )}
          {listing.status === 'sold' && (
            <p className="text-[10px] text-milspec font-medium">
              Vendu {formatSim(listing.soldPrice ?? listing.currentBid)}
            </p>
          )}
          {listing.status === 'expired' && (
            <p className="text-[10px] text-muted">Expiré</p>
          )}
          {listing.status === 'cancelled' && (
            <p className="text-[10px] text-muted">Annulé</p>
          )}
        </div>
        {!compact && listing.status === 'active' && (
          <p className="text-[10px] text-muted truncate">
            Meilleure offre : {bidderLabel}
            {listing.bids.length > 0 ? ` · ${listing.bids.length} enchère(s)` : ''}
          </p>
        )}
        {listing.status === 'active' && !isYours && (
          <div className="flex gap-1.5 pt-1">
            {onBid && (
              <button
                type="button"
                onClick={() => onBid(listing)}
                className="flex-1 rounded-md bg-accent/20 text-accent text-xs font-semibold py-1.5 hover:bg-accent/30"
              >
                Enchérir
              </button>
            )}
            {onBuyout && listing.buyoutPrice != null && (
              <button
                type="button"
                onClick={() => onBuyout(listing)}
                className="flex-1 rounded-md border border-border text-xs py-1.5 text-muted hover:text-text"
                title={formatSim(listing.buyoutPrice)}
              >
                Achat {listing.buyoutPrice}
              </button>
            )}
          </div>
        )}
        {listing.status === 'active' && isYours && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(listing)}
            disabled={listing.bids.length > 0}
            className="w-full rounded-md border border-covert/40 text-covert text-xs py-1.5 disabled:opacity-40"
          >
            Annuler la vente
          </button>
        )}
      </div>
    </article>
  )
}
