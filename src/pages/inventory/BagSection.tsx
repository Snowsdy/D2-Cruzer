import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useManifestStore } from "@/store/manifest"
import { ItemTile } from "./ItemTile"
import { WEAPON_BUCKETS, ARMOR_BUCKETS } from "@/constants/buckets"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

interface Props {
  title: string
  items: Map<number, DestinyItemComponent[]>
  ownerCharacterId: string | null
}

type Filter = "all" | "weapons" | "armor"

export function BagSection({ title, items, ownerCharacterId }: Props) {
  const { t } = useTranslation()
  const manifest = useManifestStore((s) => s.manifest)
  const [filter, setFilter] = useState<Filter>("all")

  const buckets =
    filter === "weapons"
      ? WEAPON_BUCKETS
      : filter === "armor"
        ? ARMOR_BUCKETS
        : [...WEAPON_BUCKETS, ...ARMOR_BUCKETS]

  const total = buckets.reduce((s, h) => s + (items.get(h)?.length ?? 0), 0)

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold tracking-tight">
          {title}{" "}
          <span className="text-bungie-muted text-sm font-normal">
            ({total})
          </span>
        </h3>
        <div className="bg-bungie-panel/60 border-bungie-border flex gap-1 rounded-full border p-1">
          {(["all", "weapons", "armor"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                filter === f
                  ? "bg-bungie-accent shadow-glow font-semibold text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {t(`inventory.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {buckets.map((h) => {
          const bucketItems = items.get(h) ?? []
          const name =
            manifest?.DestinyInventoryBucketDefinition[h]?.displayProperties
              ?.name ?? ""
          return (
            <div key={h} className="panel min-h-18 p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-bungie-muted text-[10px] font-medium tracking-[0.18em] uppercase">
                  {name}
                </div>
                {bucketItems.length > 0 && (
                  <div className="text-[10px] text-white/40 tabular-nums">
                    {bucketItems.length}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bucketItems.length === 0 ? (
                  <div className="text-bungie-muted/50 text-xs italic">—</div>
                ) : (
                  bucketItems.map((it) => (
                    <ItemTile
                      key={
                        it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`
                      }
                      item={it}
                      size="sm"
                      ownerCharacterId={ownerCharacterId}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
