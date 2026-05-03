/**
 * Loads the full DestinyInventoryItemDefinition table and keeps it around.
 *
 * Caching layers (in order of speed):
 *   1. TanStack Query in-memory cache — hits if the user has already loaded
 *      the catalog in this session (instant).
 *   2. IndexedDB — survives app restarts, keyed by manifest version + locale.
 *      Typical hit: ~200-400ms to read + parse 40MB from disk.
 *   3. Network fetch from Bungie — only on first run or after a manifest
 *      version bump. ~5-30s depending on connection.
 *
 * Also exposes a `usePrefetchItemCatalog` hook so the Layout can kick off
 * the load in the background right after login, making /database instant.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { bungieGet } from "@/api/bungie";
import {
  readCachedCatalog,
  writeCachedCatalog,
  type ItemTable,
} from "@/lib/catalogCache";

interface ManifestInfo {
  version: string;
  jsonWorldComponentContentPaths: Record<string, Record<string, string>>;
}

async function fetchItemTable(locale: string): Promise<ItemTable> {
  const info = await bungieGet<ManifestInfo>("/Destiny2/Manifest/", {
    auth: false,
  });

  // Fast path: hit IndexedDB first.
  const cached = await readCachedCatalog(info.version, locale);
  if (cached) return cached;

  const path =
    info.jsonWorldComponentContentPaths[locale]
      ?.DestinyInventoryItemDefinition ??
    info.jsonWorldComponentContentPaths["en"]
      ?.DestinyInventoryItemDefinition;
  if (!path) throw new Error("Manifest path introuvable");

  const data = await invoke<ItemTable>("bungie_fetch_raw", { path });
  // Fire-and-forget — caching is an optimization.
  void writeCachedCatalog(info.version, locale, data);
  return data;
}

function catalogQueryKey(locale: string) {
  return ["itemCatalog", locale] as const;
}

export function useItemCatalog() {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  return useQuery({
    queryKey: catalogQueryKey(locale),
    queryFn: () => fetchItemTable(locale),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Kicks off the catalog load in the background so navigating to /database
 * shows results instantly. Safe to call multiple times — TanStack dedupes.
 */
export function usePrefetchItemCatalog() {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  useEffect(() => {
    qc.prefetchQuery({
      queryKey: catalogQueryKey(locale),
      queryFn: () => fetchItemTable(locale),
      staleTime: Infinity,
    });
  }, [qc, locale]);
}