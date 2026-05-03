import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getItemDef } from "@/api/itemDef";
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";

/**
 * Batch-prefetches a list of inventory item definitions into the TanStack
 * Query cache so subsequent `useItemDef(hash)` hits are synchronous.
 *
 * - Deduplicates hashes
 * - Chunks into batches of 10 concurrent requests to avoid Bungie.net rate
 *   limiting while still being much faster than serial fetches
 * - Skips hashes that are already cached
 */
export function usePrefetchItemDefs(hashes: (number | undefined | null)[]) {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";

  useEffect(() => {
    const uniq = Array.from(
      new Set(
        hashes.filter(
          (h): h is number => typeof h === "number" && h > 0 && Number.isFinite(h)
        )
      )
    );
    if (!uniq.length) return;

    // Only prefetch hashes not already in cache.
    const missing = uniq.filter((hash) => {
      return !qc.getQueryData<DestinyInventoryItemDefinition>([
        "itemDef",
        hash,
        locale,
      ]);
    });
    if (!missing.length) return;

    let cancelled = false;
    const BATCH = 10;

    (async () => {
      for (let i = 0; i < missing.length; i += BATCH) {
        if (cancelled) return;
        const chunk = missing.slice(i, i + BATCH);
        await Promise.allSettled(
          chunk.map((hash) =>
            qc.prefetchQuery({
              queryKey: ["itemDef", hash, locale],
              queryFn: () => getItemDef(hash, locale),
              staleTime: Infinity,
              gcTime: Infinity,
            })
          )
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashes.join(","), locale]);
}