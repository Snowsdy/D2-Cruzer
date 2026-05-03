import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { getItemDef } from "@/api/itemDef";
import { ItemTile } from "./ItemTile";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

interface DupeGroup {
  itemHash: number;
  name: string;
  icon: string | undefined;
  copies: Array<{ item: DestinyItemComponent; owner: string | null }>;
}

export function Dupes() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile } = useProfile();

  // Collect all instanced items across all chars + vault
  const allItems: Array<{ item: DestinyItemComponent; owner: string | null }> = useMemo(() => {
    const out: Array<{ item: DestinyItemComponent; owner: string | null }> = [];
    const chars = profile.data?.characters?.data ?? {};
    for (const cid of Object.keys(chars)) {
      for (const it of profile.data?.characterEquipment?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) out.push({ item: it, owner: cid });
      }
      for (const it of profile.data?.characterInventories?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) out.push({ item: it, owner: cid });
      }
    }
    for (const it of profile.data?.profileInventory?.data?.items ?? []) {
      if (it.itemInstanceId) out.push({ item: it, owner: null });
    }
    return out;
  }, [profile.data]);

  // Group by itemHash (same definition = potentially dupe)
  const groups: DupeGroup[] = useMemo(() => {
    const map = new Map<number, DupeGroup>();
    for (const entry of allItems) {
      const hash = entry.item.itemHash;
      const g = map.get(hash) ?? {
        itemHash: hash,
        name: "",
        icon: undefined,
        copies: [],
      };
      g.copies.push(entry);
      map.set(hash, g);
    }
    return [...map.values()].filter((g) => g.copies.length > 1);
  }, [allItems]);

  // Fetch defs for groups in parallel
  const defQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: ["itemDef", g.itemHash, locale],
      queryFn: () => getItemDef(g.itemHash, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const enriched = groups
    .map((g, i) => {
      const def = defQueries[i]?.data;
      // Only show weapons/armor dupes (not currencies/consumables which naturally stack)
      if (def && def.itemType !== 2 && def.itemType !== 3) return null;
      return {
        ...g,
        name: def?.displayProperties?.name ?? "",
        icon: def?.displayProperties?.icon,
        tier: def?.inventory?.tierType ?? 0,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.copies.length - a.copies.length);

  const totalDupes = enriched.reduce((s, g) => s + g.copies.length - 1, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("dupes.title")}</h2>
        <p className="text-sm text-bungie-muted">
          {t("dupes.count", { groups: enriched.length, extras: totalDupes })}
        </p>
      </div>

      {profile.isLoading && <p className="text-bungie-muted">{t("common.loading")}</p>}

      <div className="space-y-3">
        {enriched.map((g) => (
          <div
            key={g.itemHash}
            className="panel p-3 grid gap-4 items-center"
            style={{
              gridTemplateColumns: "minmax(200px, 260px) 1fr",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {g.icon && (
                <img
                  src={`https://www.bungie.net${g.icon}`}
                  alt=""
                  className="w-12 h-12 rounded border border-bungie-border shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{g.name}</div>
                <div className="text-xs text-bungie-muted">
                  {g.copies.length} copies
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {g.copies.map((c, i) => (
                <ItemTile
                  key={c.item.itemInstanceId ?? i}
                  item={c.item}
                  size="sm"
                  ownerCharacterId={c.owner}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {enriched.length === 0 && !profile.isLoading && (
        <p className="text-bungie-muted text-sm">{t("dupes.empty")}</p>
      )}
    </div>
  );
}