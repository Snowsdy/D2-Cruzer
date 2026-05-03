import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"
import { useProfile } from "@/hooks/useProfile"
import { useSearchStore } from "@/store/search"
import { useTagsStore, TAG_META, type ItemTag } from "@/store/tags"
import { TagIcon } from "@/components/tag-icon"
import { useUiStore } from "@/store/ui"
import { getItemDef } from "@/api/itemDef"
import { parseQuery, matches } from "@/utils/itemFilter"
import { sumArmorStats } from "@/constants/stats"
import type {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
} from "bungie-api-ts/destiny2"

interface Row {
  item: DestinyItemComponent
  def: DestinyInventoryItemDefinition | undefined
  owner: string | null
  power: number
  statTotal: number
  tag: ItemTag | null
}

type SortKey = "name" | "type" | "power" | "tier" | "total" | "tag"

export function Organizer() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const { profile } = useProfile()
  const query = useSearchStore((s) => s.query)
  const tagsState = useTagsStore((s) => s.tags)
  const selectItem = useUiStore((s) => s.selectItem)

  const [sortKey, setSortKey] = useState<SortKey>("power")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Gather all instanced items
  const allItems = useMemo(() => {
    const out: Array<{ item: DestinyItemComponent; owner: string | null }> = []
    if (!profile.data) return out
    const chars = profile.data.characters?.data ?? {}
    for (const cid of Object.keys(chars)) {
      for (const it of profile.data.characterEquipment?.data?.[cid]?.items ??
        []) {
        if (it.itemInstanceId) out.push({ item: it, owner: cid })
      }
      for (const it of profile.data.characterInventories?.data?.[cid]?.items ??
        []) {
        if (it.itemInstanceId) out.push({ item: it, owner: cid })
      }
    }
    for (const it of profile.data.profileInventory?.data?.items ?? []) {
      if (it.itemInstanceId) out.push({ item: it, owner: null })
    }
    return out
  }, [profile.data])

  // Unique item hashes for def fetch
  const uniqHashes = useMemo(
    () => [...new Set(allItems.map((x) => x.item.itemHash))],
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

  const defMap = useMemo(() => {
    const m = new Map<number, DestinyInventoryItemDefinition>()
    uniqHashes.forEach((h, i) => {
      const d = defQueries[i]?.data
      if (d) m.set(h, d)
    })
    return m
  }, [uniqHashes, defQueries])

  const itemStats = useMemo(() => {
    return profile.data?.itemComponents?.stats?.data ?? {}
  }, [profile.data])
  const itemInstances = useMemo(() => {
    return profile.data?.itemComponents?.instances?.data ?? {}
  }, [profile.data])

  const rows: Row[] = useMemo(() => {
    const predicates = query.trim() ? parseQuery(query) : []
    return allItems
      .map(({ item, owner }): Row | null => {
        const def = defMap.get(item.itemHash)
        // Only weapons + armor for organizer
        if (def && def.itemType !== 2 && def.itemType !== 3) return null
        const power =
          (item.itemInstanceId
            ? itemInstances[item.itemInstanceId]?.primaryStat?.value
            : undefined) ?? 0
        const statTotal = item.itemInstanceId
          ? sumArmorStats(itemStats[item.itemInstanceId]?.stats)
          : 0
        const tag: ItemTag | null = item.itemInstanceId
          ? (tagsState[item.itemInstanceId] ?? null)
          : null
        if (
          !matches(predicates, item, {
            def,
            stats: item.itemInstanceId
              ? itemStats[item.itemInstanceId]?.stats
              : undefined,
            power,
            tag,
            equipped: false,
            inVault: owner === null,
          })
        )
          return null
        return { item, owner, def, power, statTotal, tag }
      })
      .filter((r): r is Row => r !== null)
  }, [allItems, defMap, itemStats, itemInstances, tagsState, query])

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const get = (r: Row): string | number => {
        switch (sortKey) {
          case "name":
            return r.def?.displayProperties?.name ?? ""
          case "type":
            return r.def?.itemTypeDisplayName ?? ""
          case "power":
            return r.power
          case "total":
            return r.statTotal
          case "tier":
            return r.def?.inventory?.tierType ?? 0
          case "tag":
            return r.tag ?? ""
        }
      }
      const av = get(a)
      const bv = get(b)
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [rows, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(k)
      setSortDir(k === "name" || k === "type" || k === "tag" ? "asc" : "desc")
    }
  }

  const TIER_COLOR: Record<number, string> = {
    5: "text-purple-300",
    6: "text-yellow-300",
  }

  const headerCell = (k: SortKey, label: string, right?: boolean) => (
    <th
      onClick={() => toggleSort(k)}
      className={`text-bungie-muted cursor-pointer px-3 py-2 text-[10px] tracking-widest uppercase select-none hover:text-white ${
        right ? "text-right" : "text-left"
      }`}
    >
      {label}
      {sortKey === k && (
        <span className="text-bungie-accent ml-1">
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </th>
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("organizer.title")}</h2>
        <p className="text-bungie-muted text-sm">
          {t("organizer.count", { n: sorted.length })}
        </p>
      </div>
      <div className="panel overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-bungie-panel/95 sticky top-0 backdrop-blur">
            <tr className="border-bungie-border border-b">
              <th className="w-10 px-3 py-2" />
              {headerCell("name", t("organizer.col.name"))}
              {headerCell("type", t("organizer.col.type"))}
              {headerCell("power", t("organizer.col.power"), true)}
              {headerCell("total", t("organizer.col.total"), true)}
              {headerCell("tier", t("organizer.col.tier"))}
              {headerCell("tag", t("organizer.col.tag"))}
              <th className="text-bungie-muted px-3 py-2 text-[10px] tracking-widest uppercase">
                {t("organizer.col.location")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const icon = r.def?.displayProperties?.icon
              const name = r.def?.displayProperties?.name ?? ""
              const type = r.def?.itemTypeDisplayName ?? ""
              const tierCls =
                TIER_COLOR[r.def?.inventory?.tierType ?? 0] ?? "text-white"
              const tagMeta =
                r.tag && r.tag in TAG_META
                  ? TAG_META[r.tag as keyof typeof TAG_META]
                  : null
              return (
                <tr
                  key={r.item.itemInstanceId}
                  onClick={() => selectItem(r.item)}
                  className="border-bungie-border/30 hover:bg-bungie-accent/5 cursor-pointer border-b transition-colors"
                >
                  <td className="py-1.5 pr-0 pl-3">
                    {icon && (
                      <img
                        src={`https://www.bungie.net${icon}`}
                        alt=""
                        className="border-bungie-border h-8 w-8 rounded border"
                      />
                    )}
                  </td>
                  <td className={`px-3 py-1.5 font-medium ${tierCls}`}>
                    {name}
                  </td>
                  <td className="text-bungie-muted px-3 py-1.5">{type}</td>
                  <td className="text-bungie-accent px-3 py-1.5 text-right font-semibold tabular-nums">
                    {r.power || "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {r.statTotal || "—"}
                  </td>
                  <td className="text-bungie-muted px-3 py-1.5 text-xs">
                    {r.def?.inventory?.tierTypeName ?? ""}
                  </td>
                  <td className="px-3 py-1.5">
                    {tagMeta && r.tag && (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: tagMeta.color }}
                      >
                        <TagIcon tag={r.tag} size={12} />
                        {tagMeta.label}
                      </span>
                    )}
                  </td>
                  <td className="text-bungie-muted px-3 py-1.5 text-xs">
                    {r.owner === null
                      ? t("inventory.vault")
                      : t("organizer.onChar")}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
