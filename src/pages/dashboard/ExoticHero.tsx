import { useQueries } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useProfile } from "@/hooks/useProfile"
import { useUiStore } from "@/store/ui"
import { getItemDef } from "@/api/itemDef"
import { TIER } from "@/constants/bungieHashes"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

const EXOTIC_TIER = TIER.Exotic

export function ExoticHero() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  const { profile } = useProfile()
  const selectItem = useUiStore((s) => s.selectItem)

  // Collect all instanced items across all chars + vault
  const allItems: DestinyItemComponent[] = (() => {
    if (!profile.data) return []
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
  })()

  const uniqHashes = [...new Set(allItems.map((it) => it.itemHash))]
  const defQueries = useQueries({
    queries: uniqHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  // Find exotic weapons WITH a screenshot so the hero looks good
  const exoticCandidates = allItems
    .map((it) => ({
      it,
      def: defQueries[uniqHashes.indexOf(it.itemHash)]?.data,
    }))
    .filter(
      ({ def }) =>
        def?.itemType === 3 &&
        def?.inventory?.tierType === EXOTIC_TIER &&
        !!def.screenshot
    )

  if (exoticCandidates.length === 0) return null

  // Pick a stable one per day (changes daily but consistent across refreshes)
  const dayKey = Math.floor(new Date().getTime() / 86400000)
  const pick = exoticCandidates[dayKey % exoticCandidates.length]
  const heroItem = pick.it
  const heroDef = pick.def
  if (!heroDef) return null

  const screenshot = heroDef.screenshot
    ? `https://www.bungie.net${heroDef.screenshot}`
    : null
  const icon = heroDef.displayProperties?.icon
  const watermark = heroDef.iconWatermark

  return (
    <button
      onClick={() => selectItem(heroItem)}
      className="panel group relative w-full overflow-hidden rounded-2xl text-left"
      style={{
        backgroundImage: screenshot
          ? `linear-gradient(90deg, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.6) 50%, rgba(7,7,13,0.2) 100%), url(${screenshot})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex min-h-70 items-center gap-6 p-8">
        <div className="relative h-32 w-32 shrink-0">
          {icon && (
            <img
              src={`https://www.bungie.net${icon}`}
              alt=""
              className="h-full w-full rounded-lg border-2 border-yellow-400 shadow-[0_0_32px_rgba(250,204,21,0.45)] transition-shadow group-hover:shadow-[0_0_48px_rgba(250,204,21,0.6)]"
            />
          )}
          {watermark && (
            <img
              src={`https://www.bungie.net${watermark}`}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] tracking-[0.3em] text-yellow-300/80 uppercase">
            {t("dashboard.exoticSpotlight")}
          </div>
          <h2 className="mt-2 text-4xl leading-tight font-extrabold text-yellow-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            {heroDef.displayProperties?.name}
          </h2>
          <div className="mt-1 text-sm text-white/70">
            {heroDef.itemTypeDisplayName}
          </div>
          {heroDef.flavorText && (
            <p className="mt-4 line-clamp-3 max-w-lg border-l-2 border-yellow-400/40 pl-3 text-sm text-white/60 italic">
              {heroDef.flavorText}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
