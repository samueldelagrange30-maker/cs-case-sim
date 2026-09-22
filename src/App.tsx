import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { InspectModal } from './components/inspect/InspectModal'
import { CoachTips } from './components/engagement/CoachTips'
import { GoalPrompt } from './components/engagement/GoalPrompt'
import { useCases } from './hooks/useCases'
import { useInventory } from './hooks/useInventory'
import { useMarket } from './hooks/useMarket'
import { useStats } from './hooks/useStats'
import { useCharges } from './hooks/useCharges'
import { useWallet } from './hooks/useWallet'
import { useAuth } from './hooks/useAuth'
import { useEngagement } from './hooks/useEngagement'
import {
  countCompletedAlbums,
  evaluateChallenges,
} from './lib/challenges'
import {
  loadCollections,
  loadSkinCollectionsMap,
  type CollectionAlbum,
} from './lib/collections'
import { normalizeSkinName } from './lib/normalizeName'
import { CasePage } from './pages/CasePage'
import { CollectionPage } from './pages/CollectionPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { InventoryPage } from './pages/InventoryPage'
import { MarketListingPage } from './pages/MarketListingPage'
import { MarketPage } from './pages/MarketPage'
import { TradeUpPage } from './pages/TradeUpPage'
import type { AuctionListing, OpenedSkin } from './types'
import { formatSim } from './lib/pricing'
import { applyAccentTheme } from './lib/engagement'

export default function App() {
  const { cases, loading, error } = useCases()
  const { items, addItems, clear, count, removeFromInventory, removeMany } =
    useInventory()
  const { balance, credit, debit } = useWallet()
  const {
    charges,
    maxCharges,
    nextLabel,
    tryConsume: tryConsumeCharges,
  } = useCharges()
  const {
    stats,
    completedBadges,
    incrementOpens,
    incrementTradeUps,
    incrementMarketSold,
    markBadgesCompleted,
  } = useStats()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, ready: authReady, isLoggedIn, register, login, logout } =
    useAuth()
  const engagement = useEngagement()

  const isPublic =
    location.pathname === '/' || location.pathname.startsWith('/auth')
  const inApp = !isPublic

  const [albums, setAlbums] = useState<CollectionAlbum[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const skinMapRef = useRef<Record<string, string[]> | null>(null)

  const [showGoalPrompt, setShowGoalPrompt] = useState(false)
  const firstOpenPendingRef = useRef(false)

  useEffect(() => {
    applyAccentTheme(engagement.eng.accentTheme)
  }, [engagement.eng.accentTheme])

  // Seed seenNames from existing inventory (returning guests / pre-engagement data)
  useEffect(() => {
    if (items.length === 0) return
    if (engagement.eng.seenNames.length > 0) return
    const names = [
      ...new Set(items.map((i) => normalizeSkinName(i.item.name))),
    ]
    engagement.patch({ seenNames: names })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

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
    (skins: OpenedSkin[], caseId?: string) => {
      const enriched = enrichSkins(skins)
      const wasEmpty = stats.opensCount === 0
      addItems(enriched)
      incrementOpens(enriched.length)
      if (caseId) {
        engagement.recordOpen(enriched, caseId)
      } else if (enriched[0]?.caseId) {
        engagement.recordOpen(enriched, enriched[0].caseId)
      } else {
        engagement.recordOpen(enriched, '')
      }
      if (wasEmpty && !engagement.eng.goalPromptDone) {
        firstOpenPendingRef.current = true
        setShowGoalPrompt(true)
      }
    },
    [
      addItems,
      enrichSkins,
      incrementOpens,
      engagement,
      stats.opensCount,
    ],
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

  // Goal completion celebration (cosmetic toast only)
  useEffect(() => {
    if (!engagement.goal || engagement.goal.completedAt) return
    const prog = engagement.getProgress(items, albums, stats)
    if (prog?.completed) {
      engagement.markGoalCompleted(engagement.goal)
      showFlash(`Objectif atteint : ${engagement.goal.title} 🎉`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, albums, stats, engagement.goal, engagement.eng.vitrineUids, showFlash])

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

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  /** Nouveau if name not yet in seenNames (updated on commit). */
  const isNewDiscovery = useCallback(
    (name: string) => {
      const key = normalizeSkinName(name)
      return !engagement.eng.seenNames.includes(key)
    },
    [engagement.eng.seenNames],
  )

  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted text-sm">
        <div className="h-9 w-9 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        Chargement…
      </div>
    )
  }

  const casesRoute = loading ? (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-9 w-9 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      <p className="text-muted text-sm">Chargement des caisses &amp; capsules…</p>
    </div>
  ) : error ? (
    <div className="surface p-8 text-center max-w-md mx-auto space-y-2">
      <p className="text-covert font-semibold">Impossible de charger les données</p>
      <p className="body-muted text-sm">{error}</p>
    </div>
  ) : (
    <HomePage
      cases={cases}
      inventory={items}
      albums={albums}
      stats={stats}
      engagement={engagement}
    />
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        inventoryCount={count}
        walletBalance={balance}
        charges={charges}
        maxCharges={maxCharges}
        nextChargeLabel={nextLabel}
        user={user}
        onLogout={handleLogout}
        compact={isPublic}
        accentTheme={engagement.eng.accentTheme}
        onAccentTheme={engagement.themeSet}
        guest={!isLoggedIn}
      />
      {flash && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] rounded-lg border border-accent/40 bg-panel px-4 py-3 text-sm text-center shadow-lg shadow-black/40" role="status">
          {flash}
        </div>
      )}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Routes>
          <Route
            path="/"
            element={<LandingPage isLoggedIn={isLoggedIn} />}
          />
          <Route
            path="/auth"
            element={
              isLoggedIn ? (
                <Navigate to="/caisses" replace />
              ) : (
                <AuthPage onRegister={register} onLogin={login} />
              )
            }
          />
          <Route path="/caisses" element={casesRoute} />
          <Route
            path="/case/:id"
            element={
              <CasePage
                onOpened={handleOpened}
                sales={market.sales}
                charges={charges}
                tryConsume={tryConsumeCharges}
                isNewDiscovery={isNewDiscovery}
              />
            }
          />
          <Route
            path="/collection"
            element={
              <CollectionPage
                inventory={items}
                stats={stats}
                completedBadges={completedBadges}
                engagement={engagement}
                albums={albums}
                albumsLoading={albumsLoading}
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
                engagement={engagement}
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
          <Route
            path="*"
            element={<Navigate to="/caisses" replace />}
          />
        </Routes>
      </main>
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted px-4">
        Données skins : ByMykel CSGO-API · Skin Csgo — Simulateur de caisses
        &amp; capsules · Marché $SIM simulé · Progression locale (cet appareil)
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
              className="input-field"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBidTarget(null)}
                className="btn btn-ghost flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmBid}
                className="btn btn-primary flex-1"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {inApp && !engagement.eng.coachDone && (
        <CoachTips onDismiss={engagement.onCoachDismiss} />
      )}

      {inApp &&
        showGoalPrompt &&
        !engagement.eng.goalPromptDone &&
        firstOpenPendingRef.current && (
          <GoalPrompt
            albums={albums}
            wishlist={engagement.eng.wishlist}
            onPick={(tpl, opts) => {
              engagement.pickGoal(tpl, opts)
              setShowGoalPrompt(false)
              firstOpenPendingRef.current = false
              showFlash(`Objectif : ${tpl.title}`)
            }}
            onDismiss={() => {
              engagement.onGoalPromptDismiss()
              setShowGoalPrompt(false)
              firstOpenPendingRef.current = false
            }}
          />
        )}
    </div>
  )
}
