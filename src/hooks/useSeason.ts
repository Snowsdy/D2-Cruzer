import { useMemo } from "react"
import { useProfile } from "./useProfile"
import { useManifestStore } from "@/store/manifest"

export interface SeasonRewardItem {
  rank: number
  itemHash: number
  quantity: number
  isPremium: boolean
  claimed: boolean
}

export interface SeasonInfo {
  hash: number
  name: string
  number: number
  startDate: Date | null
  endDate: Date | null
  daysLeft: number | null
  /** 0-1 progress through the season duration. */
  progress: number
  backgroundImage?: string
  /** Current character's season pass rank (1-based). */
  rank: number
  /** XP to next rank. */
  xpProgress: number
  xpNeeded: number
  /** Has the user unlocked the premium pass track? */
  hasPremium: boolean
  /** Flat list of rewards per rank (both free + premium tracks). */
  rewards: SeasonRewardItem[]
}

/**
 * Reads the active season from the profile (`currentSeasonHash`) + manifest
 * and aggregates the character's season-pass progression. Uses the active
 * character's rank when multiple characters are present.
 */
export function useSeason(): SeasonInfo | null {
  const { profile, activeCharacterId } = useProfile()
  const manifest = useManifestStore((s) => s.manifest)

  return useMemo<SeasonInfo | null>(() => {
    if (!manifest || !profile.data) return null

    const p = profile.data.profile?.data
    const seasonHash = p?.currentSeasonHash
    if (!seasonHash) return null

    const seasonDef = manifest.DestinySeasonDefinition?.[seasonHash]
    if (!seasonDef) return null

    const startDate = seasonDef.startDate ? new Date(seasonDef.startDate) : null
    const endDate = seasonDef.endDate ? new Date(seasonDef.endDate) : null
    const now = new Date().getTime()
    const daysLeft = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - now) / 86_400_000))
      : null
    const progress =
      startDate && endDate && endDate.getTime() > startDate.getTime()
        ? Math.min(
            1,
            Math.max(
              0,
              (now - startDate.getTime()) /
                (endDate.getTime() - startDate.getTime())
            )
          )
        : 0

    // Season pass — Bungie's schema has evolved:
    //  - old: `seasonDef.seasonPassHash` (single pass per season)
    //  - new: `seasonDef.seasonPassList[]` (multiple passes per season, one per Act/Episode)
    // Try both, and if neither is populated, scan all season pass defs and
    // pick the one whose reward progression has a level > 0 on any char.
    type SeasonPassListEntry = { seasonPassHash?: number }
    const seasonDefExt = seasonDef as typeof seasonDef & {
      seasonPassList?: SeasonPassListEntry[]
    }
    const candidatePassHashes: number[] = []
    if (seasonDefExt.seasonPassHash)
      candidatePassHashes.push(seasonDefExt.seasonPassHash)
    for (const entry of seasonDefExt.seasonPassList ?? []) {
      if (entry?.seasonPassHash) candidatePassHashes.push(entry.seasonPassHash)
    }

    // Resolve to a concrete season pass def (prefer ones that have reward progressions).
    let seasonPassHash = 0
    let seasonPassDef:
      | { rewardProgressionHash?: number; prestigeProgressionHash?: number }
      | undefined
    for (const h of candidatePassHashes) {
      const def = manifest.DestinySeasonPassDefinition?.[h]
      if (def?.rewardProgressionHash) {
        seasonPassHash = h
        seasonPassDef = def
        break
      }
    }
    if (!seasonPassDef && candidatePassHashes.length > 0) {
      // Fallback: first pass even without reward progression.
      seasonPassHash = candidatePassHashes[0]
      seasonPassDef = manifest.DestinySeasonPassDefinition?.[seasonPassHash]
    }

    // Last-resort: scan ALL SeasonPassDefinition entries and pick the most
    // recent one (highest hash tends to correlate with newest in Bungie's data).
    if (!seasonPassDef) {
      const allPasses = manifest.DestinySeasonPassDefinition ?? {}
      const keys = Object.keys(allPasses)
        .map(Number)
        .filter((n) => !isNaN(n))
      if (keys.length > 0) {
        keys.sort((a, b) => b - a)
        for (const h of keys) {
          const def = allPasses[h]
          if (def?.rewardProgressionHash) {
            seasonPassHash = h
            seasonPassDef = def
            break
          }
        }
      }
    }

    const rewardProgHash = seasonPassDef?.rewardProgressionHash ?? 0
    const prestigeProgHash = seasonPassDef?.prestigeProgressionHash ?? 0

    // Season pass progression is stored per-character. Even with cross-save,
    // the progression is tied to a single character. We pick the character
    // with the highest rank (some players do pass XP on alt chars too).
    const allCharProgs = profile.data.characterProgressions?.data
    const charIds = allCharProgs ? Object.keys(allCharProgs) : []

    // Try active character first, then fall back to whichever character has
    // the highest reward rank (handles the case where the active character
    // isn't the one the user played the pass on).
    const orderedCharIds = [
      ...(activeCharacterId && charIds.includes(activeCharacterId)
        ? [activeCharacterId]
        : []),
      ...charIds.filter((c) => c !== activeCharacterId),
    ]

    let bestRewardProg:
      | { level: number; progressToNextLevel: number; nextLevelAt: number }
      | undefined
    let bestPrestigeProg:
      | { level: number; progressToNextLevel: number; nextLevelAt: number }
      | undefined
    for (const cid of orderedCharIds) {
      const progs = allCharProgs?.[cid]?.progressions
      if (!progs) continue
      const rp = rewardProgHash ? progs[rewardProgHash] : undefined
      const pp = prestigeProgHash ? progs[prestigeProgHash] : undefined
      const rpLevel = rp?.level ?? 0
      const ppLevel = pp?.level ?? 0
      const totalLevel = rpLevel + ppLevel
      const bestTotal =
        (bestRewardProg?.level ?? 0) + (bestPrestigeProg?.level ?? 0)
      if (totalLevel > bestTotal || !bestRewardProg) {
        bestRewardProg = rp
          ? {
              level: rp.level ?? 0,
              progressToNextLevel: rp.progressToNextLevel ?? 0,
              nextLevelAt: rp.nextLevelAt ?? 0,
            }
          : undefined
        bestPrestigeProg = pp
          ? {
              level: pp.level ?? 0,
              progressToNextLevel: pp.progressToNextLevel ?? 0,
              nextLevelAt: pp.nextLevelAt ?? 0,
            }
          : undefined
      }
    }

    const rewardLevel = bestRewardProg?.level ?? 0
    const prestigeLevel = bestPrestigeProg?.level ?? 0
    const rank = rewardLevel + prestigeLevel
    const xpProgress =
      bestRewardProg?.progressToNextLevel ??
      bestPrestigeProg?.progressToNextLevel ??
      0
    const xpNeeded =
      bestRewardProg?.nextLevelAt ?? bestPrestigeProg?.nextLevelAt ?? 0

    // Pass ownership — inferred from prestige progression being advanced OR
    // rank past 100 (free pass caps at 100).
    const hasPremium = prestigeLevel > 0 || rewardLevel >= 100

    // Build flat reward list from BOTH the reward AND prestige progression
    // definitions. Bungie usually puts free+premium rewards in the reward
    // progression, but some seasons split them.
    const rewards: SeasonRewardItem[] = []
    const collectRewards = (progHash: number, defaultPremium: boolean) => {
      if (!progHash) return
      const def = manifest.DestinyProgressionDefinition?.[progHash]
      const items = def?.rewardItems
      if (!items) return
      for (const r of items) {
        const uiStyle = (r as { uiDisplayStyle?: string }).uiDisplayStyle ?? ""
        let isPremium = defaultPremium
        if (uiStyle === "premium") isPremium = true
        else if (uiStyle === "free" || uiStyle === "free_reward_additional")
          isPremium = false
        const rankForReward = r.rewardedAtProgressionLevel ?? 0
        rewards.push({
          rank: rankForReward,
          itemHash: r.itemHash,
          quantity: r.quantity ?? 1,
          isPremium,
          claimed: rankForReward <= rank && (!isPremium || hasPremium),
        })
      }
    }
    collectRewards(rewardProgHash, false)
    collectRewards(prestigeProgHash, true)

    // Diagnostic — helps track missing manifest data.
    if (import.meta.env.DEV && rewards.length === 0) {
      console.warn("[season] no rewards loaded", {
        seasonHash,
        seasonPassHash,
        rewardProgHash,
        prestigeProgHash,
        hasSeasonPassDef: !!seasonPassDef,
        hasRewardProgDef:
          !!manifest.DestinyProgressionDefinition?.[rewardProgHash],
        hasPrestigeProgDef:
          !!manifest.DestinyProgressionDefinition?.[prestigeProgHash],
        manifestProgDefCount: Object.keys(
          manifest.DestinyProgressionDefinition ?? {}
        ).length,
        rewardLevel,
        prestigeLevel,
        charIds,
      })
    }

    return {
      hash: seasonHash,
      name:
        seasonDef.displayProperties?.name ?? `Saison ${seasonDef.seasonNumber}`,
      number: seasonDef.seasonNumber ?? 0,
      startDate,
      endDate,
      daysLeft,
      progress,
      backgroundImage: seasonDef.backgroundImagePath
        ? `https://www.bungie.net${seasonDef.backgroundImagePath}`
        : undefined,
      rank,
      xpProgress,
      xpNeeded,
      hasPremium,
      rewards,
    }
  }, [manifest, profile.data, activeCharacterId])
}

// ---------------------------------------------------------------------------
// Past-season index
// ---------------------------------------------------------------------------

export interface PastSeasonCard {
  hash: number
  name: string
  number: number
  startDate: Date | null
  endDate: Date | null
  backgroundImage?: string
  /** Total number of season-pass rewards defined for this season. */
  rewardCount: number
  /** Number of premium-gated rewards. */
  premiumCount: number
}

export interface PastSeasonDetail {
  hash: number
  name: string
  number: number
  startDate: Date | null
  endDate: Date | null
  backgroundImage?: string
  rewards: SeasonRewardItem[]
}

/**
 * Lists every Destiny 2 season defined in the manifest whose end date is
 * already in the past, sorted newest → oldest. Excludes the current season
 * (identified by `currentHash`) so the caller can render an "archive"
 * section separate from the active pass.
 *
 * The Bungie API does not let the user claim expired season-pass rewards —
 * these cards are purely informational / nostalgic.
 */
export function usePastSeasons(currentHash: number | null): PastSeasonCard[] {
  const manifest = useManifestStore((s) => s.manifest)

  return useMemo<PastSeasonCard[]>(() => {
    if (!manifest?.DestinySeasonDefinition) return []
    const now = new Date().getTime()
    const out: PastSeasonCard[] = []
    for (const hashStr in manifest.DestinySeasonDefinition) {
      const hash = Number(hashStr)
      if (hash === currentHash) continue
      const def = manifest.DestinySeasonDefinition[hash]
      if (!def) continue
      if ((def as { redacted?: boolean }).redacted) continue
      const name = def.displayProperties?.name
      if (!name || /\[unused\]|classified/i.test(name)) continue
      const endDate = def.endDate ? new Date(def.endDate) : null
      if (!endDate || endDate.getTime() > now) continue
      if (!def.seasonNumber) continue

      // Count rewards defined by the pass progressions for this season.
      const rewards = collectSeasonRewards(manifest, def)
      const premiumCount = rewards.filter((r) => r.isPremium).length

      out.push({
        hash,
        name,
        number: def.seasonNumber,
        startDate: def.startDate ? new Date(def.startDate) : null,
        endDate,
        backgroundImage: def.backgroundImagePath
          ? `https://www.bungie.net${def.backgroundImagePath}`
          : undefined,
        rewardCount: rewards.length,
        premiumCount,
      })
    }
    return out.sort((a, b) => b.number - a.number)
  }, [manifest, currentHash])
}

/**
 * Full reward list for a past season — used by the in-app archive viewer.
 * All rewards are returned read-only (no claim state, since Bungie doesn't
 * expose historical per-user progression once a season ends).
 */
export function usePastSeasonDetail(
  hash: number | null
): PastSeasonDetail | null {
  const manifest = useManifestStore((s) => s.manifest)

  return useMemo<PastSeasonDetail | null>(() => {
    if (!manifest || !hash) return null
    const def = manifest.DestinySeasonDefinition?.[hash]
    if (!def) return null
    const rewards = collectSeasonRewards(manifest, def)
    return {
      hash,
      name: def.displayProperties?.name ?? `Saison ${def.seasonNumber}`,
      number: def.seasonNumber ?? 0,
      startDate: def.startDate ? new Date(def.startDate) : null,
      endDate: def.endDate ? new Date(def.endDate) : null,
      backgroundImage: def.backgroundImagePath
        ? `https://www.bungie.net${def.backgroundImagePath}`
        : undefined,
      rewards,
    }
  }, [manifest, hash])
}

// ---------------------------------------------------------------------------
// Shared reward collector — scans every pass progression linked to a season
// definition (new `seasonPassList` shape + legacy `seasonPassHash`) and flattens
// the reward items into the client-side shape. `claimed` is always false for
// past seasons (no per-user data).
// ---------------------------------------------------------------------------

type ManifestShape = NonNullable<
  ReturnType<typeof useManifestStore.getState>["manifest"]
>

function collectSeasonRewards(
  manifest: ManifestShape,
  seasonDef: ManifestShape["DestinySeasonDefinition"][number]
): SeasonRewardItem[] {
  // Bungie has evolved the season-pass schema several times. Cover every
  // known shape (old seasons vs. new Episodes):
  //   1. `seasonPassProgressionHash` + `prestigeProgressionHash` directly
  //      on the season def (S8 → ~S14).
  //   2. `seasonPassHash` pointing at a DestinySeasonPassDefinition that
  //      holds the reward/prestige progression hashes (S15 → S24 era).
  //   3. `seasonPassList[]` for Episodes with multiple passes.
  // Some old seasons also still expose `rewardProgressionHash` directly.
  type SeasonPassListEntry = { seasonPassHash?: number }
  const ext = seasonDef as typeof seasonDef & {
    seasonPassHash?: number
    seasonPassProgressionHash?: number
    rewardProgressionHash?: number
    prestigeProgressionHash?: number
    seasonPassList?: SeasonPassListEntry[]
  }

  const freeProgHashes = new Set<number>()
  const premiumProgHashes = new Set<number>()

  // (1) Progressions stored directly on the season def (old schema).
  if (ext.seasonPassProgressionHash)
    freeProgHashes.add(ext.seasonPassProgressionHash)
  if (ext.rewardProgressionHash) freeProgHashes.add(ext.rewardProgressionHash)
  if (ext.prestigeProgressionHash)
    premiumProgHashes.add(ext.prestigeProgressionHash)

  // (2) + (3) Indirection through SeasonPassDefinition.
  const passHashes: number[] = []
  if (ext.seasonPassHash) passHashes.push(ext.seasonPassHash)
  for (const entry of ext.seasonPassList ?? []) {
    if (entry?.seasonPassHash) passHashes.push(entry.seasonPassHash)
  }
  for (const passHash of passHashes) {
    const passDef = manifest.DestinySeasonPassDefinition?.[passHash]
    if (!passDef) continue
    if (passDef.rewardProgressionHash)
      freeProgHashes.add(passDef.rewardProgressionHash)
    if (passDef.prestigeProgressionHash)
      premiumProgHashes.add(passDef.prestigeProgressionHash)
  }

  const out: SeasonRewardItem[] = []
  const seenByRankKey = new Set<string>()
  const addRewards = (progHash: number, defaultPremium: boolean) => {
    const progDef = manifest.DestinyProgressionDefinition?.[progHash]
    const items = progDef?.rewardItems
    if (!items) return
    for (const r of items) {
      const uiStyle = (r as { uiDisplayStyle?: string }).uiDisplayStyle ?? ""
      let isPremium = defaultPremium
      if (uiStyle === "premium") isPremium = true
      else if (uiStyle === "free" || uiStyle === "free_reward_additional")
        isPremium = false
      const rank = r.rewardedAtProgressionLevel ?? 0
      const key = `${rank}:${r.itemHash}:${isPremium ? "P" : "F"}`
      if (seenByRankKey.has(key)) continue
      seenByRankKey.add(key)
      out.push({
        rank,
        itemHash: r.itemHash,
        quantity: r.quantity ?? 1,
        isPremium,
        claimed: false,
      })
    }
  }

  for (const h of freeProgHashes) addRewards(h, false)
  for (const h of premiumProgHashes) addRewards(h, true)
  return out
}
