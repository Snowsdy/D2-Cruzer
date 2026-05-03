import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2"

// Specific weapon subcategory hashes (Auto Rifle, Hand Cannon, etc.).
// These are the leaf weapon-type categories that carry iconic icons in the manifest.
// Root hashes like 1 (Weapon) are skipped — they don't have icons.
const WEAPON_TYPE_HASHES = new Set<number>([
  5, // Auto Rifle
  6, // Hand Cannon
  7, // Pulse Rifle
  8, // Scout Rifle
  9, // Fusion Rifle
  10, // Sniper Rifle
  11, // Shotgun
  12, // Machine Gun
  13, // Rocket Launcher
  14, // Sidearm
  54, // Sword
  153950757, // Grenade Launcher
  1504945536, // Linear Fusion Rifle
  2489664120, // Trace Rifle
  3317538576, // Bow
  3871742104, // Glaive
  3954685534, // Submachine Gun
])

/** Returns the weapon type category hash for an item, or null if not a weapon. */
export function getWeaponCategoryHash(
  def: DestinyInventoryItemDefinition | undefined
): number | null {
  if (!def?.itemCategoryHashes) return null
  for (const h of def.itemCategoryHashes) {
    if (WEAPON_TYPE_HASHES.has(h)) return h
  }
  return null
}

// Armor slot hashes (helmet/gauntlets/chest/legs/class item) for icon resolution.
const ARMOR_SLOT_HASHES = new Set<number>([
  45, // Helmets
  46, // Gauntlets
  47, // Chest Armor
  48, // Leg Armor
  49, // Class Armor
])

export function getArmorSlotCategoryHash(
  def: DestinyInventoryItemDefinition | undefined
): number | null {
  if (!def?.itemCategoryHashes) return null
  for (const h of def.itemCategoryHashes) {
    if (ARMOR_SLOT_HASHES.has(h)) return h
  }
  return null
}
