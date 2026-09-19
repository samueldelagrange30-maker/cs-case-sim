import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { InspectModal } from './components/inspect/InspectModal'
import { useCases } from './hooks/useCases'
import { useInventory } from './hooks/useInventory'
import { useMarket } from './hooks/useMarket'
import { useStats } from './hooks/useStats'
import { useWallet } from './hooks/useWallet'
import {
  countCompletedAlbums,
  evaluateChallenges,
} from './lib/challenges'
import {
  loadCollections,
  loadSkinCollectionsMap,
  type CollectionAlbum,
} from './lib/collections'
import { CasePage } from './pages/CasePage'
import { CollectionPage } from './pages/CollectionPage'
import { HomePage } from './pages/HomePage'
import { InventoryPage } from './pages/InventoryPage'
import { MarketListingPage } from './pages/MarketListingPage'
import { MarketPage } from './pages/MarketPage'
import { TradeUpPage } from './pages/TradeUpPage'
import type { AuctionListing, OpenedSkin } from './types'
import { formatSim } from './lib/pricing'

export default function App() {
  const { cases, loading, error } = useCases()
  const { items, addItems, clear, count, removeFromInventory, removeMany } =
    useInventory()
  const { balance, credit, debit } = useWallet()
  const {
    stats,
    completedBadges,
    incrementOpens,
    incrementTradeUps,
    incrementMarketSold,
    markBadgesCompleted,
  } = useStats()
  const navigate = useNavigate()

  const [albums, setAlbums] = useState<CollectionAlbum[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const skinMapRef = useRef<Record<string, string[]> | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadCollections(), loadSkinCollectionsMap()])
      .then(([cols, map]) => {
        if (cancelled) return
        setAlbums(cols)
        skinMapRef.current = map
        setAlbumsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setAlbumsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const enrichSkins = useCallback((skins: OpenedSkin[]): OpenedSkin[] => {
    const map = skinMapRef.current
    if (!map) return skins
    return skins.map((s) => {
      if (s.collections && s.collections.length > 0) return s
      const cols = map[s.item.name]
      return cols ? { ...s, collections: cols } : s
    })
  }, [])

  const handleOpened = useCallback(
    (skins: OpenedSkin[]) => {
      const enriched = enrichSkins(skins)
      addItems(enriched)
      incrementOpens(enriched.length)
    },
    [addItems, enrichSkins, incrementOpens],
  )

  const market = useMarket({
    creditWallet: credit,
    tryDebitWallet: debit,
    onSoldToYou: (listing) => {
      addItems(enrichSkins([listing.skin]))
    },
    onUserListingSold: () => {
      incrementMarketSold(1)
    },
    onExpiredReturn: (skin) => {
      addItems([skin])
    },
    onCancelReturn: (skin) => {
      addItems([skin])
    },
  })

  const [bidTarget, setBidTarget] = useState<AuctionListing | null>(null)
  const [bidAmount, setBidAmount] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const [marketInspect, setMarketInspect] = useState<OpenedSkin | null>(null)

  const showFlash = useCallback((msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3200)
  }, [])

  const handleBadgesUnlocked = useCallback(
    (ids: string[], titles: string[]) => {
      markBadgesCompleted(ids)
      if (titles.length === 1) {
        showFlash(`Badge débloqué : ${titles[0]}`)
      } else if (titles.length > 1) {
        showFlash(`Badges débloqués : ${titles.join(', ')}`)
      }
    },
    [markBadgesCompleted, showFlash],
  )

  // Global badge check (opens, inventory, trade-ups, market, albums)
  useEffect(() => {
    if (albumsLoading) return
    const albumsCompleted = countCompletedAlbums(albums, items)
    const rows = evaluateChallenges({
      stats,
      inventory: items,
      albumsCompleted,
    })
    const newly = rows.filter(
      (r) => r.completed && !completedBadges.includes(r.def.id),
    )
    if (newly.length === 0) return
    handleBadgesUnlocked(
      newly.map((r) => r.def.id),
      newly.map((r) => r.def.title),
    )
  }, [
    albums,
    albumsLoading,
    items,
    stats,
    completedBadges,
    handleBadgesUnlocked,
  ])

  const handleListForSale = useCallback(
    (
      skin: OpenedSkin,
      opts: {
        startPrice: number
        buyoutPrice?: number
        durationMinutes: number
      },
    ) => {
      const removed = removeFromInventory(skin.uid)
      if (!removed) {
        showFlash('Item introuvable dans l’inventaire.')
        return
      }
      market.listItem(
        removed,
        opts.startPrice,
        opts.buyoutPrice,
        opts.durationMinutes,
      )
      showFlash('Item mis en vente sur le marché simulé.')
      navigate('/market')
    },
    [removeFromInventory, market, navigate, showFlash],
  )

  const handleTradeUp = useCallback(
    (inputs: OpenedSkin[], result: OpenedSkin) => {
      const removed = removeMany(inputs.map((s) => s.uid))
      if (removed.length !== 10) {
        showFlash('Impossible de consommer les 10 skins.')
        // put back if partial
        if (removed.length > 0) addItems(removed)
        return
      }
      const enriched = enrichSkins([result])
      addItems(enriched)
      incrementTradeUps(1)
      showFlash('Trade-up réussi — résultat ajouté à l’inventaire.')
    },
    [removeMany, addItems, enrichSkins, incrementTradeUps, showFlash],
  )

  const openBidModal = (listing: AuctionListing) => {
    const min =
      listing.currentBidder == null
        ? listing.startPrice
        : Math.ceil(listing.currentBid * 1.1)
    setBidAmount(min)
    setBidTarget(listing)
  }

  const confirmBid = () => {
    if (!bidTarget) return
    const res = market.placeBid(bidTarget.id, bidAmount)
    if (!res.ok) {
      showFlash(res.error ?? 'Enchère refusée.')
    } else {
      showFlash(`Enchère placée : ${formatSim(bidAmount)}`)
    }
    setBidTarget(null)
  }

  const handleBuyout = (listing: AuctionListing) => {
    if (
      !listing.buyoutPrice ||
      !confirm(
        `Achat immédiat pour ${formatSim(listing.buyoutPrice)} ? (simulé)`,
      )
    ) {
      return
    }
    const res = market.buyout(listing.id)
    if (!res.ok) showFlash(res.error ?? 'Achat refusé.')
    else showFlash(`Achat immédiat réussi — ${formatSim(listing.buyoutPrice)}`)
  }

  const handleCancel = (listing: AuctionListing) => {
    if (!confirm('Annuler cette vente et récupérer l’item ?')) return
    const res = market.cancel(listing.id)
    if (!res.ok) showFlash(res.error ?? 'Annulation impossible.')
    else showFlash('Vente annulée — item rendu à l’inventaire.')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header inventoryCount={count} walletBalance={balance} />
      {flash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] rounded-lg border border-accent/40 bg-panel px-4 py-2.5 text-sm text-center shadow-lg">
          {flash}
        </div>
      )}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {loading && (
          <p className="text-center text-muted py-20">
            Chargement des caisses &amp; capsules…
          </p>
        )}
        {error && (
          <p className="text-center text-covert py-20">
            Impossible de charger les données : {error}
          </p>
        )}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={<HomePage cases={cases} />} />
            <Route
              path="/case/:id"
              element={
                <CasePage onOpened={handleOpened} sales={market.sales} />
              }
            />
            <Route
              path="/collection"
              element={
                <CollectionPage
                  inventory={items}
                  stats={stats}
                  completedBadges={completedBadges}
                />
              }
            />
            <Route
              path="/tradeup"
              element={
                <TradeUpPage
                  inventory={items}
                  albums={albums}
                  albumsLoading={albumsLoading}
                  onTradeUp={handleTradeUp}
                />
              }
            />
            <Route
              path="/inventory"
              element={
                <InventoryPage
                  items={items}
                  sales={market.sales}
                  onClear={clear}
                  onListForSale={handleListForSale}
                />
              }
            />
            <Route
              path="/market"
              element={
                <MarketPage
                  active={market.active}
                  mine={market.mine}
                  sales={market.sales}
                  listings={market.listings}
                  onBid={openBidModal}
                  onBuyout={handleBuyout}
                  onCancel={handleCancel}
                  onInspect={setMarketInspect}
                />
              }
            />
            <Route
              path="/market/:listingId"
              element={
                <MarketListingPage
                  getById={market.getById}
                  sales={market.sales}
                  onBid={openBidModal}
                  onBuyout={handleBuyout}
                  onCancel={handleCancel}
                  onInspect={setMarketInspect}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted px-4">
        Données skins : ByMykel CSGO-API · Skin Csgo — Simulateur de caisses
        &amp; capsules · Marché $SIM simulé
      </footer>

      {marketInspect && (
        <InspectModal
          skin={marketInspect}
          onClose={() => setMarketInspect(null)}
          sales={market.sales}
        />
      )}

      {bidTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3"
          onClick={() => setBidTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold">Enchérir</h2>
            <p className="text-xs text-muted line-clamp-2">
              {bidTarget.skin.item.name}
            </p>
            <p className="text-xs text-muted">
              Actuel : {formatSim(bidTarget.currentBid)} · Solde :{' '}
              {formatSim(balance)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs"
                onClick={() =>
                  setBidAmount(Math.ceil(bidTarget.currentBid * 1.1))
                }
              >
                +10%
              </button>
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs"
                onClick={() =>
                  setBidAmount(Math.ceil(bidTarget.currentBid * 1.25))
                }
              >
                +25%
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={bidAmount}
              onChange={(e) =>
                setBidAmount(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBidTarget(null)}
                className="flex-1 rounded-lg border border-border py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmBid}
                className="flex-1 rounded-lg bg-accent/90 text-bg font-semibold py-2 text-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
