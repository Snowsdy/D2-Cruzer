import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { trackedInvoke } from "@/lib/tauri"
import {
  getCurrentUserMemberships,
  getProfile,
  resolveMembership,
  primaryMembership,
  Components,
} from "../api/profile"
import { useCharacterStore } from "@/store/character"
import { usePlatformStore } from "@/store/platform"
import type { UserMembershipData, UserInfoCard } from "bungie-api-ts/user"

const DEFAULT_COMPONENTS = [
  Components.Profiles,
  Components.ProfileInventories,
  Components.ProfileCurrencies,
  Components.ProfileProgression,
  Components.Characters,
  Components.CharacterEquipment,
  Components.CharacterInventories,
  Components.CharacterLoadouts,
  Components.CharacterActivities,
  Components.CharacterProgressions,
  Components.ItemInstances,
  Components.ItemStats,
]

export function useMemberships() {
  return useQuery({
    queryKey: ["memberships"],
    queryFn: getCurrentUserMemberships,
  })
}

/**
 * Detect which platform the user is most likely playing on, based on the
 * local Steam install (via Tauri command). Falls back to Bungie's cross-save
 * primary when nothing is detected.
 *
 * Priority order:
 *  1. Explicit user selection (platform store)
 *  2. Steam local playtime detected AND user has Steam Destiny membership
 *  3. Bungie cross-save primary (`primaryMembershipId`)
 *  4. First non-disabled membership
 */
async function detectActivePlatform(
  data: UserMembershipData
): Promise<UserInfoCard | null> {
  const ds = data.destinyMemberships ?? []
  if (ds.length === 0) return null

  // 2. Try Steam local detection.
  try {
    const steam = await trackedInvoke<{ total_minutes: number } | null>(
      "steam_destiny2_playtime"
    )
    if (steam && steam.total_minutes > 0) {
      // Steam membershipType = 3
      const steamMembership = ds.find((m) => m.membershipType === 3)
      if (steamMembership) return steamMembership
    }
  } catch {
    // Tauri not available or Steam not installed — ignore.
  }

  // 3+4. Fallback to Bungie's primary.
  return primaryMembership(data)
}

export function useProfile(components: number[] = DEFAULT_COMPONENTS) {
  const memberships = useMemberships()
  const selectedId = usePlatformStore((s) => s.selectedMembershipId)
  const setSelected = usePlatformStore((s) => s.setSelected)
  const membership = resolveMembership(memberships.data, selectedId)

  // On first login (or after logout): auto-detect the active platform based
  // on local Steam install. Persists the choice so every subsequent query
  // reads from the same membership.
  useEffect(() => {
    if (selectedId || !memberships.data) return
    let cancelled = false
    detectActivePlatform(memberships.data).then((m) => {
      if (!cancelled && m) setSelected(m.membershipId)
    })
    return () => {
      cancelled = true
    }
  }, [selectedId, memberships.data, setSelected])

  const profile = useQuery({
    queryKey: [
      "profile",
      membership?.membershipType,
      membership?.membershipId,
      components.join(","),
    ],
    queryFn: () =>
      getProfile(
        membership!.membershipType,
        membership!.membershipId,
        components
      ),
    enabled: !!membership,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const { activeCharacterId, setActiveCharacter } = useCharacterStore()

  // Keep activeCharacterId in sync: default to most-recently-played if unset/invalid.
  useEffect(() => {
    const chars = profile.data?.characters?.data
    if (!chars) return
    const ids = Object.keys(chars)
    if (ids.length === 0) return
    if (!activeCharacterId || !chars[activeCharacterId]) {
      const sorted = ids
        .map((id) => chars[id])
        .sort(
          (a, b) =>
            new Date(b.dateLastPlayed).getTime() -
            new Date(a.dateLastPlayed).getTime()
        )
      setActiveCharacter(sorted[0].characterId)
    }
  }, [profile.data, activeCharacterId, setActiveCharacter])

  return { memberships, membership, profile, activeCharacterId }
}

/**
 * Returns the currently-selected Destiny membership (respecting the
 * platform store's user choice, falling back to Bungie's primary when unset).
 */
export function useSelectedMembership() {
  const memberships = useMemberships()
  const selectedId = usePlatformStore((s) => s.selectedMembershipId)
  return resolveMembership(memberships.data, selectedId)
}
