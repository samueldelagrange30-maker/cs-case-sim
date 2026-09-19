import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuctionListing, OpenedSkin } from '../types'
import {
  applyBid,
  applyBuyout,
  cancelListing,
  createUserListing,
  finalizeExpired,
  loadMarket,
  saveMarket,
  salesFromListings,
  tickBotBids,
} from '../lib/market'

function withSettled(listing: AuctionListing): AuctionListing {
  return { ...listing, settled: true }
}

export function useMarket(opts: {
  onSoldToYou?: (listing: AuctionListing) => void
  onUserListingSold?: (listing: AuctionListing) => void
  onExpiredReturn?: (skin: OpenedSkin) => void
  onCancelReturn?: (skin: OpenedSkin) => void
  creditWallet?: (amount: number) => void
  tryDebitWallet?: (amount: number) => boolean
}) {
  const [listings, setListings] = useState<AuctionListing[]>([])
  const [ready, setReady] = useState(false)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const listingsRef = useRef(listings)
  listingsRef.current = listings

  const settleTransitions = useCallback(
    (prev: AuctionListing[], next: AuctionListing[]): AuctionListing[] => {
      const o = optsRef.current
      return next.map((listing) => {
        const before = prev.find((l) => l.id === listing.id) ?? listing
        if (listing.settled) return listing

        if (
          before.status === 'active' &&
          listing.status === 'active' &&
          before.currentBidder === 'you' &&
          listing.currentBidder !== 'you' &&
          before.currentBid > 0
        ) {
          o.creditWallet?.(before.currentBid)
        }

        if (before.status === 'active' && listing.status === 'sold') {
          if (listing.seller === 'you' && listing.soldPrice != null) {
            o.creditWallet?.(listing.soldPrice)
            o.onUserListingSold?.(listing)
          }
          if (listing.currentBidder === 'you' && listing.seller !== 'you') {
            o.onSoldToYou?.(listing)
          }
          if (
            before.currentBidder === 'you' &&
            listing.currentBidder !== 'you'
          ) {
            o.creditWallet?.(before.currentBid)
          }
          return withSettled(listing)
        }

        if (before.status === 'active' && listing.status === 'expired') {
          if (listing.seller === 'you') {
            o.onExpiredReturn?.(listing.skin)
          }
          if (before.currentBidder === 'you') {
            o.creditWallet?.(before.currentBid)
          }
          return withSettled(listing)
        }

        if (before.status === 'active' && listing.status === 'cancelled') {
          return withSettled(listing)
        }

        return listing
      })
    },
    [],
  )

  useEffect(() => {
    const state = loadMarket()
    const prev = state.listings
    let next = prev.map((l) => finalizeExpired(l))
    next = settleTransitions(prev, next)
    saveMarket({ listings: next })
    setListings(next)
    setReady(true)
  }, [settleTransitions])

  useEffect(() => {
    if (!ready) return
    const tick = () => {
      setListings((prev) => {
        const now = Date.now()
        let next = tickBotBids(prev, now)
        next = next.map((l) => finalizeExpired(l, now))
        next = settleTransitions(prev, next)
        saveMarket({ listings: next })
        return next
      })
    }
    const id = window.setInterval(tick, 1000)
    const onFocus = () => tick()
    window.addEventListener('focus', onFocus)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ready, settleTransitions])

  const listItem = useCallback(
    (
      skin: OpenedSkin,
      startPrice: number,
      buyoutPrice: number | undefined,
      durationMinutes: number,
    ) => {
      const listing = createUserListing(
        skin,
        startPrice,
        buyoutPrice,
        durationMinutes,
      )
      setListings((prev) => {
        const next = [listing, ...prev]
        saveMarket({ listings: next })
        return next
      })
      return listing
    },
    [],
  )

  const placeBid = useCallback(
    (listingId: string, amount: number): { ok: boolean; error?: string } => {
      const o = optsRef.current
      const listing = listingsRef.current.find((l) => l.id === listingId)
      if (!listing || listing.status !== 'active') {
        return { ok: false, error: 'Enchère indisponible.' }
      }
      if (listing.seller === 'you') {
        return { ok: false, error: 'Vous ne pouvez pas enchérir sur votre vente.' }
      }
      const min =
        listing.currentBidder == null
          ? listing.startPrice
          : Math.ceil(listing.currentBid * 1.05)
      if (amount < min) {
        return { ok: false, error: `Mise minimum : ${min} $SIM` }
      }

      const already = listing.currentBidder === 'you' ? listing.currentBid : 0
      const need = amount - already
      if (need > 0 && !o.tryDebitWallet?.(need)) {
        return { ok: false, error: 'Solde $SIM insuffisant.' }
      }

      const updated = applyBid(listing, amount, 'you')
      if (!updated) {
        if (need > 0) o.creditWallet?.(need)
        return { ok: false, error: 'Enchère refusée.' }
      }

      setListings((prev) => {
        const cur = prev.find((l) => l.id === listingId)
        if (!cur || cur.status !== 'active') {
          if (need > 0) o.creditWallet?.(need)
          return prev
        }
        const applied = applyBid(cur, amount, 'you')
        if (!applied) {
          if (need > 0) o.creditWallet?.(need)
          return prev
        }
        let next = prev.map((l) => (l.id === listingId ? applied : l))
        next = settleTransitions(prev, next)
        saveMarket({ listings: next })
        return next
      })
      return { ok: true }
    },
    [settleTransitions],
  )

  const buyout = useCallback(
    (listingId: string): { ok: boolean; error?: string } => {
      const o = optsRef.current
      const listing = listingsRef.current.find((l) => l.id === listingId)
      if (!listing || listing.status !== 'active' || !listing.buyoutPrice) {
        return { ok: false, error: 'Achat immédiat indisponible.' }
      }
      if (listing.seller === 'you') {
        return { ok: false, error: 'C’est votre propre vente.' }
      }
      const price = listing.buyoutPrice
      const already = listing.currentBidder === 'you' ? listing.currentBid : 0
      const need = price - already
      if (need > 0 && !o.tryDebitWallet?.(need)) {
        return { ok: false, error: 'Solde $SIM insuffisant.' }
      }

      setListings((prev) => {
        const cur = prev.find((l) => l.id === listingId)
        if (!cur || !cur.buyoutPrice || cur.status !== 'active') {
          if (need > 0) o.creditWallet?.(need)
          return prev
        }
        const updated = applyBuyout(cur, 'you', cur.buyoutPrice)
        let next = prev.map((l) => (l.id === listingId ? updated : l))
        next = settleTransitions(prev, next)
        saveMarket({ listings: next })
        return next
      })
      return { ok: true }
    },
    [settleTransitions],
  )

  const cancel = useCallback(
    (listingId: string): { ok: boolean; error?: string } => {
      const listing = listingsRef.current.find((l) => l.id === listingId)
      if (!listing || listing.status !== 'active') {
        return { ok: false, error: 'Impossible d’annuler.' }
      }
      if (listing.seller !== 'you') {
        return { ok: false, error: 'Pas votre vente.' }
      }
      if (listing.bids.length > 0) {
        return {
          ok: false,
          error: 'Des enchères sont déjà placées — annulation impossible.',
        }
      }

      setListings((prev) => {
        const cur = prev.find((l) => l.id === listingId)
        if (!cur || cur.status !== 'active' || cur.bids.length > 0) return prev
        const updated = cancelListing(cur)
        let next = prev.map((l) => (l.id === listingId ? updated : l))
        optsRef.current.onCancelReturn?.(cur.skin)
        next = settleTransitions(prev, next)
        saveMarket({ listings: next })
        return next
      })
      return { ok: true }
    },
    [settleTransitions],
  )

  const sales = salesFromListings(listings)
  const active = listings.filter((l) => l.status === 'active')
  const mine = listings.filter((l) => l.seller === 'you')

  return {
    listings,
    active,
    mine,
    sales,
    ready,
    listItem,
    placeBid,
    buyout,
    cancel,
    getById: (id: string) => listings.find((l) => l.id === id),
  }
}
