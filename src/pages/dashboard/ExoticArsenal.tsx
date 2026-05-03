/* eslint-disable react-hooks/static-components */
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useUiStore } from "@/store/ui";
import { getItemDef } from "@/api/itemDef";
import { TIER } from "@/constants/bungieHashes";
import type {
  DestinyItemComponent,
  DestinyInventoryItemDefinition,
} from "bungie-api-ts/destiny2";

const EXOTIC_TIER = TIER.Exotic;
const PREVIEW_CAP = 18;

interface EnrichedItem {
  item: DestinyItemComponent;
  def: DestinyInventoryItemDefinition;
}

type Mode = "weapons" | "armor";

export function ExoticArsenal() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile } = useProfile();
  const selectItem = useUiStore((s) => s.selectItem);
  const [mode, setMode] = useState<Mode>("weapons");
  const [expanded, setExpanded] = useState(false);

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
  const defMap = new Map<number, DestinyInventoryItemDefinition>();
  uniqHashes.forEach((h, i) => {
    const d = defQueries[i]?.data;
    if (d) defMap.set(h, d);
  });

  const exotics: EnrichedItem[] = allItems
    .map((item) => {
      const def = defMap.get(item.itemHash);
      if (!def) return null;
      if (def.inventory?.tierType !== EXOTIC_TIER) return null;
      if (def.itemType !== 2 && def.itemType !== 3) return null;
      return { item, def };
    })
    .filter((x): x is EnrichedItem => x !== null);

  const uniqueByHash = new Map<number, EnrichedItem>();
  for (const e of exotics) {
    if (!uniqueByHash.has(e.item.itemHash)) uniqueByHash.set(e.item.itemHash, e);
  }
  const weapons = [...uniqueByHash.values()].filter((e) => e.def.itemType === 3);
  const armor = [...uniqueByHash.values()].filter((e) => e.def.itemType === 2);

  if (weapons.length === 0 && armor.length === 0) return null;

  const items = mode === "weapons" ? weapons : armor;
  const visible = expanded ? items : items.slice(0, PREVIEW_CAP);

  const SegmentButton = ({
    value,
    label,
    count,
  }: {
    value: Mode;
    label: string;
    count: number;
  }) => {
    const active = mode === value;
    return (
      <button
        onClick={() => {
          setMode(value);
          setExpanded(false);
        }}
        className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
          active
            ? "bg-linear-to-r from-yellow-400 to-amber-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            : "text-yellow-300/70 hover:text-yellow-300"
        }`}
      >
        {label}
        <span
          className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${
            active ? "bg-black/20" : "bg-yellow-400/10"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-full border border-yellow-400/40 bg-black/30">
          <SegmentButton
            value="weapons"
            label={t("dashboard.exoticWeapons")}
            count={weapons.length}
          />
          <SegmentButton
            value="armor"
            label={t("dashboard.exoticArmor")}
            count={armor.length}
          />
        </div>

        {items.length > PREVIEW_CAP && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-yellow-300 hover:underline font-semibold"
          >
            {expanded
              ? `${t("common.less")} ↑`
              : `${t("common.more")} (+${items.length - PREVIEW_CAP}) ↓`}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="panel p-6 text-center text-bungie-muted">
          {t("dashboard.noExotics")}
        </div>
      ) : (
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))" }}
        >
          {visible.map((e) => {
            const icon = e.def.displayProperties?.icon;
            const watermark = e.def.iconWatermark;
            return (
              <button
                key={e.item.itemInstanceId ?? e.item.itemHash}
                onClick={() => selectItem(e.item)}
                className="relative aspect-square rounded-md border-2 border-yellow-400/70 bg-black overflow-hidden hover:border-yellow-300 hover:shadow-[0_0_16px_rgba(250,204,21,0.5)] transition-all group"
                title={e.def.displayProperties?.name}
              >
                {icon && (
                  <img
                    src={`https://www.bungie.net${icon}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                {watermark && (
                  <img
                    src={`https://www.bungie.net${watermark}`}
                    alt=""
                    className="absolute inset-0 w-full h-full pointer-events-none object-cover"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/95 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[9px] text-yellow-300 font-bold truncate">
                    {e.def.displayProperties?.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}