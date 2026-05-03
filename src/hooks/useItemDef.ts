import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getItemDef } from "@/api/itemDef";
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";

export function useItemDef(hash: number | undefined) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  return useQuery<DestinyInventoryItemDefinition>({
    queryKey: ["itemDef", hash, locale],
    queryFn: () => getItemDef(hash!, locale),
    enabled: !!hash,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}