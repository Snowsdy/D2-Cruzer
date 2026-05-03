/**
 * Well-known Bungie API hashes.
 *
 * Keeping them in one file means:
 *   - A single place to audit when Bungie ships a content update that
 *     changes a category / bucket hash.
 *   - No "magic number" comments scattered across feature views.
 *   - Typed constants prevent typos that would silently break classifiers.
 *
 * DestinyItemType / DestinyDamageType / tierType enums are also re-exported
 * here so consumers don't each define their own local mini-enum.
 */

import type { VendorKey } from "@/api/vendors"

// ---------------------------------------------------------------------------
// Item types  (DestinyInventoryItemDefinition.itemType)
// ---------------------------------------------------------------------------
export const ITEM_TYPE = {
  Armor: 2,
  Weapon: 3,
  Emblem: 14,
  Subclass: 16,
  Mod: 19,
  Dummy: 20,
  Ship: 21,
  Vehicle: 22,
  Emote: 23,
  Ghost: 24,
  Package: 25,
  Bounty: 26,
  Finisher: 29,
} as const

// ---------------------------------------------------------------------------
// Class types  (DestinyInventoryItemDefinition.classType)
// ---------------------------------------------------------------------------
export const CLASS_TYPE = {
  Titan: 0,
  Hunter: 1,
  Warlock: 2,
  Any: 3,
} as const

// ---------------------------------------------------------------------------
// Rarity / tier  (inventory.tierType) — 2..6 scale, 6 = Exotic
// ---------------------------------------------------------------------------
export const TIER = {
  Common: 2,
  Uncommon: 3,
  Rare: 4,
  Legendary: 5,
  Exotic: 6,
} as const

// ---------------------------------------------------------------------------
// Damage types  (DestinyInventoryItemDefinition.defaultDamageType)
// ---------------------------------------------------------------------------
export const DAMAGE_TYPE = {
  Kinetic: 1,
  Arc: 2,
  Solar: 3,
  Void: 4,
  Stasis: 6,
  Strand: 7,
} as const

// ---------------------------------------------------------------------------
// Ammo types  (equippingBlock.ammoType) — weapon slot
// ---------------------------------------------------------------------------
export const AMMO_TYPE = {
  Kinetic: 1,
  Energy: 2,
  Power: 3,
} as const

// ---------------------------------------------------------------------------
// Well-known DestinyItemCategoryDefinition hashes
// ---------------------------------------------------------------------------
export const ITEM_CATEGORY_HASH = {
  Shader: 41757123,
  Finisher: 3683254069,
} as const

// ---------------------------------------------------------------------------
// Activity mode hashes  (DestinyActivityDefinition.directActivityModeType,
// or DestinyHistoricalStats mode filter). Used by Reports, Stats, Live
// activity filters.
// ---------------------------------------------------------------------------
export const ACTIVITY_MODE = {
  Strike: 3,
  AllPvP: 5,
  Patrol: 6,
  Raid: 4,
  AllStrikes: 18,
  IronBanner: 19,
  Nightfall: 46,
  TrialsOfOsiris: 84,
  Gambit: 63,
  Dungeon: 82,
  LostSector: 87,
} as const

/**
 * Inventory bucket hashes — Bungie exposes slot-level crest icons for these
 * (the same glyphs used in the in-game category headers like "ARMES
 * PRINCIPALE" or "RESSOURCES").
 */
export const BucketHashes = {
  Kinetic: 1498876634,
  Energy: 2465295065,
  Power: 953998645,
  Helmet: 3448274439,
  Gauntlets: 3551918588,
  ChestArmor: 14239492,
  LegArmor: 20886954,
  ClassArmor: 1585787867,
  Ghost: 4023194814,
  Vehicle: 2025709351,
  Ships: 284967655,
  Emblems: 4274335291,
  General: 138197802,
  Consumables: 1469714392,
  Modifications: 3313201758,
  Shaders: 2973005342,
} as const

/** Damage type hashes — guaranteed present in manifest with colored icons. */
export const DamageTypes = {
  Kinetic: 3373582085,
  Arc: 2303181850,
  Solar: 1847026933,
  Void: 3454344768,
  Stasis: 151347233,
  Strand: 3949783978,
} as const

/** Stat hashes — guaranteed present. */
export const Stats = {
  Mobility: 2996146975,
  Resilience: 392767087,
  Recovery: 1943323491,
  Discipline: 1735777505,
  Intellect: 144602215,
  Strength: 4244567218,
} as const

/** Class hashes. */
export const Classes = {
  Titan: 3655393761,
  Hunter: 671679327,
  Warlock: 2271682572,
} as const

export const VENDOR_COLOR: Record<VendorKey, string> = {
  Zavala: "#38bdf8",
  Shaxx: "#f87171",
  Drifter: "#34d399",
  Banshee: "#fbbf24",
  SaintFourteen: "#c084fc",
  Ada1: "#fb923c",
  Hawthorne: "#2dd4bf",
  Ikora: "#818cf8",
  Eververse: "#38bdf8",
  Xur: "#facc15",
  LordSaladin: "",
  Rahool: "",
}
