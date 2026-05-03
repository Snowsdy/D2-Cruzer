import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useProfile } from "./useProfile"
import { useSelectedMembership } from "./useProfile"
import {
  getAggregateActivityStats,
  type AggregateActivity,
} from "@/api/activityStats"

export interface MergedActivityStats {
  activityHash: number
  completions: number
  fastestMs: number
  bestKills: number
  bestDeaths: number
}

/**
 * Aggregates activity completion stats across all the user's characters.
 */
export function useAggregateActivities() {
  const { profile } = useProfile()
  const membership = useSelectedMembership()
  const characterIds = profile.data?.characters?.data
    ? Object.keys(profile.data.characters.data)
    : []

  const queries = useQueries({
    queries: characterIds.map((cid) => ({
      queryKey: [
        "aggregateActivityStats",
        membership?.membershipType,
        membership?.membershipId,
        cid,
      ],
      queryFn: () =>
        getAggregateActivityStats(
          membership!.membershipType,
          membership!.membershipId,
          cid
        ),
      enabled: !!membership,
      staleTime: 15_000,
      refetchInterval: 30_000,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const error = queries.find((q) => q.error)?.error ?? null

  const merged = useMemo(() => {
    const map = new Map<number, MergedActivityStats>()
    for (const q of queries) {
      const acts: AggregateActivity[] = q.data?.activities ?? []
      for (const a of acts) {
        const completions = a.values.activityCompletions?.basic.value ?? 0
        if (completions === 0) continue
        const fastestMs = a.values.fastestCompletionMs?.basic.value ?? 0
        const bestKills = a.values.activityBestSingleGameKills?.basic.value ?? 0
        const bestDeaths =
          a.values.activityBestSingleGameDeaths?.basic.value ?? 0

        const existing = map.get(a.activityHash)
        if (existing) {
          existing.completions += completions
          existing.fastestMs =
            existing.fastestMs > 0 && fastestMs > 0
              ? Math.min(existing.fastestMs, fastestMs)
              : Math.max(existing.fastestMs, fastestMs)
          existing.bestKills = Math.max(existing.bestKills, bestKills)
          existing.bestDeaths = Math.max(existing.bestDeaths, bestDeaths)
        } else {
          map.set(a.activityHash, {
            activityHash: a.activityHash,
            completions,
            fastestMs,
            bestKills,
            bestDeaths,
          })
        }
      }
    }
    return [...map.values()]
  }, [queries])

  return { merged, isLoading, error }
}
