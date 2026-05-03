import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { getItemDef } from "@/api/itemDef";

// Well-known currency item hashes
const CURRENCY_HASHES = [
  3159615086, // Glimmer
  1022552290, // Legendary Shards (legacy)
  2817410917, // Bright Dust
  353704689, // Strange Coins (legacy)
  2534352370, // Legendary Marks (legacy)
  3467984096, // Enhancement Prisms
  4257549984, // Enhancement Cores
  4257549985, // Ascendant Shards
];

export function Currencies() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile } = useProfile();

  const vault = profile.data?.profileInventory?.data?.items ?? [];
  const currencyQuantities = new Map<number, number>();
  for (const it of vault) {
    if (CURRENCY_HASHES.includes(it.itemHash)) {
      currencyQuantities.set(
        it.itemHash,
        (currencyQuantities.get(it.itemHash) ?? 0) + (it.quantity ?? 0)
      );
    }
  }

  const hashes = [...currencyQuantities.keys()];
  const defQueries = useQueries({
    queries: hashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  if (hashes.length === 0) return null;

  return (
    <div className="panel p-4">
      <h3 className="section-title mb-3">{t("dashboard.currencies")}</h3>
      <div className="flex flex-wrap gap-5">
        {hashes.map((h, i) => {
          const def = defQueries[i]?.data;
          const icon = def?.displayProperties?.icon;
          const name = def?.displayProperties?.name ?? "";
          const qty = currencyQuantities.get(h) ?? 0;
          return (
            <div key={h} className="flex items-center gap-2">
              {icon && (
                <img
                  src={`https://www.bungie.net${icon}`}
                  alt=""
                  className="w-8 h-8 rounded border border-bungie-border"
                />
              )}
              <div>
                <div className="text-lg font-bold tabular-nums leading-none">
                  {qty.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-bungie-muted mt-0.5 truncate max-w-30">
                  {name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}