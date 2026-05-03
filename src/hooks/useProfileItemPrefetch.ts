import { useMemo } from "react";
import { usePrefetchItemDefs } from "./usePrefetchItemDefs";
import { useProfile } from "./useProfile";

/**
 * Collects every item hash currently visible on the user's profile (vault,
 * character inventory + equipment, seasonal currencies) and batches a
 * prefetch of their DestinyInventoryItemDefinition into React Query cache.
 *
 * Called once at the top of the Layout so Dashboard, Inventory, Vendors,
 * LootModal etc. all render with cache-hit icons — no loading spinners.
 */
export function useProfileItemPrefetch() {
  const { profile } = useProfile();

  const hashes = useMemo<number[]>(() => {
    const data = profile.data;
    if (!data) return [];
    const out: number[] = [];

    // Vault inventory
    const vault = data.profileInventory?.data?.items ?? [];
    for (const it of vault) if (it.itemHash) out.push(it.itemHash);

    // Currencies (displayed on dashboard)
    const currencies = data.profileCurrencies?.data?.items ?? [];
    for (const it of currencies) if (it.itemHash) out.push(it.itemHash);

    // Per-character inventory + equipped
    const charInv = data.characterInventories?.data ?? {};
    for (const id of Object.keys(charInv)) {
      for (const it of charInv[id].items ?? []) {
        if (it.itemHash) out.push(it.itemHash);
      }
    }
    const charEq = data.characterEquipment?.data ?? {};
    for (const id of Object.keys(charEq)) {
      for (const it of charEq[id].items ?? []) {
        if (it.itemHash) out.push(it.itemHash);
      }
    }
    return out;
  }, [profile.data]);

  usePrefetchItemDefs(hashes);
}