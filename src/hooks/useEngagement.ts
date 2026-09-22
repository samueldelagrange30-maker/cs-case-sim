import { useCallback, useEffect, useState } from 'react'
import {
  applyAccentTheme,
  dismissCoach,
  dismissGoalPrompt,
  loadEngagement,
  markOpenedNames,
  saveEngagement,
  setLastCaseId,
  setLastDiscovered,
  toggleFavorite,
  toggleVitrine,
  addWishlist,
  removeWishlist,
  setAccentTheme,
  type AccentTheme,
  type EngagementState,
  type WishlistEntry,
} from '../lib/engagement'
import {
  clearActiveGoal,
  evaluateGoal,
  loadActiveGoal,
  saveActiveGoal,
  setActiveGoalFromTemplate,
  type ActiveGoal,
  type GoalProgress,
  type GoalTemplate,
} from '../lib/goals'
import type { CollectionAlbum } from '../lib/collections'
import type { OpenedSkin } from '../types'
import type { SimStats } from '../lib/stats'

export function useEngagement() {
  const [eng, setEng] = useState<EngagementState>(() => loadEngagement())
  const [goal, setGoal] = useState<ActiveGoal | null>(() => loadActiveGoal())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    applyAccentTheme(eng.accentTheme)
  }, [eng.accentTheme])

  const refresh = useCallback(() => {
    setEng(loadEngagement())
    setGoal(loadActiveGoal())
    setTick((t) => t + 1)
  }, [])

  const onCoachDismiss = useCallback(() => {
    setEng(dismissCoach())
  }, [])

  const onGoalPromptDismiss = useCallback(() => {
    setEng(dismissGoalPrompt())
  }, [])

  const recordOpen = useCallback(
    (skins: OpenedSkin[], caseId: string) => {
      const names = skins.map((s) => s.item.name)
      const { nouveaus, state } = markOpenedNames(names)
      setLastCaseId(caseId)
      if (skins[0]) {
        setLastDiscovered({
          name: skins[0].item.name,
          image: skins[0].item.image,
          rarityColor: skins[0].item.rarity?.color,
          caseId,
          at: Date.now(),
        })
      }
      setEng(loadEngagement())
      return { nouveaus, state }
    },
    [],
  )

  const favToggle = useCallback((uid: string) => {
    setEng(toggleFavorite(uid))
  }, [])

  const vitrineToggle = useCallback((uid: string) => {
    setEng(toggleVitrine(uid))
  }, [])

  const wishlistAdd = useCallback(
    (entry: Omit<WishlistEntry, 'id' | 'addedAt'>) => {
      setEng(addWishlist(entry))
    },
    [],
  )

  const wishlistRemove = useCallback((id: string) => {
    setEng(removeWishlist(id))
  }, [])

  const themeSet = useCallback((theme: AccentTheme) => {
    setEng(setAccentTheme(theme))
    applyAccentTheme(theme)
  }, [])

  const pickGoal = useCallback(
    (
      tpl: GoalTemplate,
      opts?: { album?: CollectionAlbum; wishlist?: WishlistEntry },
    ) => {
      const g = setActiveGoalFromTemplate(tpl, opts)
      setGoal(g)
      setEng(dismissGoalPrompt())
      return g
    },
    [],
  )

  const clearGoal = useCallback(() => {
    clearActiveGoal()
    setGoal(null)
  }, [])

  const markGoalCompleted = useCallback((g: ActiveGoal) => {
    const next = { ...g, completedAt: Date.now() }
    saveActiveGoal(next)
    setGoal(next)
  }, [])

  const getProgress = useCallback(
    (
      inventory: OpenedSkin[],
      albums: CollectionAlbum[],
      stats: SimStats,
    ): GoalProgress | null => {
      const g = loadActiveGoal()
      if (!g || g.completedAt) return g ? evaluateGoal({
        goal: g,
        inventory,
        albums,
        stats,
        vitrineCount: loadEngagement().vitrineUids.length,
        wishlist: loadEngagement().wishlist,
      }) : null
      return evaluateGoal({
        goal: g,
        inventory,
        albums,
        stats,
        vitrineCount: loadEngagement().vitrineUids.length,
        wishlist: loadEngagement().wishlist,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, eng, goal],
  )

  const patch = useCallback((p: Partial<EngagementState>) => {
    setEng(saveEngagement(p))
  }, [])

  return {
    eng,
    goal,
    refresh,
    onCoachDismiss,
    onGoalPromptDismiss,
    recordOpen,
    favToggle,
    vitrineToggle,
    wishlistAdd,
    wishlistRemove,
    themeSet,
    pickGoal,
    clearGoal,
    markGoalCompleted,
    getProgress,
    patch,
  }
}
