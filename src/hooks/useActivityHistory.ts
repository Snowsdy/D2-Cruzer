import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useProfile } from "./useProfile"
import { useSelectedMembership } from "./useProfile"
import { getActivityHistory } from "@/api/activityStats"

export interface PerActivityComputed {
  /** flawless count = completions with 0 deaths */
  flawless: number
  /** number of times you completed it (any size) */
  completions: number
  /** fastest completion in ms */
  fastestMs: number
  /** highest single-game kills across runs */
  bestKills: number
}

/**
 * Fetches activity history per character for a given mode and computes
 * per-activity-hash advanced tags (flawless, etc.) by inspecting each completion.
 */
export function useActivityHistory(mode: number) {
  const { profile } = useProfile()
  const membership = useSelectedMembership()
  const characterIds = profile.data?.characters?.data
    ? Object.keys(profile.data.characters.data)
    : []

  const queries = useQueries({
    queries: characterIds.map((cid) => ({
      queryKey: [
        "activityHistory",
        membership?.membershipType,
        membership?.membershipId,
        cid,
        mode,
      ],
      queryFn: () =>
        getActivityHistory(
          membership!.membershipType,
          membership!.membershipId,
          cid,
          mode
        ),
      enabled: !!membership,
      staleTime: 30_000,
      refetchInterval: 45_000,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)

  const byActivityHash = useMemo(() => {
    const map = new Map<number, PerActivityComputed>()
    for (const q of queries) {
      const activities = q.data?.activities ?? []
      for (const a of activities) {
        const completed = (a.values.completed?.basic.value ?? 0) === 1
        if (!completed) continue
        const deaths = a.values.deaths?.basic.value ?? 0
        const kills = a.values.kills?.basic.value ?? 0
        const ms = a.values.activityDurationSeconds?.basic.value ?? 0
        const durationMs = ms * 1000

        const hash = a.activityDetails.referenceId
        const existing = map.get(hash) ?? {
          flawless: 0,
          completions: 0,
          fastestMs: 0,
          bestKills: 0,
        }
        existing.completions += 1
        if (deaths === 0) existing.flawless += 1
        if (
          durationMs > 0 &&
          (existing.fastestMs === 0 || durationMs < existing.fastestMs)
        ) {
          existing.fastestMs = durationMs
        }
        if (kills > existing.bestKills) existing.bestKills = kills
        map.set(hash, existing)
      }
    }
    return map
  }, [queries])

  return { byActivityHash, isLoading }
}
