import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"
import { useProfile } from "@/hooks/useProfile"
import { useManifestStore } from "@/store/manifest"
import { useSearchStore } from "@/store/search"
import { useTagsStore } from "@/store/tags"
import { getItemDef } from "@/api/itemDef"
import { parseQuery, matches } from "@/utils/itemFilter"
import { sumArmorStats } from "@/constants/stats"
import { ItemTile } from "./ItemTile"
import { DropZone } from "./DropZone"
import { IconVault } from "@/components/icon"
import {
  Buckets,
  WEAPON_BUCKETS,
  ARMOR_BUCKETS,
  VAULT_GENERAL_BUCKETS,
} from "@/constants/buckets"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

type Filter = "all" | "weapons" | "armor" | "general"

const FILTER_BUCKETS: Record<Filter, readonly number[]> = {
  all: [
    ...WEAPON_BUCKETS,
    ...ARMOR_BUCKETS,
    ...VAULT_GENERAL_BUCKETS.filter((h) => h !== Buckets.Subclass),
  ],
  weapons: WEAPON_BUCKETS,
  armor: ARMOR_BUCKETS,
  general: VAULT_GENERAL_BUCKETS.filter((h) => h !== Buckets.Subclass),
}

export function VaultColumn() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const { profile } = useProfile()
  const manifest = useManifestStore((s) => s.manifest)
  const query = useSearchStore((s) => s.query)
  const tagsState = useTagsStore((s) => s.tags)
  const [filter, setFilter] = useState<Filter>("all")

  const rawItems = useMemo(() => {
    return profile.data?.profileInventory?.data?.items ?? []
  }, [profile.data])

  // Every vault item has bucketHash = GeneralVault; fetch all defs first
  // so we can re-group by each item's natural slot (bucketTypeHash).
  const allHashes = useMemo(() => {
    const set = new Set<number>()
    for (const it of rawItems) set.add(it.itemHash)
    return [...set]
  }, [rawItems])

  const defQueries = useQueries({
    queries: allHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })
  const defMap = useMemo(() => {
    const m = new Map<number, (typeof defQueries)[number]["data"]>()
    allHashes.forEach((h, i) => {
      const d = defQueries[i]?.data
      if (d) m.set(h, d)
    })
    return m
  }, [allHashes, defQueries])

  const vaultItems = useMemo(() => {
    const map = new Map<number, DestinyItemComponent[]>()
    for (const it of rawItems) {
      const def = defMap.get(it.itemHash)
      const slot = def?.inventory?.bucketTypeHash ?? it.bucketHash
      const arr = map.get(slot) ?? []
      arr.push(it)
      map.set(slot, arr)
    }
    return map
  }, [rawItems, defMap])

  const itemStats = useMemo(() => {
    return profile.data?.itemComponents?.stats?.data ?? {}
  }, [profile.data])
  const itemInstances = useMemo(() => {
    return profile.data?.itemComponents?.instances?.data ?? {}
  }, [profile.data])

  const sections = useMemo(() => {
    const predicates = query.trim() ? parseQuery(query) : []
    return FILTER_BUCKETS[filter].map((bucketHash) => {
      const bucketName =
        manifest?.DestinyInventoryBucketDefinition?.[bucketHash]
          ?.displayProperties?.name ?? ""
      const items = (vaultItems.get(bucketHash) ?? []).filter((it) => {
        const def = defMap.get(it.itemHash)
        const power =
          (it.itemInstanceId
            ? itemInstances[it.itemInstanceId]?.primaryStat?.value
            : undefined) ?? 0
        const stats = it.itemInstanceId
          ? itemStats[it.itemInstanceId]?.stats
          : undefined
        const tag = it.itemInstanceId
          ? (tagsState[it.itemInstanceId] ?? null)
          : null
        return matches(predicates, it, {
          def,
          stats,
          power,
          tag,
          equipped: false,
          inVault: true,
        })
      })
      // Always sort: power desc (tiebreak stat total desc)
      const sorted = [...items].sort((a, b) => {
        const pa = a.itemInstanceId
          ? (itemInstances[a.itemInstanceId]?.primaryStat?.value ?? 0)
          : 0
        const pb = b.itemInstanceId
          ? (itemInstances[b.itemInstanceId]?.primaryStat?.value ?? 0)
          : 0
        if (pb !== pa) return pb - pa
        const ta = a.itemInstanceId
          ? sumArmorStats(itemStats[a.itemInstanceId]?.stats)
          : 0
        const tb = b.itemInstanceId
          ? sumArmorStats(itemStats[b.itemInstanceId]?.stats)
          : 0
        return tb - ta
      })
      return { bucketHash, bucketName, items: sorted }
    })
  }, [
    filter,
    vaultItems,
    manifest,
    query,
    defMap,
    itemStats,
    itemInstances,
    tagsState,
  ])

  const total = sections.reduce((s, x) => s + x.items.length, 0)

  return (
    <div className="panel flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden">
      {/* Header */}
      <DropZone
        accept={(src) => {
          // Vault only accepts items coming FROM a character.
          if (!src.ownerCharacterId) return false
          const slot = src.naturalSlotHash ?? src.bucketHash
          return [
            ...WEAPON_BUCKETS,
            ...ARMOR_BUCKETS,
            ...VAULT_GENERAL_BUCKETS,
          ].includes(slot as never)
        }}
        onDrop={async (actions, src) => {
          if (!src.ownerCharacterId) return
          try {
            await actions.moveToVault.mutateAsync({
              itemInstanceId: src.itemInstanceId,
              itemReferenceHash: src.itemHash,
              fromCharacterId: src.ownerCharacterId,
            })
          } catch (e) {
            console.error("Vault drop failed:", e)
          }
        }}
        className="rounded-t-xl"
      >
        <div className="border-bungie-border bg-bungie-panel/80 flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-bungie-muted text-[10px] tracking-widest uppercase">
              {t("inventory.vault")}
            </div>
            <div className="inline-flex items-center gap-2 text-base leading-tight font-bold tracking-[0.12em] uppercase">
              <IconVault size={18} className="text-bungie-accent" /> Coffre
            </div>
          </div>
          <div className="text-bungie-accent text-2xl leading-none font-bold tabular-nums">
            {total}
          </div>
        </div>
      </DropZone>

      {/* Filter pills */}
      <div className="border-bungie-border/50 bg-bungie-panel/40 flex gap-1 border-b px-3 py-2">
        {(["all", "weapons", "armor", "general"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-full px-2 py-1 text-[10px] tracking-wider uppercase transition-all ${
              filter === f
                ? "bg-bungie-accent font-semibold text-black"
                : "text-bungie-text/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t(`vault.filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-2 py-2">
        {sections.map((s) => (
          <DropZone
            key={s.bucketHash}
            accept={(src) => {
              if (!src.ownerCharacterId) return false
              const slot = src.naturalSlotHash ?? src.bucketHash
              return slot === s.bucketHash
            }}
            onDrop={async (actions, src) => {
              if (!src.ownerCharacterId) return
              try {
                await actions.moveToVault.mutateAsync({
                  itemInstanceId: src.itemInstanceId,
                  itemReferenceHash: src.itemHash,
                  fromCharacterId: src.ownerCharacterId,
                })
              } catch (e) {
                console.error("Vault bucket drop failed:", e)
              }
            }}
            className="rounded-lg"
          >
            <div className="border-bungie-border/60 min-h-14 rounded-lg border bg-black/25 backdrop-blur-sm">
              {/* Label bar with color */}
              <div className="border-bungie-border/40 from-bungie-accent/5 flex items-center justify-between border-b bg-linear-to-r to-transparent px-3 py-1.5">
                <div className="text-bungie-accent/90 text-[10px] font-bold tracking-[0.2em] uppercase">
                  {s.bucketName}
                </div>
                <div className="text-bungie-muted rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                  {s.items.length}
                </div>
              </div>

              {/* Items grid */}
              {s.items.length === 0 ? (
                <div className="text-bungie-muted/40 px-3 py-2 text-xs italic">
                  —
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-2">
                  {s.items.map((it) => (
                    <ItemTile
                      key={
                        it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`
                      }
                      item={it}
                      size="sm"
                      ownerCharacterId={null}
                    />
                  ))}
                </div>
              )}
            </div>
          </DropZone>
        ))}
        {sections.every((s) => s.items.length === 0) && (
          <div className="text-bungie-muted/50 py-8 text-center text-xs">—</div>
        )}
      </div>
    </div>
  )
}
