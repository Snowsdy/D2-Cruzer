/**
 * Shared item-classification predicates.
 *
 * These live here because Database.tsx, VendorsView.tsx, Loadouts.tsx, and
 * PerksDisplay.tsx all classify items — previously each rolled its own
 * implementation of "is this a shader?" / "is this a cosmetic plug?" with
 * slightly different accuracy. Centralizing keeps the signals consistent:
 * fixing shader detection here fixes it app-wide.
 *
 * All predicates are *pure* (no React, no store access).
 */
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2"
import { ITEM_TYPE, TIER, ITEM_CATEGORY_HASH } from "@/constants/bungieHashes"

// Subset of `DestinyInventoryItemDefinition` fields that aren't in the
// bungie-api-ts type but DO exist on the real payload. Typing them once
// here avoids sprinkling `as unknown as …` casts across feature code.
interface ExtendedDef {
  itemSubType?: number
  plug?: {
    plugCategoryHash?: number
    plugCategoryIdentifier?: string
  }
}

function ext(d: DestinyInventoryItemDefinition): ExtendedDef {
  return d as unknown as ExtendedDef
}

// ---------------------------------------------------------------------------
// Core type predicates
// ---------------------------------------------------------------------------

export const isWeapon = (d: DestinyInventoryItemDefinition): boolean =>
  d.itemType === ITEM_TYPE.Weapon

export const isArmor = (d: DestinyInventoryItemDefinition): boolean =>
  d.itemType === ITEM_TYPE.Armor

export const isExotic = (d: DestinyInventoryItemDefinition): boolean =>
  d.inventory?.tierType === TIER.Exotic

export const isLegendary = (d: DestinyInventoryItemDefinition): boolean =>
  d.inventory?.tierType === TIER.Legendary

// ---------------------------------------------------------------------------
// Shader — needs special care because modern D2 shaders are `itemType.Mod`
// (plug items) with a `plug.plugCategoryIdentifier === "shader"`.
// ---------------------------------------------------------------------------

/** True for shader items (handles category hash, subtype, plug id, and label). */
export function isShader(d: DestinyInventoryItemDefinition): boolean {
  const cats = d.itemCategoryHashes ?? []
  if (cats.includes(ITEM_CATEGORY_HASH.Shader)) return true
  const e = ext(d)
  if (e.itemSubType === ITEM_TYPE.Dummy) return true
  if (
    e.plug?.plugCategoryIdentifier &&
    /shader/i.test(e.plug.plugCategoryIdentifier)
  )
    return true
  const label = (d.itemTypeDisplayName ?? "").toLowerCase()
  return /shader|rev[êe]tement/.test(label)
}

// ---------------------------------------------------------------------------
// Plug categorization — for perk-display filters
//
// Prefix lists come straight from the Bungie plug category identifier space
// (e.g. "shader", "weapon.masterwork.catalyst"). Using exact prefixes rather
// than a broad regex avoids false positives on perk category IDs that merely
// mention "masterwork" or "shader" in passing.
// ---------------------------------------------------------------------------

const COSMETIC_PLUG_PREFIXES = [
  "shader",
  "weapon.tracker",
  "weapon.ornament",
  "armor.tracker",
  "armor.ornament",
  "armor_skins",
  "ghosts.tracker",
  "exotic_all_skins",
  "v400.empty.exotic",
]

const CATALYST_PLUG_PREFIXES = [
  "weapon.masterwork.catalyst",
  "catalysts",
  "v400.weapon.masterworks.trait",
]

/** True for cosmetic-only sockets (shaders, ornaments) that aren't gameplay perks. */
export function isCosmeticPlug(identifier?: string): boolean {
  if (!identifier) return false
  return COSMETIC_PLUG_PREFIXES.some((p) => identifier.includes(p))
}

/** True for catalyst sockets — the unlock/tracker plugs on exotic weapons. */
export function isCatalystPlug(identifier?: string): boolean {
  if (!identifier) return false
  return CATALYST_PLUG_PREFIXES.some((p) => identifier.includes(p))
}
