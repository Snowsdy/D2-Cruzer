import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { useManifestStore } from "@/store/manifest";
import { ItemTile } from "./ItemTile";
import { useItemActions } from "@/hooks/useItemActions";
import { getItemDef } from "@/api/itemDef";
import {
  EQUIPPED_BUCKETS,
  WEAPON_BUCKETS,
  ARMOR_BUCKETS,
} from "@/constants/buckets";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

const GEAR_BUCKETS = [...WEAPON_BUCKETS, ...ARMOR_BUCKETS];

// Rounds down avg the way Bungie does.
function avgPower(primaryStats: Record<string, { primaryStat?: { value: number } }>, items: DestinyItemComponent[]): number {
  const values = items
    .map((it) => it.itemInstanceId && primaryStats[it.itemInstanceId]?.primaryStat?.value)
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return 0;
  return Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
}

export function MaxPower() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile, activeCharacterId } = useProfile();
  const manifest = useManifestStore((s) => s.manifest);
  const actions = useItemActions();

  // Vault items all share bucketHash=GeneralVault — we need their defs to
  // know each item's natural slot (inventory.bucketTypeHash).
  const vaultRaw = useMemo(() => {
    return profile.data?.profileInventory?.data?.items ?? []
  }, [profile.data]);
  
  const vaultHashes = useMemo(() => {
    const set = new Set<number>();
    for (const it of vaultRaw) set.add(it.itemHash);
    return [...set];
  }, [vaultRaw]);

  const vaultDefQueries = useQueries({
    queries: vaultHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });
  const vaultDefMap = useMemo(() => {
    const m = new Map<number, number>();
    vaultHashes.forEach((h, i) => {
      const d = vaultDefQueries[i]?.data;
      if (d?.inventory?.bucketTypeHash) m.set(h, d.inventory.bucketTypeHash);
    });
    return m;
  }, [vaultHashes, vaultDefQueries]);

  const { bestPerSlot, currentPower, targetPower } = useMemo(() => {
    const primaryStats = profile.data?.itemComponents?.instances?.data ?? {};

    // Gather all eligible items across all characters + vault
    const allCandidates = new Map<number, DestinyItemComponent[]>(); // bucketHash → items
    const chars = profile.data?.characters?.data ?? {};
    for (const cid of Object.keys(chars)) {
      for (const it of profile.data?.characterEquipment?.data?.[cid]?.items ?? []) {
        if (GEAR_BUCKETS.includes(it.bucketHash as never)) {
          const arr = allCandidates.get(it.bucketHash) ?? [];
          arr.push(it);
          allCandidates.set(it.bucketHash, arr);
        }
      }
      for (const it of profile.data?.characterInventories?.data?.[cid]?.items ?? []) {
        if (GEAR_BUCKETS.includes(it.bucketHash as never)) {
          const arr = allCandidates.get(it.bucketHash) ?? [];
          arr.push(it);
          allCandidates.set(it.bucketHash, arr);
        }
      }
    }
    // Vault: re-route each item to its natural slot via the def.
    for (const it of vaultRaw) {
      const slot = vaultDefMap.get(it.itemHash);
      if (slot && GEAR_BUCKETS.includes(slot as never)) {
        const arr = allCandidates.get(slot) ?? [];
        arr.push(it);
        allCandidates.set(slot, arr);
      }
    }

    const bestPerSlot: Array<{
      bucketHash: number;
      item: DestinyItemComponent | null;
      power: number;
    }> = GEAR_BUCKETS.map((h) => {
      const candidates = allCandidates.get(h) ?? [];
      let best: DestinyItemComponent | null = null;
      let bestPower = 0;
      for (const c of candidates) {
        const p = c.itemInstanceId
          ? primaryStats[c.itemInstanceId]?.primaryStat?.value ?? 0
          : 0;
        if (p > bestPower) {
          bestPower = p;
          best = c;
        }
      }
      return { bucketHash: h, item: best, power: bestPower };
    });

    // Current equipped avg
    const currentEquipped =
      activeCharacterId && profile.data
        ? (profile.data.characterEquipment?.data?.[activeCharacterId]?.items ?? [])
            .filter((it) => EQUIPPED_BUCKETS.includes(it.bucketHash as never))
            .filter((it) => GEAR_BUCKETS.includes(it.bucketHash as never))
        : [];
    const currentPower = avgPower(primaryStats, currentEquipped);
    const targetPower = Math.floor(
      bestPerSlot.reduce((s, e) => s + e.power, 0) / GEAR_BUCKETS.length
    );

    return { bestPerSlot, currentPower, targetPower };
  }, [profile.data, activeCharacterId, vaultRaw, vaultDefMap]);

  const equipAll = async () => {
    if (!activeCharacterId) return;
    for (const slot of bestPerSlot) {
      if (!slot.item?.itemInstanceId) continue;
      try {
        await actions.moveToCharacter.mutateAsync({
          itemInstanceId: slot.item.itemInstanceId,
          itemReferenceHash: slot.item.itemHash,
          fromCharacterId: null, // force re-transfer path
          toCharacterId: activeCharacterId,
        });
        await actions.equip.mutateAsync({
          itemInstanceId: slot.item.itemInstanceId,
          characterId: activeCharacterId,
        });
      } catch (e) {
        console.error("Max power equip failed for slot", slot.bucketHash, e);
      }
    }
  };

  const busy = actions.moveToCharacter.isPending || actions.equip.isPending;
  const delta = targetPower - currentPower;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("maxPower.title")}</h2>
          <p className="text-sm text-bungie-muted">{t("maxPower.subtitle")}</p>
        </div>
        <button
          onClick={equipAll}
          disabled={busy || delta <= 0}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? t("common.loading") : t("maxPower.equipAll")}
        </button>
      </div>

      <div className="stagger grid gap-4 md:grid-cols-3">
        <div className="panel p-4">
          <div className="text-[10px] uppercase tracking-widest text-bungie-muted">
            {t("maxPower.current")}
          </div>
          <div className="text-4xl font-bold text-white mt-1">◆ {currentPower}</div>
        </div>
        <div className="panel p-4 border-bungie-accent/50">
          <div className="text-[10px] uppercase tracking-widest text-bungie-accent">
            {t("maxPower.target")}
          </div>
          <div className="text-4xl font-bold text-gradient-warm mt-1">
            ◆ {targetPower}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[10px] uppercase tracking-widest text-bungie-muted">
            {t("maxPower.delta")}
          </div>
          <div
            className={`text-4xl font-bold mt-1 ${
              delta > 0 ? "text-green-400" : "text-white/50"
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {bestPerSlot.map((slot) => {
          const name =
            manifest?.DestinyInventoryBucketDefinition[slot.bucketHash]
              ?.displayProperties?.name ?? "";
          return (
            <div key={slot.bucketHash} className="panel p-3 flex items-center gap-3">
              {slot.item ? (
                <ItemTile item={slot.item} size="md" />
              ) : (
                <div className="w-16 h-16 rounded-md border-2 border-dashed border-bungie-border" />
              )}
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-bungie-muted truncate">
                  {name}
                </div>
                <div className="text-lg font-semibold text-bungie-accent mt-0.5">
                  ◆ {slot.power}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}