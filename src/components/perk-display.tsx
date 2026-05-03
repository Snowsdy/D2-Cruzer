import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"
import { getItemDef } from "@/api/itemDef"
import { isCosmeticPlug, isCatalystPlug } from "@/utils/itemClassify"
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2"

interface Props {
  /** Item hashes currently plugged into this item's sockets (ordered). */
  plugHashes: number[]
  /** Is the parent item exotic tier? Adds the catalyst placeholder banner. */
  isExotic?: boolean
  locale: string
}

export function PerksDisplay({ plugHashes, isExotic, locale }: Props) {
  const { t } = useTranslation()
  const uniqueHashes = useMemo(
    () => Array.from(new Set(plugHashes.filter((h) => h > 0))),
    [plugHashes]
  )

  const plugQueries = useQueries({
    queries: uniqueHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const plugMap = useMemo(() => {
    const m = new Map<number, DestinyInventoryItemDefinition>()
    uniqueHashes.forEach((h, i) => {
      const d = plugQueries[i]?.data
      if (d) m.set(h, d)
    })
    return m
  }, [uniqueHashes, plugQueries])

  const plugs = plugHashes
    .map((h) => plugMap.get(h))
    .filter((p): p is DestinyInventoryItemDefinition => !!p)

  const mainPerks = plugs.filter(
    (p) => !isCosmeticPlug(p.plug?.plugCategoryIdentifier)
  )
  const catalyst = plugs.find((p) =>
    isCatalystPlug(p.plug?.plugCategoryIdentifier)
  )

  if (mainPerks.length === 0 && !isExotic) return null

  return (
    <>
      {mainPerks.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs tracking-widest text-white/50 uppercase">
            {t("itemPreview.perks")}
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {mainPerks.map((p, i) => {
              const name = p.displayProperties?.name ?? ""
              const desc = p.displayProperties?.description ?? ""
              const icon = p.displayProperties?.icon
              const isCat = isCatalystPlug(p.plug?.plugCategoryIdentifier)
              return (
                <div
                  key={`${p.hash}-${i}`}
                  className={`flex items-start gap-2 rounded border p-2 ${
                    isCat
                      ? "border-yellow-400/50 bg-yellow-400/5"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  {icon && (
                    <img
                      src={`https://www.bungie.net${icon}`}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate text-xs font-semibold text-white">
                      {name}
                      {isCat && (
                        <span className="rounded border border-yellow-400/40 bg-yellow-400/20 px-1 text-[8px] tracking-widest text-yellow-200 uppercase">
                          {t("itemPreview.catalyst")}
                        </span>
                      )}
                    </div>
                    {desc && (
                      <div className="text-bungie-muted line-clamp-2 text-[10px]">
                        {desc}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isExotic && !catalyst && (
        <div className="mt-4">
          <div className="text-[10px] tracking-widest text-yellow-300/80 uppercase">
            ★ {t("itemPreview.catalyst")}
          </div>
          <div className="text-bungie-muted mt-1 text-xs">
            {t("itemPreview.catalystHint")}
          </div>
        </div>
      )}
    </>
  )
}
