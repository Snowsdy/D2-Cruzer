import { bungieGet } from "./bungie"

type StatsGroup = Record<
  string,
  { basic?: { value: number; displayValue: string } }
>

type PeriodBucket = { allTime?: StatsGroup; allPvP?: StatsGroup }

// Bungie account-level stats (cross-character aggregated).
// Endpoint: /Destiny2/{membershipType}/Account/{membershipId}/Stats/
export interface AccountStats {
  mergedAllCharacters?: {
    results?: {
      allPvE?: PeriodBucket
      allPvP?: PeriodBucket
      allPvECompetitive?: PeriodBucket
      allStrikes?: PeriodBucket
      raid?: PeriodBucket
      allDoables?: PeriodBucket
      trialsOfOsiris?: PeriodBucket
      trialsOfTheNine?: PeriodBucket
      ironBanner?: PeriodBucket
      gambit?: PeriodBucket
      nightfall?: PeriodBucket
      [key: string]: PeriodBucket | undefined
    }
  }
}

export async function getAccountStats(
  membershipType: number,
  membershipId: string,
  modes?: number[]
): Promise<AccountStats> {
  const qs = modes && modes.length > 0 ? `?modes=${modes.join(",")}` : ""
  return bungieGet<AccountStats>(
    `/Destiny2/${membershipType}/Account/${membershipId}/Stats/${qs}`
  )
}

/**
 * Character-level historical stats. Pass characterId = "0" to merge across
 * all characters (this is the only endpoint that returns per-mode buckets
 * like `trials_of_osiris`, `ironBanner`, `scored_nightfall`, etc.).
 */
export interface CharacterStatsResponse {
  allPvP?: { allTime?: Record<string, { basic?: { value: number } }> }
  allPvE?: { allTime?: Record<string, { basic?: { value: number } }> }
  trials_of_osiris?: {
    allTime?: Record<string, { basic?: { value: number } }>
  }
  ironBanner?: { allTime?: Record<string, { basic?: { value: number } }> }
  scored_nightfall?: {
    allTime?: Record<string, { basic?: { value: number } }>
  }
  pvecomp_gambit?: {
    allTime?: Record<string, { basic?: { value: number } }>
  }
  [key: string]:
    | { allTime?: Record<string, { basic?: { value: number } }> }
    | undefined
}

export async function getCharacterStats(
  membershipType: number,
  membershipId: string,
  characterId: string = "0",
  modes?: number[]
): Promise<CharacterStatsResponse> {
  const qs = modes && modes.length > 0 ? `?modes=${modes.join(",")}` : ""
  return bungieGet<CharacterStatsResponse>(
    `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/${qs}`
  )
}

/** Pull a numeric value from a stats group, returns 0 if missing. */
export function readStat(
  group: Record<string, { basic?: { value: number } }> | undefined,
  key: string
): number {
  return group?.[key]?.basic?.value ?? 0
}
