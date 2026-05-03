import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProfile } from "@/hooks/useProfile"
import { useManifestStore } from "@/store/manifest"
import { useSearchStore } from "@/store/search"
import { useTagsStore } from "@/store/tags"
import { useQueries } from "@tanstack/react-query"
import { getItemDef } from "@/api/itemDef"
import { ItemTile } from "./ItemTile"
import { IconVault } from "@/components/icon"
import { Dropdown } from "@/components/dropdown"
import { parseQuery, matches } from "@/utils/itemFilter"
import { sumArmorStats } from "@/constants/stats"
import {
  Buckets,
  WEAPON_BUCKETS,
  ARMOR_BUCKETS,
  VAULT_GENERAL_BUCKETS,
} from "@/constants/buckets"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

type Filter = "all" | "weapons" | "armor" | "general"

const FILTER_BUCKETS: Record<Filter, readonly number[]> = {
  all: [...WEAPON_BUCKETS, ...ARMOR_BUCKETS, ...VAULT_GENERAL_BUCKETS],
  weapons: WEAPON_BUCKETS,
  armor: ARMOR_BUCKETS,
  general: VAULT_GENERAL_BUCKETS.filter((h) => h !== Buckets.Subclass),
}

export function Vault() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const { profile } = useProfile()
  const manifest = useManifestStore((s) => s.manifest)
  const query = useSearchStore((s) => s.query)
  const tagsState = useTagsStore((s) => s.tags)
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<"power" | "name" | "type">("power")

  // Raw list of profile-inventory items (everything in the vault — Bungie
  // reports them all with bucketHash = GeneralVault (138197802)).
  const rawItems = useMemo(() => {
    return profile.data?.profileInventory?.data?.items ?? []
  }, [profile.data])

  // Unique hashes for def fetching — we need defs to know each item's
  // natural slot (inventory.bucketTypeHash) since the runtime bucketHash
  // is the vault bucket for everything in there.
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

  // Re-group vault items by their natural slot bucket (from the def), so
  // weapons land in Kinetic/Energy/Power, armor in Helmet/Arms/… etc.
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

  // Build buckets with filtered + sorted items
  const sections = useMemo(() => {
    const predicates = query.trim() ? parseQuery(query) : []
    return FILTER_BUCKETS[filter]
      .map((bucketHash) => {
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
        // Sort
        const sorted = [...items].sort((a, b) => {
          if (sort === "power") {
            const pa = a.itemInstanceId
              ? (itemInstances[a.itemInstanceId]?.primaryStat?.value ?? 0)
              : 0
            const pb = b.itemInstanceId
              ? (itemInstances[b.itemInstanceId]?.primaryStat?.value ?? 0)
              : 0
            if (pb !== pa) return pb - pa
            // tiebreak on armor total
            const ta = a.itemInstanceId
              ? sumArmorStats(itemStats[a.itemInstanceId]?.stats)
              : 0
            const tb = b.itemInstanceId
              ? sumArmorStats(itemStats[b.itemInstanceId]?.stats)
              : 0
            return tb - ta
          }
          const da = defMap.get(a.itemHash)
          const db = defMap.get(b.itemHash)
          if (sort === "name") {
            return (da?.displayProperties?.name ?? "").localeCompare(
              db?.displayProperties?.name ?? ""
            )
          }
          return (da?.itemTypeDisplayName ?? "").localeCompare(
            db?.itemTypeDisplayName ?? ""
          )
        })
        return { bucketHash, bucketName, items: sorted }
      })
      .filter((s) => s.items.length > 0)
  }, [
    filter,
    vaultItems,
    manifest,
    query,
    defMap,
    itemStats,
    itemInstances,
    tagsState,
    sort,
  ])

  const totalShown = sections.reduce((s, x) => s + x.items.length, 0)
  const totalInVault = rawItems.length

  if (profile.isLoading) {
    return <p className="text-bungie-muted">{t("common.loading")}</p>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            <IconVault size={20} className="text-bungie-accent" />
            {t("inventory.vault")}
            <span className="text-bungie-muted text-sm font-normal tabular-nums">
              {totalShown !== totalInVault
                ? `(${totalShown} / ${totalInVault})`
                : `(${totalInVault})`}
            </span>
          </h2>
          <p className="text-bungie-muted mt-0.5 text-sm">
            {t("vault.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter pills */}
          <div className="bg-bungie-panel/60 border-bungie-border flex gap-1 rounded-full border p-1">
            {(["all", "weapons", "armor", "general"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  filter === f
                    ? "bg-bungie-accent shadow-glow font-semibold text-black"
                    : "text-bungie-text/70 hover:text-white"
                }`}
              >
                {t(`vault.filter.${f}`)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <Dropdown
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            variant="pill"
            size="sm"
            options={[
              { value: "power", label: t("vault.sort.power") },
              { value: "name", label: t("vault.sort.name") },
              { value: "type", label: t("vault.sort.type") },
            ]}
          />
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-bungie-muted">{t("vault.empty")}</p>
      ) : (
        <div className="space-y-5">
          {sections.map((s) => (
            <section key={s.bucketHash} className="panel p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-bungie-accent text-sm font-semibold tracking-wide uppercase">
                  {s.bucketName}
                </h3>
                <span className="text-bungie-muted text-xs tabular-nums">
                  {s.items.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <ItemTile
                    key={
                      it.itemInstanceId ??
                      `${s.bucketHash}-${it.itemHash}-${Math.random()}`
                    }
                    item={it}
                    size="md"
                    ownerCharacterId={null}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
