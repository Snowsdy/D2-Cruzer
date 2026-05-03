/* eslint-disable react-hooks/preserve-manual-memoization */
import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useProfile } from "@/hooks/useProfile"
import { getItemDef } from "@/api/itemDef"
import { TIER, CLASS_TYPE as CLASS } from "@/constants/bungieHashes"
import type {
  DestinyItemComponent,
  DestinyInventoryItemDefinition,
} from "bungie-api-ts/destiny2"

const EXOTIC_TIER = TIER.Exotic
const CLASS_TYPE: Record<"Hunter" | "Warlock" | "Titan", number> = {
  Titan: CLASS.Titan,
  Hunter: CLASS.Hunter,
  Warlock: CLASS.Warlock,
}

/**
 * Returns the first exotic weapon (or armor if none) the user owns that matches
 * the given class. Used as a dynamic build thumbnail that's guaranteed to have
 * a valid icon since the user owns the item.
 */
export function useExoticForClass(
  className: "Hunter" | "Warlock" | "Titan",
  preferType: "weapon" | "armor" = "weapon"
): {
  def: DestinyInventoryItemDefinition | null
  item: DestinyItemComponent | null
} {
  const { profile } = useProfile()
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"

  const allItems = useMemo(() => {
    if (!profile.data) return [] as DestinyItemComponent[]
    const out: DestinyItemComponent[] = []
    const chars = profile.data.characters?.data ?? {}
    for (const cid of Object.keys(chars)) {
      for (const it of profile.data.characterEquipment?.data?.[cid]?.items ??
        []) {
        if (it.itemInstanceId) out.push(it)
      }
      for (const it of profile.data.characterInventories?.data?.[cid]?.items ??
        []) {
        if (it.itemInstanceId) out.push(it)
      }
    }
    for (const it of profile.data.profileInventory?.data?.items ?? []) {
      if (it.itemInstanceId) out.push(it)
    }
    return out
  }, [profile.data])

  const uniqHashes = useMemo(
    () => [...new Set(allItems.map((it) => it.itemHash))],
    [allItems]
  )

  const defQueries = useQueries({
    queries: uniqHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const match = useMemo(() => {
    const targetClass = CLASS_TYPE[className]

    for (const it of allItems) {
      const idx = uniqHashes.indexOf(it.itemHash)
      const def = defQueries[idx]?.data

      if (!def) continue
      if (def.inventory?.tierType !== EXOTIC_TIER) continue

      const isWeapon = def.itemType === 3
      const isArmor = def.itemType === 2
      if (!isWeapon && !isArmor) continue

      // Weapons are class-agnostic — match regardless
      // Armors must match class
      if (isArmor && def.classType !== targetClass) continue

      if (
        (preferType === "weapon" && isWeapon) ||
        (preferType === "armor" && isArmor)
      ) {
        return { def, item: it }
      }
    }

    // Fallback: any exotic (any type) that's class-compatible
    for (const it of allItems) {
      const idx = uniqHashes.indexOf(it.itemHash)
      const def = defQueries[idx]?.data
      if (!def) continue
      if (def.inventory?.tierType !== EXOTIC_TIER) continue
      if (def.itemType !== 2 && def.itemType !== 3) continue
      if (def.itemType === 2 && def.classType !== targetClass) continue
      return { def, item: it }
    }

    return { def: null, item: null }
  }, [className, allItems, uniqHashes, defQueries, preferType])

  return match
}
