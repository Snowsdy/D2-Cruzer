import { bungieGet } from "./bungie"
import type { DestinyProfileResponse } from "bungie-api-ts/destiny2"
import type { UserMembershipData, UserInfoCard } from "bungie-api-ts/user"

// Component codes — https://bungie-net.github.io/multi/schema_Destiny-DestinyComponentType.html
export const Components = {
  Profiles: 100,
  ProfileInventories: 102,
  ProfileCurrencies: 103,
  ProfileProgression: 104,
  Characters: 200,
  CharacterInventories: 201,
  CharacterProgressions: 202,
  CharacterActivities: 204,
  CharacterEquipment: 205,
  CharacterLoadouts: 206,
  ItemInstances: 300,
  ItemStats: 304,
  PresentationNodes: 700,
  Records: 900,
} as const

export async function getCurrentUserMemberships(): Promise<UserMembershipData> {
  return bungieGet<UserMembershipData>("/User/GetMembershipsForCurrentUser/")
}

// Picks the primary Destiny membership (cross-save primary if set, else first)
export function primaryMembership(
  memberships: UserMembershipData
): UserInfoCard | null {
  const ds = memberships.destinyMemberships
  if (!ds || ds.length === 0) return null
  const primaryId = memberships.primaryMembershipId
  if (primaryId) {
    const match = ds.find((m) => m.membershipId === primaryId)
    if (match) return match
  }
  return ds[0]
}

/**
 * Resolve the membership to use given (a) the user's full membership list
 * and (b) an optional explicitly selected ID (from the platform store).
 * Falls back to `primaryMembership()` when the selection is missing or no
 * longer valid.
 */
export function resolveMembership(
  memberships: UserMembershipData | undefined,
  selectedId: string | null
): UserInfoCard | null {
  if (!memberships) return null
  if (selectedId) {
    const match = memberships.destinyMemberships?.find(
      (m) => m.membershipId === selectedId
    )
    if (match) return match
  }
  return primaryMembership(memberships)
}

export async function getProfile(
  membershipType: number,
  membershipId: string,
  components: number[] = [
    Components.Profiles,
    Components.Characters,
    Components.CharacterEquipment,
  ]
): Promise<DestinyProfileResponse> {
  return bungieGet<DestinyProfileResponse>(
    `/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components.join(",")}`
  )
}
