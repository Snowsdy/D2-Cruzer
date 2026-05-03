// Bungie Destiny 2 Manifest loader.
// Only fetches the specific definition tables we need (skips heavy ones like InventoryItem by default).
// Cached in localStorage by version; re-fetched on version bump.
import { trackedInvoke } from "@/lib/tauri"
import { bungieGet } from "./bungie"
import { SK_MANIFEST_LIGHT } from "@/constants/storageKeys"
import type {
  DestinyClassDefinition,
  DestinyRaceDefinition,
  DestinyGenderDefinition,
  DestinyInventoryBucketDefinition,
  DestinyStatDefinition,
  DestinyDamageTypeDefinition,
  DestinyItemCategoryDefinition,
  DestinyActivityDefinition,
  DestinyActivityModeDefinition,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
  DestinyProgressionDefinition,
  DestinyPresentationNodeDefinition,
} from "bungie-api-ts/destiny2"

interface ManifestInfo {
  version: string
  jsonWorldComponentContentPaths: Record<string, Record<string, string>>
}

// Tables we always load upfront — they're small (< 50KB each).
const LIGHT_TABLES = [
  "DestinyClassDefinition",
  "DestinyRaceDefinition",
  "DestinyGenderDefinition",
  "DestinyInventoryBucketDefinition",
  "DestinyStatDefinition",
  "DestinyDamageTypeDefinition",
  "DestinyItemCategoryDefinition",
  "DestinyActivityDefinition",
  "DestinyActivityModeDefinition",
  "DestinySeasonDefinition",
  "DestinySeasonPassDefinition",
  "DestinyProgressionDefinition",
  "DestinyPresentationNodeDefinition",
] as const

export interface LightManifest {
  version: string
  locale: string
  DestinyClassDefinition: Record<number, DestinyClassDefinition>
  DestinyRaceDefinition: Record<number, DestinyRaceDefinition>
  DestinyGenderDefinition: Record<number, DestinyGenderDefinition>
  DestinyInventoryBucketDefinition: Record<
    number,
    DestinyInventoryBucketDefinition
  >
  DestinyStatDefinition: Record<number, DestinyStatDefinition>
  DestinyDamageTypeDefinition: Record<number, DestinyDamageTypeDefinition>
  DestinyItemCategoryDefinition: Record<number, DestinyItemCategoryDefinition>
  DestinyActivityDefinition: Record<number, DestinyActivityDefinition>
  DestinyActivityModeDefinition: Record<number, DestinyActivityModeDefinition>
  DestinySeasonDefinition: Record<number, DestinySeasonDefinition>
  DestinySeasonPassDefinition: Record<number, DestinySeasonPassDefinition>
  DestinyProgressionDefinition: Record<number, DestinyProgressionDefinition>
  DestinyPresentationNodeDefinition: Record<
    number,
    DestinyPresentationNodeDefinition
  >
}

/**
 * Well-known item category hashes — used to pull real game icons for nav/tabs.
 * https://data.destinysets.com/i/ItemCategory (browse)
 */
export const ItemCategories = {
  Weapon: 1,
  KineticWeapon: 2,
  EnergyWeapon: 3,
  PowerWeapon: 4,
  AutoRifle: 5,
  HandCannon: 6,
  PulseRifle: 7,
  ScoutRifle: 8,
  Fusion: 9,
  Sniper: 10,
  Shotgun: 11,
  MachineGun: 12,
  RocketLauncher: 13,
  Sidearm: 14,
  Sword: 54,
  Bow: 3317538576,
  LinearFusion: 1504945536,
  TraceRifle: 2489664120,
  GrenadeLauncher: 153950757,
  Armor: 20,
  Ghost: 39,
  Vehicle: 41,
  Ship: 42,
  Emblem: 19,
  Subclass: 50,
  Mod: 59,
} as const

// Bump `SK_MANIFEST_LIGHT` in storageKeys.ts when adding a new table OR when
// Bungie's manifest content changes in a way that should invalidate existing
// caches (e.g. Armor 3.0 stat rename with new display icons).
const CACHE_KEY = SK_MANIFEST_LIGHT

// Older cache keys we've shipped. Purging them on startup reclaims a few
// hundred KB of localStorage per user who upgraded from a pre-v6 build.
// Add to this list whenever `SK_MANIFEST_LIGHT` is bumped.
const LEGACY_CACHE_KEYS = [
  "cruzer:manifest_light",
  "cruzer:manifest_light_v1",
  "cruzer:manifest_light_v2",
  "cruzer:manifest_light_v3",
  "cruzer:manifest_light_v4",
  "cruzer:manifest_light_v5",
]

function purgeLegacyCaches(): void {
  for (const k of LEGACY_CACHE_KEYS) {
    if (k === CACHE_KEY) continue
    try {
      localStorage.removeItem(k)
    } catch {
      /* quota / disabled storage — ignore */
    }
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  return trackedInvoke<T>("bungie_fetch_raw", { path })
}

export async function loadLightManifest(locale = "fr"): Promise<LightManifest> {
  purgeLegacyCaches()
  const info = await bungieGet<ManifestInfo>("/Destiny2/Manifest/", {
    auth: false,
  })

  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as LightManifest
      // Validate: version + locale + all required tables present with content
      const hasAllTables = LIGHT_TABLES.every(
        (table) =>
          parsed[table as keyof LightManifest] &&
          typeof parsed[table as keyof LightManifest] === "object"
      )
      if (
        parsed.version === info.version &&
        parsed.locale === locale &&
        hasAllTables
      ) {
        return parsed
      }
    } catch {
      /* cache corrupt — refetch */
    }
  }

  const paths = info.jsonWorldComponentContentPaths[locale]
  if (!paths) throw new Error(`No manifest for locale ${locale}`)

  // Per-table try/catch so one failure doesn't sink the whole manifest load
  const entries = await Promise.all(
    LIGHT_TABLES.map(async (table) => {
      const path = paths[table]
      if (!path) return [table, {}] as const
      try {
        const data = await fetchJson<Record<number, unknown>>(path)
        return [table, data] as const
      } catch (e) {
        console.warn(`[manifest] failed to load ${table}:`, e)
        return [table, {}] as const
      }
    })
  )

  const manifest = {
    version: info.version,
    locale,
    ...Object.fromEntries(entries),
  } as LightManifest

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(manifest))
  } catch {
    // Cache too big for localStorage — ignore, will refetch next time
  }

  return manifest
}

// Helper accessors so consumers don't have to deal with hash → def lookup
export function getName<T extends { displayProperties?: { name?: string } }>(
  table: Record<number, T>,
  hash: number | undefined
): string {
  if (hash == null) return ""
  return table[hash]?.displayProperties?.name ?? ""
}
