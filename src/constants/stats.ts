// The six character / armor stats in the order displayed in-game.
// Hashes from DestinyStatDefinition (stable across Edge of Fate / Armor 3.0).
// Names are the new post-Armor 3.0 labels — the underlying Bungie hashes stayed
// the same, only the display names changed in the manifest.
export const STAT_HASHES = {
  // New Armor 3.0 labels
  Weapons: 2996146975, // ex-Mobility
  Health: 392767087, // ex-Resilience
  Class: 1943323491, // ex-Recovery
  Grenade: 1735777505, // ex-Discipline (name unchanged in FR)
  Super: 144602215, // ex-Intellect
  Melee: 4244567218, // ex-Strength (name "Mêlée" ≈ unchanged)

  // Legacy aliases — kept so older call-sites still compile.
  // Prefer the new names in new code.
  Mobility: 2996146975,
  Resilience: 392767087,
  Recovery: 1943323491,
  Discipline: 1735777505,
  Intellect: 144602215,
  Strength: 4244567218,
} as const

// In-game Edge of Fate display order.
export const ARMOR_STAT_ORDER: number[] = [
  STAT_HASHES.Weapons,
  STAT_HASHES.Health,
  STAT_HASHES.Class,
  STAT_HASHES.Grenade,
  STAT_HASHES.Super,
  STAT_HASHES.Melee,
]

/** Highest achievable value for a single armor stat across a full set. */
export const ARMOR_STAT_MAX = 200
/** Per-piece soft cap (legendary armor tops out around 30 per stat today). */
export const ARMOR_STAT_PER_PIECE_MAX = 30
/** How many points make one armor tier (unchanged). */
export const ARMOR_TIER_STEP = 10

/** Returns the tier (0-20) for a given per-stat total. */
export function armorTier(value: number): number {
  return Math.max(0, Math.min(20, Math.floor(value / ARMOR_TIER_STEP)))
}

const ARMOR_STAT_SET = new Set(ARMOR_STAT_ORDER)

export interface StatValues {
  [statHash: number]: { value: number }
}

export function sumArmorStats(stats: StatValues | undefined): number {
  if (!stats) return 0
  let total = 0
  for (const h of ARMOR_STAT_ORDER) {
    total += stats[h]?.value ?? 0
  }
  return total
}

export function isArmorStat(hash: number): boolean {
  return ARMOR_STAT_SET.has(hash)
}
