import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useUiStore } from "@/store/ui";
import { ItemTile } from "@/pages/inventory/ItemTile";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

export function RecentDrops() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const selectItem = useUiStore((s) => s.selectItem);

  const recent = useMemo(() => {
    const out: { item: DestinyItemComponent; ts: number; owner: string | null }[] = [];
    if (!profile.data) return [];
    const chars = profile.data.characters?.data ?? {};
    const itemInstances = profile.data.itemComponents?.instances?.data ?? {};
    const allInstanced: { item: DestinyItemComponent; owner: string | null }[] = [];

    for (const cid of Object.keys(chars)) {
      for (const it of profile.data.characterEquipment?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) allInstanced.push({ item: it, owner: cid });
      }
      for (const it of profile.data.characterInventories?.data?.[cid]?.items ?? []) {
        if (it.itemInstanceId) allInstanced.push({ item: it, owner: cid });
      }
    }
    for (const it of profile.data.profileInventory?.data?.items ?? []) {
      if (it.itemInstanceId) allInstanced.push({ item: it, owner: null });
    }

    // No drop date in API, so we sort by itemInstanceId desc (newer ids = more recent)
    // since instance ids are monotonically increasing snowflake-like
    for (const x of allInstanced) {
      const inst = x.item.itemInstanceId
        ? itemInstances[x.item.itemInstanceId]
        : undefined;
      // Filter to legendary+ for relevance
      const power = inst?.primaryStat?.value ?? 0;
      if (power < 1) continue;
      out.push({
        item: x.item,
        ts: Number(x.item.itemInstanceId ?? 0),
        owner: x.owner,
      });
    }
    out.sort((a, b) => b.ts - a.ts);
    return out.slice(0, 18);
  }, [profile.data]);

  if (recent.length === 0) return null;

  return (
    <section>
      <h3 className="section-title mb-3">{t("dashboard.recentDrops")}</h3>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}
      >
        {recent.map((r) => (
          <button
            key={r.item.itemInstanceId}
            onClick={() => selectItem(r.item)}
            className="aspect-square"
          >
            <ItemTile item={r.item} size="md" ownerCharacterId={r.owner} />
          </button>
        ))}
      </div>
    </section>
  );
}