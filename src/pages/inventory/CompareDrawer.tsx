import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { useCompareStore } from "@/store/compare";
import { useProfile } from "@/hooks/useProfile";
import { useManifestStore } from "@/store/manifest";
import { getItemDef } from "@/api/itemDef";
import { ARMOR_STAT_ORDER } from "@/constants/stats";

export function CompareDrawer() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { items, isOpen, setOpen, remove, clear } = useCompareStore();
  const { profile } = useProfile();
  const manifest = useManifestStore((s) => s.manifest);

  const defQueries = useQueries({
    queries: items.map((it) => ({
      queryKey: ["itemDef", it.itemHash, locale],
      queryFn: () => getItemDef(it.itemHash, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const itemStats = profile.data?.itemComponents?.stats?.data ?? {};
  const itemInstances = profile.data?.itemComponents?.instances?.data ?? {};

  // Open automatically when ≥ 2 items
  if (items.length > 0 && !isOpen) setOpen(true);

  if (!isOpen || items.length === 0) {
    if (items.length === 0) return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 btn-primary shadow-glow-lg"
      >
        Compare ({items.length})
      </button>
    );
  }

  // Collect all stat hashes present across compared items
  const statHashes = new Set<number>();
  for (const it of items) {
    if (it.itemInstanceId) {
      const s = itemStats[it.itemInstanceId]?.stats;
      if (s) Object.keys(s).forEach((h) => statHashes.add(Number(h)));
    }
  }
  // Prefer ordered armor stats first, then the rest sorted
  const sortedStatHashes = [
    ...ARMOR_STAT_ORDER.filter((h) => statHashes.has(h)),
    ...[...statHashes].filter((h) => !ARMOR_STAT_ORDER.includes(h)),
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bungie-accent/40 bg-bungie-bg/95 backdrop-blur-lg shadow-[0_-10px_40px_rgba(243,7,94,0.15)] max-h-[55vh] overflow-auto">
      <div className="flex items-center justify-between px-5 py-3 border-b border-bungie-border sticky top-0 bg-bungie-bg/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <h3 className="font-bold">{t("compare.title")}</h3>
          <span className="text-xs text-bungie-muted">{items.length} / 6</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clear}
            className="text-xs text-bungie-muted hover:text-red-400"
          >
            {t("compare.clear")}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-white/70 hover:text-white text-lg leading-none px-2"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-bungie-muted">
                {t("compare.item")}
              </th>
              {items.map((it, i) => {
                const def = defQueries[i]?.data;
                const name = def?.displayProperties?.name ?? "…";
                const typeName = def?.itemTypeDisplayName ?? "";
                const icon = def?.displayProperties?.icon;
                return (
                  <th key={it.itemInstanceId} className="py-2 px-3 text-left min-w-42.5">
                    <div className="flex items-start gap-2">
                      {icon && (
                        <img
                          src={`https://www.bungie.net${icon}`}
                          alt=""
                          className="w-10 h-10 rounded border border-bungie-border shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        <div className="text-[10px] text-bungie-muted truncate">
                          {typeName}
                        </div>
                      </div>
                      <button
                        onClick={() => remove(it.itemInstanceId!)}
                        className="text-bungie-muted hover:text-red-400 text-sm leading-none"
                        title={t("compare.remove")}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-bungie-border/40">
              <td className="py-2 px-3 text-[10px] uppercase tracking-widest text-bungie-muted">
                {t("inventory.power")}
              </td>
              {items.map((it) => {
                const power = it.itemInstanceId
                  ? itemInstances[it.itemInstanceId]?.primaryStat?.value
                  : undefined;
                return (
                  <td
                    key={it.itemInstanceId}
                    className="py-2 px-3 font-semibold text-bungie-accent tabular-nums"
                  >
                    {power ?? "—"}
                  </td>
                );
              })}
            </tr>
            {sortedStatHashes.map((h) => {
              const statName =
                manifest?.DestinyStatDefinition?.[h]?.displayProperties?.name ?? `#${h}`;
              // Compute max for highlight
              const vals = items.map((it) =>
                it.itemInstanceId ? itemStats[it.itemInstanceId]?.stats?.[h]?.value ?? 0 : 0
              );
              const max = Math.max(...vals);
              return (
                <tr key={h} className="border-t border-bungie-border/40">
                  <td className="py-1.5 px-3 text-white/75">{statName}</td>
                  {items.map((it, i) => {
                    const v = vals[i];
                    const isMax = v > 0 && v === max;
                    return (
                      <td
                        key={it.itemInstanceId}
                        className={`py-1.5 px-3 tabular-nums ${
                          isMax ? "text-bungie-accent font-semibold" : "text-white/80"
                        }`}
                      >
                        {v || "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}