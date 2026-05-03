import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useUiStore } from "@/store/ui";
import { getItemDef } from "@/api/itemDef";
import { TIER } from "@/constants/bungieHashes";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

const EXOTIC_TIER = TIER.Exotic;

export function ExoticHero() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile } = useProfile();
  const selectItem = useUiStore((s) => s.selectItem);

  // Collect all instanced items across all chars + vault
  const allItems: DestinyItemComponent[] = (() => {
    if (!profile.data) return [];
    const out: DestinyItemComponent[] = [];
    const chars = profile.data.characters?.data ?? {};
    for (const cid of Object.keys(chars)) {
      for (const it of profile.data.characterEquipment?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) out.push(it);
      }
      for (const it of profile.data.characterInventories?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) out.push(it);
      }
    }
    for (const it of profile.data.profileInventory?.data?.items ?? []) {
      if (it.itemInstanceId) out.push(it);
    }
    return out;
  })();

  const uniqHashes = [...new Set(allItems.map((it) => it.itemHash))];
  const defQueries = useQueries({
    queries: uniqHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

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
    );

  if (exoticCandidates.length === 0) return null;

  // Pick a stable one per day (changes daily but consistent across refreshes)
  const dayKey = Math.floor(new Date().getTime() / 86400000);
  const pick = exoticCandidates[dayKey % exoticCandidates.length];
  const heroItem = pick.it;
  const heroDef = pick.def;
  if (!heroDef) return null;

  const screenshot = heroDef.screenshot
    ? `https://www.bungie.net${heroDef.screenshot}`
    : null;
  const icon = heroDef.displayProperties?.icon;
  const watermark = heroDef.iconWatermark;

  return (
    <button
      onClick={() => selectItem(heroItem)}
      className="relative rounded-2xl overflow-hidden panel w-full text-left group"
      style={{
        backgroundImage: screenshot
          ? `linear-gradient(90deg, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.6) 50%, rgba(7,7,13,0.2) 100%), url(${screenshot})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="p-8 flex items-center gap-6 min-h-70">
        <div className="relative w-32 h-32 shrink-0">
          {icon && (
            <img
              src={`https://www.bungie.net${icon}`}
              alt=""
              className="w-full h-full rounded-lg border-2 border-yellow-400 shadow-[0_0_32px_rgba(250,204,21,0.45)] group-hover:shadow-[0_0_48px_rgba(250,204,21,0.6)] transition-shadow"
            />
          )}
          {watermark && (
            <img
              src={`https://www.bungie.net${watermark}`}
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-yellow-300/80">
            {t("dashboard.exoticSpotlight")}
          </div>
          <h2 className="text-4xl font-extrabold text-yellow-300 mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] leading-tight">
            {heroDef.displayProperties?.name}
          </h2>
          <div className="text-sm text-white/70 mt-1">
            {heroDef.itemTypeDisplayName}
          </div>
          {heroDef.flavorText && (
            <p className="text-sm italic text-white/60 mt-4 max-w-lg line-clamp-3 border-l-2 border-yellow-400/40 pl-3">
              {heroDef.flavorText}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}