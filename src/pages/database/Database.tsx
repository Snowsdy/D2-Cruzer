/* eslint-disable react-hooks/preserve-manual-memoization */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useItemCatalog } from "@/hooks/useItemCatalog";
import {
  ITEM_TYPE as IT,
  CLASS_TYPE as CLS,
  AMMO_TYPE as AMMO,
  ITEM_CATEGORY_HASH,
} from "@/constants/bungieHashes";
import { isShader } from "@/utils/itemClassify";
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";

// ---------------------------------------------------------------------------
// Bungie item classification — using itemType + itemSubType + classType.
// These are far more reliable than itemCategoryHashes which over-matches
// (perk sockets, placeholder plugs, API-internal dummies all inherit the
// weapon/armor category hashes).
// ---------------------------------------------------------------------------

/**
 * Hide manifest noise that shouldn't appear in a user-facing catalog:
 *   - redacted / blacklisted entries (censored or removed)
 *   - items with no icon (API stubs, deprecated placeholders)
 *   - empty or "[Deprecated]" display names
 */
function isDisplayable(d: DestinyInventoryItemDefinition): boolean {
  if (d.redacted) return false;
  if ((d as unknown as { blacklisted?: boolean }).blacklisted) return false;
  const name = d.displayProperties?.name ?? "";
  if (!name) return false;
  if (/\[deprecated\]|\[unused\]|^classified$/i.test(name)) return false;
  if (!d.displayProperties?.hasIcon) return false;
  return true;
}

interface Facet {
  key: string;
  labelKey: string;
  match: (d: DestinyInventoryItemDefinition) => boolean;
}

interface TabDef {
  key: string;
  labelKey: string;
  match: (d: DestinyInventoryItemDefinition) => boolean;
  facets?: Facet[];
}

const ALL_FACET: Facet = {
  key: "all",
  labelKey: "database.facet.all",
  match: () => true,
};

const TABS: TabDef[] = [
  {
    key: "weapons",
    labelKey: "database.tab.weapons",
    match: (d) => d.itemType === IT.Weapon,
    facets: [
      ALL_FACET,
      {
        key: "kinetic",
        labelKey: "database.facet.kinetic",
        match: (d) =>
          (d.equippingBlock as { ammoType?: number } | undefined)?.ammoType ===
          AMMO.Kinetic,
      },
      {
        key: "energy",
        labelKey: "database.facet.energy",
        match: (d) =>
          (d.equippingBlock as { ammoType?: number } | undefined)?.ammoType ===
          AMMO.Energy,
      },
      {
        key: "power",
        labelKey: "database.facet.power",
        match: (d) =>
          (d.equippingBlock as { ammoType?: number } | undefined)?.ammoType ===
          AMMO.Power,
      },
    ],
  },
  {
    key: "armor",
    labelKey: "database.tab.armor",
    match: (d) => d.itemType === IT.Armor,
    facets: [
      ALL_FACET,
      { key: "titan", labelKey: "database.facet.titan", match: (d) => d.classType === CLS.Titan },
      {
        key: "hunter",
        labelKey: "database.facet.hunter",
        match: (d) => d.classType === CLS.Hunter,
      },
      {
        key: "warlock",
        labelKey: "database.facet.warlock",
        match: (d) => d.classType === CLS.Warlock,
      },
    ],
  },
  {
    key: "mods",
    labelKey: "database.tab.mods",
    match: (d) => d.itemType === IT.Mod && !isShader(d),
  },
  {
    key: "subclass",
    labelKey: "database.tab.subclass",
    match: (d) => d.itemType === IT.Subclass,
    facets: [
      ALL_FACET,
      { key: "titan", labelKey: "database.facet.titan", match: (d) => d.classType === CLS.Titan },
      {
        key: "hunter",
        labelKey: "database.facet.hunter",
        match: (d) => d.classType === CLS.Hunter,
      },
      {
        key: "warlock",
        labelKey: "database.facet.warlock",
        match: (d) => d.classType === CLS.Warlock,
      },
    ],
  },
  {
    key: "ghosts",
    labelKey: "database.tab.ghosts",
    match: (d) => d.itemType === IT.Ghost,
  },
  {
    key: "ships",
    labelKey: "database.tab.ships",
    match: (d) => d.itemType === IT.Ship,
  },
  {
    key: "vehicles",
    labelKey: "database.tab.vehicles",
    match: (d) => d.itemType === IT.Vehicle,
  },
  {
    key: "emblems",
    labelKey: "database.tab.emblems",
    match: (d) => d.itemType === IT.Emblem,
  },
  {
    key: "shaders",
    labelKey: "database.tab.shaders",
    match: isShader,
  },
  {
    key: "emotes",
    labelKey: "database.tab.emotes",
    match: (d) => {
      if (d.itemType === IT.Emote) return true;
      const t = (d.itemTypeDisplayName ?? "").toLowerCase();
      return /emote|gestuelle/.test(t);
    },
  },
  {
    key: "finishers",
    labelKey: "database.tab.finishers",
    // Finisher detection — itemType 29, known Finisher category hash, or
    // the French/English type label.
    match: (d) => {
      if (d.itemType === IT.Finisher) return true;
      const cats = d.itemCategoryHashes ?? [];
      if (cats.includes(ITEM_CATEGORY_HASH.Finisher)) return true;
      const t = (d.itemTypeDisplayName ?? "").toLowerCase();
      return /ach[èe]vement|finisher/.test(t);
    },
  },
];

const TIER_COLORS: Record<number, string> = {
  6: "rgba(206,165,46,0.7)", // Exotic
  5: "rgba(126,38,153,0.65)", // Legendary
  4: "rgba(81,108,186,0.6)", // Rare
  3: "rgba(60,145,66,0.55)", // Uncommon
  2: "rgba(195,188,180,0.35)", // Common
};

const TIER_NAME_KEY: Record<number, string> = {
  6: "database.tier.exotic",
  5: "database.tier.legendary",
  4: "database.tier.rare",
  3: "database.tier.uncommon",
  2: "database.tier.common",
};

const TAB_ACCENT: Record<string, string> = {
  weapons: "#f87171",
  armor: "#38bdf8",
  mods: "#c084fc",
  bundles: "#fbbf24",
  ghosts: "#a5b4fc",
  ships: "#60a5fa",
  vehicles: "#f472b6",
  emblems: "#2dd4bf",
  shaders: "#fb923c",
  emotes: "#fde047",
  finishers: "#fca5a5",
  subclass: "#d946ef",
};

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

function ItemTile({
  def,
  onClick,
}: {
  def: DestinyInventoryItemDefinition;
  onClick: () => void;
}) {
  const icon = def.displayProperties?.icon;
  const watermark = def.iconWatermark;
  const tier = def.inventory?.tierType ?? 5;
  const name = def.displayProperties?.name ?? "";
  const typeName = def.itemTypeDisplayName;
  const isExotic = tier === 6;

  return (
    <button
      onClick={onClick}
      className="cv-auto-tile text-left p-2 rounded-md flex items-center gap-2 hover:-translate-y-0.5 transition-all"
      style={{
        background: "rgba(12,8,20,0.8)",
        border: `1px solid ${TIER_COLORS[tier] ?? "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div
        className="relative w-11 h-11 shrink-0 overflow-hidden"
        style={{
          border: `1px solid ${TIER_COLORS[tier] ?? "rgba(255,255,255,0.14)"}`,
        }}
      >
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )}
        {watermark && (
          <img
            src={`https://www.bungie.net${watermark}`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[12px] font-bold truncate ${
            isExotic ? "text-amber-300" : "text-white"
          }`}
        >
          {name || "…"}
        </div>
        {typeName && (
          <div className="text-[10px] text-white/45 truncate">{typeName}</div>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function DetailModal({
  def,
  onClose,
}: {
  def: DestinyInventoryItemDefinition;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const icon = def.displayProperties?.icon;
  const screenshot = def.screenshot;
  const name = def.displayProperties?.name;
  const description = def.displayProperties?.description;
  const flavor = def.flavorText;
  const type = def.itemTypeDisplayName;
  const tier = def.inventory?.tierType ?? 5;
  const tierName = def.inventory?.tierTypeName ?? t(TIER_NAME_KEY[tier]);
  const isExotic = tier === 6;
  const borderColor = TIER_COLORS[tier];

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9998 flex items-center justify-center p-6 fade-in-fast"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[84vh] flex flex-col panel overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: `1px solid ${borderColor}` }}
      >
        {screenshot && (
          <div
            className="h-44 relative shrink-0"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.3), rgba(7,7,13,0.95)), url(https://www.bungie.net${screenshot})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
          <div className="flex items-start gap-4">
            {icon && (
              <img
                src={`https://www.bungie.net${icon}`}
                alt=""
                className="w-16 h-16 shrink-0"
                style={{ border: `1px solid ${borderColor}` }}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 font-extrabold">
                {tierName}
              </div>
              <h2
                className={`text-2xl font-extrabold ${
                  isExotic ? "text-amber-300" : "text-white"
                }`}
              >
                {name}
              </h2>
              {type && (
                <div className="text-[11px] text-white/55 font-semibold mt-0.5">
                  {type}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-white/5 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
          {flavor && (
            <div className="italic text-[12px] text-white/70 leading-snug border-l-2 pl-3 border-amber-400/40">
              {flavor}
            </div>
          )}
          {description && (
            <div className="text-[13px] text-white/85 leading-relaxed whitespace-pre-line">
              {description}
            </div>
          )}
          <div className="pt-3 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/35 font-mono font-bold">
            {t("database.hash")} {def.hash}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SortMode = "tier" | "name" | "type";

export function Database() {
  const { t } = useTranslation();
  const catalog = useItemCatalog();
  const [tab, setTab] = useState<string>("weapons");
  const [facet, setFacet] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("tier");
  const [selected, setSelected] =
    useState<DestinyInventoryItemDefinition | null>(null);
    const facetRef = useRef("all")
    const visibleCountRef = useRef(120)

  const tabDef = TABS.find((ti) => ti.key === tab)!;
  const activeFacet: Facet =
    tabDef.facets?.find((f) => f.key === facet) ?? ALL_FACET;

  // Reset facet when switching tabs (a weapon facet makes no sense on armor)
  useEffect(() => {
    setFacet(facetRef.current);
  }, [tab]);

  const items = useMemo(() => {
    if (!catalog.data) return [] as DestinyInventoryItemDefinition[];
    const q = query.trim().toLowerCase();
    const out: DestinyInventoryItemDefinition[] = [];
    // Classify each item into the FIRST matching tab so categories stay
    // mutually exclusive (e.g. an item can't show up in both "Emotes" and
    // "Achèvements" just because its predicates happen to overlap).
    const classifyTab = (d: DestinyInventoryItemDefinition): string | null => {
      for (const ti of TABS) if (ti.match(d)) return ti.key;
      return null;
    };
    for (const hash in catalog.data) {
      const d = catalog.data[hash as unknown as number];
      if (!d) continue;
      if (!isDisplayable(d)) continue;
      if (classifyTab(d) !== tab) continue;
      if (!activeFacet.match(d)) continue;
      if (tierFilter != null && d.inventory?.tierType !== tierFilter) continue;
      if (q) {
        const name = d.displayProperties.name.toLowerCase();
        const type = (d.itemTypeDisplayName ?? "").toLowerCase();
        if (!name.includes(q) && !type.includes(q)) continue;
      }
      out.push(d);
    }

    const byName = (a: DestinyInventoryItemDefinition, b: DestinyInventoryItemDefinition) =>
      (a.displayProperties?.name ?? "").localeCompare(
        b.displayProperties?.name ?? "",
        "fr",
        { sensitivity: "base" }
      );

    switch (sortMode) {
      case "name":
        out.sort(byName);
        break;
      case "type":
        out.sort((a, b) => {
          const tA = a.itemTypeDisplayName ?? "";
          const tB = b.itemTypeDisplayName ?? "";
          const cmp = tA.localeCompare(tB, "fr", { sensitivity: "base" });
          if (cmp !== 0) return cmp;
          return byName(a, b);
        });
        break;
      case "tier":
      default:
        // Tier desc (exotic → common), then by type name, then alpha.
        out.sort((a, b) => {
          const tA = a.inventory?.tierType ?? 0;
          const tB = b.inventory?.tierType ?? 0;
          if (tA !== tB) return tB - tA;
          const typeCmp = (a.itemTypeDisplayName ?? "").localeCompare(
            b.itemTypeDisplayName ?? "",
            "fr",
            { sensitivity: "base" }
          );
          if (typeCmp !== 0) return typeCmp;
          return byName(a, b);
        });
    }
    return out;
  }, [catalog.data, query, sortMode, tab, activeFacet, tierFilter]);

  const [visibleCount, setVisibleCount] = useState(120);
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(visibleCountRef.current);
  }, [tab, facet, query, tierFilter, sortMode]);

  // Per-tab count across the catalog — data-driven so the numbers match
  // what the user actually sees when clicking a tab. MUST be declared
  // before any early return to keep hook order stable across loading →
  // loaded transitions (Rules of Hooks).
  const totalPerTab = useMemo(() => {
    const count: Record<string, number> = {};
    for (const ti of TABS) count[ti.key] = 0;
    if (!catalog.data) return count;
    for (const hash in catalog.data) {
      const d = catalog.data[hash as unknown as number];
      if (!d || !isDisplayable(d)) continue;
      for (const ti of TABS) {
        if (ti.match(d)) {
          count[ti.key] = (count[ti.key] ?? 0) + 1;
          break;
        }
      }
    }
    return count;
  }, [catalog.data]);

  if (catalog.isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold">{t("database.title")}</h2>
          <p className="text-sm text-bungie-muted mt-1">
            {t("database.subtitle")}
          </p>
        </div>
        <div
          className="rounded-xl overflow-hidden relative"
          style={{
            background: "linear-gradient(180deg, rgba(14,10,22,0.95), rgba(7,7,13,0.98))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div
              className="h-full w-1/3 bg-bungie-accent"
              style={{
                animation: "indeterminateBar 1.4s ease-in-out infinite",
              }}
            />
          </div>
          <div className="p-10 text-center">
            <div className="text-white/85 font-semibold">
              {t("database.loading")}
            </div>
            <div className="text-[11px] mt-2 text-white/45">
              {t("database.loadingHint")}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes indeterminateBar {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  }

  if (catalog.isError) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold">{t("database.title")}</h2>
        <div className="panel p-6 text-red-300">
          {t("database.loadingError", { error: (catalog.error as Error).message })}
        </div>
      </div>
    );
  }

  const tabAccent = TAB_ACCENT[tab] ?? "#f3075e";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">{t("database.title")}</h2>
        <p className="text-sm text-bungie-muted mt-1">
          {t("database.subtitle")}
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        {/* ================= SIDEBAR ================= */}
        <aside className="space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-extrabold font-mono px-2 pb-1">
            {t("database.categories")}
          </div>
          {TABS.map((tabItem) => {
            const active = tab === tabItem.key;
            const color = TAB_ACCENT[tabItem.key] ?? "#ffffff";
            const count = totalPerTab[tabItem.key] ?? 0;
            return (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-3 transition-all relative overflow-hidden group"
                style={{
                  background: active
                    ? `linear-gradient(90deg, ${color}22, ${color}06 55%, transparent)`
                    : "rgba(14,12,20,0.55)",
                  border: `1px solid ${active ? color : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5"
                    style={{
                      background: `linear-gradient(180deg, ${color}, transparent)`,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                )}
                <div
                  className={`flex-1 text-[13px] font-bold ${
                    active
                      ? "text-white"
                      : "text-white/75 group-hover:text-white"
                  }`}
                >
                  {t(tabItem.labelKey)}
                </div>
                <div
                  className="text-[10.5px] font-mono tabular-nums font-extrabold"
                  style={{ color: active ? color : "rgba(255,255,255,0.4)" }}
                >
                  {count.toLocaleString("fr-FR")}
                </div>
              </button>
            );
          })}
        </aside>

        {/* ================= MAIN ================= */}
        <div className="min-w-0 space-y-4">
          {/* Sub-facets (only when the active tab defines them) */}
          {tabDef.facets && tabDef.facets.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {tabDef.facets.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFacet(f.key)}
                  className="h-7 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    background:
                      facet === f.key
                        ? `${tabAccent}25`
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      facet === f.key ? tabAccent : "rgba(255,255,255,0.08)"
                    }`,
                    color: facet === f.key ? tabAccent : "rgba(255,255,255,0.65)",
                  }}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          )}

          {/* Controls row — search + tier + sort */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("database.search")}
              className="h-9 px-3 rounded-md bg-black/30 border border-bungie-border text-white text-sm focus:outline-none focus:border-bungie-accent min-w-60 flex-1"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTierFilter(null)}
                className={`h-8 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  tierFilter === null
                    ? "bg-bungie-accent text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {t("database.all")}
              </button>
              {[6, 5, 4].map((tr) => (
                <button
                  key={tr}
                  onClick={() => setTierFilter(tr)}
                  className={`h-8 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    tierFilter === tr
                      ? "text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                  style={{
                    background:
                      tierFilter === tr
                        ? tr === 6
                          ? "#ceaf2e"
                          : tr === 5
                            ? "#a855e0"
                            : "#5a7dd0"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      tr === 6
                        ? "rgba(206,165,46,0.45)"
                        : tr === 5
                          ? "rgba(168,85,224,0.4)"
                          : "rgba(90,125,208,0.4)"
                    }`,
                  }}
                >
                  {t(TIER_NAME_KEY[tr])}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 h-8 px-1 rounded-md bg-white/3 border border-white/8">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-extrabold px-2">
                {t("database.sort")}
              </span>
              {(
                [
                  { key: "tier", labelKey: "database.sortOpt.rarity" },
                  { key: "type", labelKey: "database.sortOpt.type" },
                  { key: "name", labelKey: "database.sortOpt.name" },
                ] as { key: SortMode; labelKey: string }[]
              ).map((so) => (
                <button
                  key={so.key}
                  onClick={() => setSortMode(so.key)}
                  className={`h-6 px-2 rounded text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
                    sortMode === so.key
                      ? "bg-bungie-accent text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {t(so.labelKey)}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-bungie-muted ml-auto">
              {items.length.toLocaleString("fr-FR")} / {(totalPerTab[tab] ?? 0).toLocaleString("fr-FR")}
            </div>
          </div>

          {/* Grid */}
          {items.length === 0 ? (
            <div className="panel p-8 text-center text-bungie-muted">
              {t("database.noResults")}
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                {items.slice(0, visibleCount).map((d) => (
                  <ItemTile
                    key={d.hash}
                    def={d}
                    onClick={() => setSelected(d)}
                  />
                ))}
              </div>
              {items.length > visibleCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleCount((v) => v + 120)}
                    className="h-9 px-5 rounded-full bg-bungie-accent/15 hover:bg-bungie-accent/25 border border-bungie-accent/40 text-bungie-accent text-xs font-extrabold uppercase tracking-wider"
                  >
                    {t("database.loadMore", { n: Math.min(120, items.length - visibleCount) })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal def={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}