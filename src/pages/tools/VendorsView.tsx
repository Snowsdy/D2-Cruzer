/* eslint-disable react-hooks/set-state-in-effect */
// v3 — bundle icon rework + HMR cache bust
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { getVendor, getVendorDef, VendorHashes, type VendorKey } from "@/api/vendors";
import { getItemDef } from "@/api/itemDef";
import { ItemPreviewModal } from "@/components/item-preview-modal";
import { Dropdown } from "@/components/dropdown";
import { VendorCrest } from "./VendorCrest";
import { useManifestStore } from "@/store/manifest";
import { ITEM_TYPE, VENDOR_COLOR } from "@/constants/bungieHashes";
import { isShader } from "@/utils/itemClassify";
import { fmtCountdownDH as fmtCountdown } from "@/utils/format";
import type {
  DestinyVendorSaleItemComponent,
  DestinyInventoryItemDefinition,
  DestinyObjectiveProgress,
} from "bungie-api-ts/destiny2";

import {
  VENDOR_PROGRESSION,
} from "@/api/vendorProgressions";

interface VendorInfo {
  key: VendorKey;
  hash: number;
  role: string;
  accent: string;
  accentBorder: string;
  bgColor: string;
}

const VENDORS: VendorInfo[] = [
  {
    key: "Zavala",
    hash: VendorHashes.Zavala,
    role: "Avant-garde",
    accent: "text-pink-300",
    accentBorder: "border-pink-500/40",
    bgColor: "rgba(56,189,248,0.08)",
  },
  {
    key: "Shaxx",
    hash: VendorHashes.Shaxx,
    role: "Épreuve",
    accent: "text-red-300",
    accentBorder: "border-red-500/40",
    bgColor: "rgba(248,113,113,0.08)",
  },
  {
    key: "Drifter",
    hash: VendorHashes.Drifter,
    role: "Gambit",
    accent: "text-emerald-300",
    accentBorder: "border-emerald-500/40",
    bgColor: "rgba(52,211,153,0.08)",
  },
  {
    key: "Banshee",
    hash: VendorHashes.Banshee,
    role: "Armurier",
    accent: "text-amber-300",
    accentBorder: "border-amber-500/40",
    bgColor: "rgba(251,191,36,0.08)",
  },
  {
    key: "SaintFourteen",
    hash: VendorHashes.SaintFourteen,
    role: "Trials",
    accent: "text-purple-300",
    accentBorder: "border-purple-500/40",
    bgColor: "rgba(192,132,252,0.08)",
  },
  {
    key: "Ada1",
    hash: VendorHashes.Ada1,
    role: "Synthétiseur",
    accent: "text-orange-300",
    accentBorder: "border-orange-500/40",
    bgColor: "rgba(251,146,60,0.08)",
  },
  {
    key: "Hawthorne",
    hash: VendorHashes.Hawthorne,
    role: "Clan",
    accent: "text-teal-300",
    accentBorder: "border-teal-500/40",
    bgColor: "rgba(45,212,191,0.08)",
  },
  {
    key: "Ikora",
    hash: VendorHashes.Ikora,
    role: "Cachée",
    accent: "text-indigo-300",
    accentBorder: "border-indigo-500/40",
    bgColor: "rgba(129,140,248,0.08)",
  },
  {
    key: "Eververse",
    hash: VendorHashes.Eververse,
    role: "Eververse",
    accent: "text-sky-300",
    accentBorder: "border-sky-500/40",
    bgColor: "rgba(56,189,248,0.08)",
  },
  {
    key: "Xur",
    hash: VendorHashes.Xur,
    role: "Agent des Neuf",
    accent: "text-yellow-300",
    accentBorder: "border-yellow-500/40",
    bgColor: "rgba(250,204,21,0.08)",
  },
];

const BOUNTY_ITEM_TYPE = ITEM_TYPE.Bounty;

type SortMode = "rarity" | "name" | "type" | "cost" | "cheapest";

/**
 * Extracts a comparable cost value from a vendor sale entry. Uses the first
 * currency's quantity — good enough for ordering (actual inter-currency
 * comparison is meaningless since Glimmer ≠ Legendary Shards).
 */
function saleCost(e: {
  sale: DestinyVendorSaleItemComponent;
}): number {
  const c = e.sale.costs?.[0];
  return c?.quantity ?? 0;
}

/**
 * Item rarity ranking for sort: exotic (6) > legendary (5) > rare (4) > uncommon (3) > common (2).
 * Returns a descending tier number so the larger value sorts first.
 */
function tierRank(e: { def?: DestinyInventoryItemDefinition }): number {
  return e.def?.inventory?.tierType ?? 0;
}

function isBounty(def?: DestinyInventoryItemDefinition | null): boolean {
  return def?.itemType === BOUNTY_ITEM_TYPE;
}


/**
 * Renders the authentic Bungie faction crest for a vendor by looking up the
 * progression's icon in the manifest. Falls back to the hand-drawn SVG if
 * the manifest hasn't loaded yet or the icon is missing.
 */
interface VendorDefLike {
  displayProperties?: {
    icon?: string;
    smallTransparentIcon?: string;
    mapIcon?: string;
    largeIcon?: string;
  };
}

function FactionCrest({
  vendor,
  size = 40,
  vendorDef,
}: {
  vendor: VendorKey;
  size?: number;
  vendorDef?: VendorDefLike;
}) {
  const manifest = useManifestStore((s) => s.manifest);
  const candidates = VENDOR_PROGRESSION[vendor] ?? [];
  const color = VENDOR_COLOR[vendor];

  // 1. Probe every progression candidate — the rank icon is the canonical crest.
  let iconPath: string | undefined;
  for (const h of candidates) {
    const def = manifest?.DestinyProgressionDefinition?.[h];
    const icon = def?.displayProperties?.icon;
    if (icon) {
      iconPath = icon;
      break;
    }
  }

  // 2. Fall back to the vendor definition's own icons. Some vendors expose
  //    a proper crest in `smallTransparentIcon` even when the progression
  //    table doesn't carry one.
  if (!iconPath && vendorDef?.displayProperties) {
    const d = vendorDef.displayProperties;
    const candidate =
      d.smallTransparentIcon ||
      d.mapIcon ||
      d.icon;
    if (
      candidate &&
      !/missing_icon|missing-item|vendor_portrait/i.test(candidate)
    ) {
      iconPath = candidate;
    }
  }

  if (iconPath) {
    return (
      <img
        src={`https://www.bungie.net${iconPath}`}
        alt=""
        width={size}
        height={size}
        className="object-contain shrink-0"
        style={{
          filter: `drop-shadow(0 0 10px ${color}77) brightness(1.12)`,
        }}
      />
    );
  }
  return <VendorCrest vendor={vendor} size={size} />;
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function VendorsView() {
  const { t, i18n } = useTranslation();
  const { membership, activeCharacterId, profile } = useProfile();
  const [activeTab, setActiveTab] = useState<VendorKey>("Zavala");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("rarity");
  const [previewHash, setPreviewHash] = useState<number | null>(null);
  const locale = i18n.language;

  // Lazy-load vendor defs for tab buttons + panel portraits.
  const vendorDefs = useQueries({
    queries: VENDORS.map((v) => ({
      queryKey: ["vendorDef", v.hash, locale],
      queryFn: () => getVendorDef(v.hash, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  // Character progressions give us uninstanced item objective progress.
  const charProgressions = profile.data?.characterProgressions?.data;
  const progressions = activeCharacterId
    ? charProgressions?.[activeCharacterId]
    : undefined;

  const activeIndex = VENDORS.findIndex((v) => v.key === activeTab);
  const activeVendor = VENDORS[activeIndex];
  const activeDef = vendorDefs[activeIndex]?.data;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-extrabold">{t("vendors.title")}</h1>
        <p className="text-sm text-bungie-muted mt-1">{t("vendors.subtitle")}</p>
      </div>

      {/* Sidebar + main split */}
      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* ========= SIDEBAR ========= */}
        <aside className="space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-extrabold font-mono px-2 pb-1">
            Marchands
          </div>
          {VENDORS.map((v, i) => {
            const def = vendorDefs[i]?.data;
            const name = def?.displayProperties?.name ?? v.key;
            const active = activeTab === v.key;
            const color = VENDOR_COLOR[v.key];
            return (
              <button
                key={v.key}
                onClick={() => setActiveTab(v.key)}
                className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all relative overflow-hidden group"
                style={{
                  background: active
                    ? `linear-gradient(90deg, ${color}22, ${color}06 55%, transparent)`
                    : "rgba(14,12,20,0.55)",
                  border: `1px solid ${active ? color : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {/* active stripe */}
                {active && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5"
                    style={{
                      background: `linear-gradient(180deg, ${color}, transparent)`,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                  />
                )}
                <FactionCrest vendor={v.key} size={36} vendorDef={def} />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] font-bold truncate ${
                      active ? "text-white" : "text-white/75 group-hover:text-white"
                    }`}
                  >
                    {name}
                  </div>
                  <div
                    className="text-[9px] uppercase tracking-[0.25em] font-extrabold mt-0.5"
                    style={{ color: active ? color : "rgba(255,255,255,0.4)" }}
                  >
                    {v.role}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ========= MAIN ========= */}
        <div className="min-w-0 space-y-4">
          <VendorPanel
            key={activeVendor.key}
            vendor={activeVendor}
            vendorDef={activeDef}
            membershipType={membership?.membershipType}
            membershipId={membership?.membershipId}
            characterId={activeCharacterId ?? undefined}
            uninstancedObjectives={progressions?.uninstancedItemObjectives ?? {}}
            locale={locale}
            t={t}
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            onPreview={setPreviewHash}
          />
        </div>
      </div>

      {previewHash !== null && (
        <ItemPreviewModal
          itemHash={previewHash}
          onClose={() => setPreviewHash(null)}
        />
      )}
    </div>
  );
}

function VendorPanel({
  vendor,
  vendorDef,
  membershipType,
  membershipId,
  characterId,
  uninstancedObjectives,
  locale,
  t,
  search,
  setSearch,
  sort,
  setSort,
  onPreview,
}: {
  vendor: VendorInfo;
  vendorDef?: {
    displayProperties?: {
      name?: string;
      description?: string;
      icon?: string;
      largeIcon?: string;
      smallTransparentIcon?: string;
      mapIcon?: string;
      highResIcon?: string;
    };
    factionIcon?: string;
    vendorBanner?: string;
  };
  membershipType?: number;
  membershipId?: string;
  characterId?: string;
  uninstancedObjectives: Record<string, DestinyObjectiveProgress[]>;
  locale: string;
  t: (key: string) => string;
  search: string;
  setSearch: (v: string) => void;
  sort: SortMode;
  setSort: (s: SortMode) => void;
  onPreview: (hash: number) => void;
}) {
  const now = useNow();

  const vendorQuery = useQuery({
    queryKey: ["vendor", vendor.key, membershipType, membershipId, characterId],
    queryFn: () =>
      getVendor(membershipType!, membershipId!, characterId!, vendor.hash),
    enabled: !!membershipType && !!membershipId && !!characterId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const sales: DestinyVendorSaleItemComponent[] = useMemo(() => {
    const raw = vendorQuery.data?.sales?.data ?? {};
    return Object.values(raw).filter((s) => s.itemHash);
  }, [vendorQuery.data]);

  // Collect every hash we need a definition for: the sale item itself PLUS
  // every currency hash referenced in its costs. One pass instead of N+1.
  const allHashes = useMemo(() => {
    const set = new Set<number>();
    for (const s of sales) {
      if (s.itemHash) set.add(s.itemHash);
      for (const c of s.costs ?? []) {
        if (c.itemHash) set.add(c.itemHash);
      }
    }
    return Array.from(set);
  }, [sales]);

  useQueries({
    queries: allHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const defs = useQueries({
    queries: sales.map((s) => ({
      queryKey: ["itemDef", s.itemHash, locale],
      queryFn: () => getItemDef(s.itemHash, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const q = search.trim().toLowerCase();
  const entriesRaw = sales.map((s, i) => ({ sale: s, def: defs[i]?.data }));
  const entries = entriesRaw.filter((e) => {
    if (!q) return true;
    const name = e.def?.displayProperties?.name?.toLowerCase() ?? "";
    return name.includes(q);
  });
  const byName = (
    a: (typeof entriesRaw)[number],
    b: (typeof entriesRaw)[number]
  ) =>
    (a.def?.displayProperties?.name ?? "").localeCompare(
      b.def?.displayProperties?.name ?? "",
      "fr",
      { sensitivity: "base", numeric: true }
    );

  const byType = (
    a: (typeof entriesRaw)[number],
    b: (typeof entriesRaw)[number]
  ) =>
    (a.def?.itemTypeDisplayName ?? "").localeCompare(
      b.def?.itemTypeDisplayName ?? "",
      "fr",
      { sensitivity: "base" }
    );

  const cmp = (
    a: (typeof entriesRaw)[number],
    b: (typeof entriesRaw)[number]
  ) => {
    switch (sort) {
      case "name":
        return byName(a, b);
      case "type": {
        const t = byType(a, b);
        return t !== 0 ? t : byName(a, b);
      }
      case "cost": {
        // Free items first, then by ascending cost
        const ca = saleCost(a);
        const cb = saleCost(b);
        if (ca !== cb) return ca - cb;
        return byName(a, b);
      }
      case "cheapest": {
        // Explicit ascending cost, treating "0" as "Gratuit" placed first
        const ca = saleCost(a) || -1;
        const cb = saleCost(b) || -1;
        if (ca !== cb) return ca - cb;
        return byName(a, b);
      }
      case "rarity":
      default: {
        // Exotic → Legendary → Rare → Common, then type, then alpha
        const tr = tierRank(b) - tierRank(a);
        if (tr !== 0) return tr;
        const t = byType(a, b);
        if (t !== 0) return t;
        return byName(a, b);
      }
    }
  };
  const bounties = entries.filter((e) => isBounty(e.def)).sort(cmp);
  const other = entries.filter((e) => !isBounty(e.def) && e.def).sort(cmp);

  const vendorName = vendorDef?.displayProperties?.name ?? vendor.key;
  const description = vendorDef?.displayProperties?.description ?? "";
  const banner =
    vendorDef?.displayProperties?.largeIcon ?? vendorDef?.vendorBanner;

  // ---------------------------------------------------------------------------
  // Category system — data-driven. Each category has a predicate on the item
  // def + a label. Tabs with 0 items auto-hide so the bar stays tidy.
  // ---------------------------------------------------------------------------
  const CATEGORIES: {
    key: string;
    label: string;
    match: (d: DestinyInventoryItemDefinition) => boolean;
  }[] = useMemo(
    () => [
      {
        key: "weapons",
        label: "Armes",
        match: (d) => d.itemType === 3,
      },
      {
        key: "armor",
        label: "Armures",
        match: (d) => d.itemType === 2,
      },
      {
        key: "mods",
        label: "Mods",
        match: (d) => d.itemType === 19,
      },
      {
        key: "bundles",
        label: "Ensembles",
        match: (d) => {
          const it = d.itemType ?? 0;
          if ([25, 7, 20, 8, 11].includes(it)) return true;
          const cats = d.itemCategoryHashes ?? [];
          if (cats.includes(53) && it === 0) return true;
          const name = d.displayProperties?.name?.toLowerCase() ?? "";
          return (
            it === 0 &&
            /ensemble|arsenal|r[ée]compense|ancien |pack /.test(name)
          );
        },
      },
      {
        key: "ghosts",
        label: "Spectres",
        match: (d) => d.itemType === 24,
      },
      {
        key: "ships",
        label: "Vaisseaux",
        match: (d) => d.itemType === 21,
      },
      {
        key: "vehicles",
        label: "Passereaux",
        match: (d) => d.itemType === 22,
      },
      {
        key: "emblems",
        label: "Emblèmes",
        match: (d) => d.itemType === 14,
      },
      {
        key: "shaders",
        label: "Revêtements",
        match: isShader,
      },
      {
        key: "emotes",
        label: "Émotes",
        match: (d) => {
          if (d.itemType === 23) return true;
          const t = (d.itemTypeDisplayName ?? "").toLowerCase();
          return /emote|gestuelle/.test(t);
        },
      },
      {
        key: "finishers",
        label: "Coups de grâce",
        // Finisher items either have itemType 29 (Finisher), or carry the
        // "Finisher" category hash, or the French "Achèvement" in the type
        // label. Broad match covers all three so the tab never stays empty
        // when a vendor does sell them.
        match: (d) => {
          if (d.itemType === 29) return true;
          const cats = d.itemCategoryHashes ?? [];
          if (cats.includes(3683254069)) return true;
          const t = (d.itemTypeDisplayName ?? "").toLowerCase();
          return /ach[èe]vement|finisher/.test(t);
        },
      },
      {
        key: "subclass",
        label: "Sous-classes",
        match: (d) => d.itemType === 16,
      },
      {
        key: "materials",
        label: "Matériaux",
        match: (d) => {
          const it = d.itemType ?? 0;
          return it === 1 || it === 9 || it === 10;
        },
      },
    ],
    []
  );

  /**
   * Classify an item into the FIRST matching category. Categories are checked
   * in declaration order so more-specific rules (shader via category hash)
   * win over broader ones.
   */
  const classify = (
    d: DestinyInventoryItemDefinition | undefined
  ): string | null => {
    if (!d) return null;
    for (const c of CATEGORIES) {
      if (c.match(d)) return c.key;
    }
    return null;
  };

  /** Counts per category across the "other" list (non-bounty items). */
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of CATEGORIES) out[c.key] = 0;
    out.divers = 0;
    for (const e of other) {
      const key = classify(e.def);
      if (key) out[key] = (out[key] ?? 0) + 1;
      else out.divers++;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [other, CATEGORIES]);

  const [category, setCategory] = useState<string>("all");

  // Reset on vendor switch so a stale filter doesn't hide everything
  useEffect(() => {
    setCategory("all");
  }, [vendor.key]);

  const filteredOther = useMemo(() => {
    if (category === "all" || category === "contracts") return other;
    if (category === "divers") {
      return other.filter((e) => !e.def || classify(e.def) === null);
    }
    // Use classify() so each item lands in exactly ONE category (the first
    // that matches in CATEGORIES order). Otherwise an item that matches
    // multiple predicates would appear in every one of those tabs.
    return other.filter((e) => !!e.def && classify(e.def) === category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [other, category, CATEGORIES]);

  // Next daily reset (17:00 UTC) — shown prominently in the hero.
  const nextReset = useMemo(() => {
    const r = new Date(now);
    r.setUTCHours(17, 0, 0, 0);
    if (r.getTime() <= now.getTime()) r.setUTCDate(r.getUTCDate() + 1);
    return r;
  }, [now]);
  const resetLabel = fmtCountdown(nextReset, now);

  const totalItems = bounties.length + other.length;
  const showBounties = category === "all" || category === "contracts";
  const showOther = category !== "contracts";

  const vendorColor = VENDOR_COLOR[vendor.key];

  return (
    <>
      {/* ================= HERO (slim ribbon) ================= */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          border: `1px solid ${vendorColor}33`,
          background: banner
            ? `linear-gradient(90deg, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.55) 60%, rgba(7,7,13,0.15) 100%), url(https://www.bungie.net${banner}) center/cover`
            : "rgba(14,12,20,0.8)",
        }}
      >
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5"
          style={{
            background: `linear-gradient(180deg, ${vendorColor}, transparent)`,
            boxShadow: `0 0 10px ${vendorColor}`,
          }}
        />
        <div className="relative flex items-center gap-4 px-5 py-3.5">
          <FactionCrest vendor={vendor.key} size={44} vendorDef={vendorDef} />
          <div className="min-w-0 flex-1">
            <div
              className="text-[9px] uppercase tracking-[0.3em] font-extrabold"
              style={{ color: vendorColor }}
            >
              {vendor.role}
            </div>
            <div className="text-xl font-extrabold text-white drop-shadow leading-tight mt-0.5 truncate">
              {vendorName}
            </div>
            {description && (
              <p className="text-[11px] text-white/65 mt-1 line-clamp-1 max-w-2xl drop-shadow">
                {description}
              </p>
            )}
          </div>
          {/* Inline stats pills */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <InlineStat
              label="Items"
              value={String(totalItems)}
              color={vendorColor}
            />
            <InlineStat
              label="Contrats"
              value={String(bounties.length)}
              color="#34d399"
            />
            <InlineStat
              label="Reset"
              value={resetLabel}
              color="#f472b6"
            />
          </div>
        </div>
      </div>

      {/* ================= INTEGRATED TOOLBAR ================= */}
      <div
        className="rounded-lg p-2.5 flex items-center gap-3 flex-wrap"
        style={{
          background: "rgba(14,12,20,0.55)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Category pills */}
        <div className="flex items-center gap-1 flex-wrap">
          <CatTab
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="Tout"
            count={totalItems}
          />
          {bounties.length > 0 && (
            <CatTab
              active={category === "contracts"}
              onClick={() => setCategory("contracts")}
              label="Contrats"
              count={bounties.length}
            />
          )}
          {CATEGORIES.map((c) =>
            (counts[c.key] ?? 0) > 0 ? (
              <CatTab
                key={c.key}
                active={category === c.key}
                onClick={() => setCategory(c.key)}
                label={c.label}
                count={counts[c.key]}
              />
            ) : null
          )}
          {counts.divers > 0 && (
            <CatTab
              active={category === "divers"}
              onClick={() => setCategory("divers")}
              label="Divers"
              count={counts.divers}
            />
          )}
        </div>

        <div className="flex-1" />

        {/* Search + sort */}
        <div className="flex items-center gap-2 min-w-70 flex-1 md:flex-initial md:w-95">
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder={t("vendors.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/35 border border-bungie-border rounded-md pl-8 pr-3 h-8 text-sm focus:outline-none focus:border-bungie-accent/60"
            />
          </div>
          <Dropdown
            value={sort}
            onChange={(v) => setSort(v as SortMode)}
            variant="md"
            size="md"
            options={[
              { value: "rarity", label: t("vendors.sortRarity") },
              { value: "type", label: t("vendors.sortType") },
              { value: "name", label: t("vendors.sortName") },
              { value: "cost", label: t("vendors.sortCostAsc") },
              { value: "cheapest", label: t("vendors.sortCheapest") },
            ]}
          />
        </div>
      </div>

      {/* ================= STATES ================= */}
      {vendorQuery.isLoading && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {vendorQuery.isError && (
        <div className="panel p-4 border border-red-500/40">
          <p className="text-red-400 font-semibold mb-1">{t("common.error")}</p>
          <p className="text-sm text-bungie-muted">{String(vendorQuery.error)}</p>
        </div>
      )}

      {/* ================= CONTRATS ================= */}
      {showBounties && bounties.length > 0 && (
        <section>
          <SectionHeader
            accent={vendor.accent}
            label={t("vendors.bountiesSection")}
            count={bounties.length}
          />
          <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bounties.map((e, i) => (
              <BountyCard
                key={`${e.sale.itemHash}-${i}`}
                entry={e}
                accent={vendor.accent}
                objectives={uninstancedObjectives[String(e.sale.itemHash)] ?? []}
                locale={locale}
                now={now}
                t={t}
                onClick={() => onPreview(e.sale.itemHash)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= AUTRES ITEMS ================= */}
      {showOther && filteredOther.length > 0 && (
        <section>
          <SectionHeader
            accent={vendor.accent}
            label={
              category === "all"
                ? t("vendors.otherSection")
                : category === "divers"
                  ? "Divers"
                  : CATEGORIES.find((c) => c.key === category)?.label ??
                    t("vendors.otherSection")
            }
            count={filteredOther.length}
            right={
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/45">
                <OtherLegend label="Exotique" cls="bg-yellow-400/80" />
                <OtherLegend label="Légendaire" cls="bg-purple-400/80" />
                <OtherLegend label="Rare" cls="bg-blue-400/80" />
              </div>
            }
          />
          <div className="stagger grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredOther.map((e, i) => (
              <VendorItemCard
                key={`${e.sale.itemHash}-${i}`}
                entry={e}
                accent={vendor.accent}
                locale={locale}
                now={now}
                vendorKey={vendor.key}
                vendorBanner={banner}
                vendorIcon={vendorDef?.displayProperties?.icon}
                onClick={() => onPreview(e.sale.itemHash)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for narrow filters */}
      {!vendorQuery.isLoading &&
        showOther &&
        filteredOther.length === 0 &&
        (!showBounties || bounties.length === 0) && (
          <div className="panel p-8 text-center text-bungie-muted">
            Ce marchand ne propose rien dans cette catégorie pour le moment.
          </div>
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers — defined after VendorPanel to keep the file flat
// ---------------------------------------------------------------------------

function InlineStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-md backdrop-blur"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: `1px solid ${color}35`,
      }}
    >
      <span
        className="text-[9px] uppercase tracking-[0.2em] font-extrabold font-mono"
        style={{ color: `${color}cc` }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-extrabold tabular-nums leading-none"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function CatTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
        active
          ? "bg-bungie-accent text-black shadow-glow"
          : "text-bungie-text/70 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-mono tabular-nums font-extrabold ${
          active ? "text-black/55" : "text-white/35"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SectionHeader({
  label,
  count,
  accent,
  right,
}: {
  label: string;
  count: number;
  accent: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <div className="flex items-baseline gap-3 min-w-0">
        <h3 className="text-[15px] font-extrabold flex items-center gap-2 uppercase tracking-widest">
          <span className={accent}>◆</span>
          {label}
        </h3>
        <span className="text-[11px] font-mono font-extrabold text-white/45">
          {count} {count > 1 ? "résultats" : "résultat"}
        </span>
      </div>
      {right}
    </div>
  );
}

function CostBadge({
  itemHash,
  quantity,
  locale,
}: {
  itemHash: number;
  quantity: number;
  locale: string;
}) {
  const { data } = useQuery({
    queryKey: ["itemDef", itemHash, locale],
    queryFn: () => getItemDef(itemHash, locale),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const icon = data?.displayProperties?.icon;
  const name = data?.displayProperties?.name ?? "";
  return (
    <span
      className="inline-flex items-center gap-1 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 tabular-nums text-[10px]"
      title={name}
    >
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="w-3.5 h-3.5"
        />
      )}
      {quantity.toLocaleString()}
    </span>
  );
}

function BountyCard({
  entry,
  accent,
  objectives,
  locale,
  now,
  t,
  onClick,
  compact,
}: {
  entry: {
    sale: DestinyVendorSaleItemComponent;
    def?: DestinyInventoryItemDefinition;
  };
  accent: string;
  objectives?: DestinyObjectiveProgress[];
  locale: string;
  now: Date;
  t: (key: string) => string;
  onClick: () => void;
  compact?: boolean;
}) {
  const def = entry.def;
  const name = def?.displayProperties?.name ?? `Item ${entry.sale.itemHash}`;
  const desc = def?.displayProperties?.description ?? "";
  const icon = def?.displayProperties?.icon;
  const typeName = def?.itemTypeDisplayName ?? "";
  const tier = def?.inventory?.tierTypeName ?? "";
  const tierType = def?.inventory?.tierType ?? 0;

  const tierBadge =
    tierType === 6
      ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-200"
      : tierType === 5
        ? "border-purple-400/60 bg-purple-400/10 text-purple-200"
        : tierType === 4
          ? "border-blue-400/60 bg-blue-400/10 text-blue-200"
          : "border-bungie-border bg-bungie-panel/60 text-white/70";

  const refresh = entry.sale.overrideNextRefreshDate
    ? new Date(entry.sale.overrideNextRefreshDate)
    : null;

  const hasProgress = (objectives ?? []).length > 0;
  const allComplete =
    hasProgress && objectives!.every((o) => o.complete);
  const progressPct = hasProgress
    ? objectives!.reduce((acc, o) => {
        const target = o.completionValue || 1;
        return acc + Math.min(1, (o.progress ?? 0) / target);
      }, 0) / objectives!.length
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel p-3 flex gap-3 border transition-all text-left hover:-translate-y-0.5 cursor-pointer ${
        allComplete
          ? "border-emerald-500/50 hover:border-emerald-400"
          : hasProgress
            ? "border-amber-500/30 hover:border-amber-400"
            : "border-bungie-border hover:border-white/40"
      }`}
    >
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          loading="lazy"
          decoding="async"
          className={`${compact ? "w-10 h-10" : "w-14 h-14"} rounded border border-white/20 bg-black/40 shrink-0`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5 flex-wrap">
          <span className="font-semibold text-white leading-tight">{name}</span>
          {allComplete && (
            <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              ✓ {t("vendors.ready")}
            </span>
          )}
        </div>
        {typeName && (
          <div className={`text-[10px] uppercase tracking-widest ${accent}/80`}>
            {typeName}
          </div>
        )}
        {desc && !compact && (
          <p className="text-[11px] text-bungie-muted mt-1 line-clamp-2">
            {desc}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {tier && (
            <span
              className={`text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full border ${tierBadge}`}
            >
              {tier}
            </span>
          )}
          {refresh && refresh.getTime() > now.getTime() && (
            <span className="text-[9px] uppercase tracking-widest text-amber-300/80">
              ⧗ {fmtCountdown(refresh, now)}
            </span>
          )}
        </div>

        {/* Objective progress bars */}
        {hasProgress && !compact && (
          <div className="mt-2 space-y-1">
            {objectives!.slice(0, 3).map((o, i) => {
              const target = o.completionValue || 1;
              const prog = Math.min(target, o.progress ?? 0);
              const pct = (prog / target) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[10px] tabular-nums">
                    <span className="text-bungie-muted">
                      {prog.toLocaleString()} / {target.toLocaleString()}
                    </span>
                    <span
                      className={o.complete ? "text-emerald-300" : "text-white/60"}
                    >
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${o.complete ? "bg-emerald-400/70" : "bg-pink-400/60"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {hasProgress && compact && (
          <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${allComplete ? "bg-emerald-400/70" : "bg-pink-400/60"}`}
              style={{ width: `${progressPct * 100}%` }}
            />
          </div>
        )}

        {/* Costs with real icons */}
        {entry.sale.costs && entry.sale.costs.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {entry.sale.costs.map((c, i) => (
              <CostBadge
                key={i}
                itemHash={c.itemHash}
                quantity={c.quantity}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Rich "other item" card — used in the "Autres items en vente" section.
// Packs more detail than the compact BountyCard: full description, element,
// ammo type, power cap, refresh, costs, and a clear tier strip.
// ---------------------------------------------------------------------------

function OtherLegend({ label, cls }: { label: string; cls: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${cls}`} />
      {label}
    </span>
  );
}

const DAMAGE_TYPE_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: "Cinétique", color: "#e5e7eb" },
  2: { label: "Arc", color: "#60a5fa" },
  3: { label: "Solaire", color: "#f97316" },
  4: { label: "Vide", color: "#a78bfa" },
  6: { label: "Stasis", color: "#38bdf8" },
  7: { label: "Strand", color: "#34d399" },
};

const AMMO_TYPE_LABEL: Record<number, string> = {
  1: "Primaire",
  2: "Spéciale",
  3: "Lourde",
};

function VendorItemCard({
  entry,
  locale,
  now,
  vendorKey,
  vendorBanner,
  vendorIcon,
  onClick,
}: {
  entry: {
    sale: DestinyVendorSaleItemComponent;
    def?: DestinyInventoryItemDefinition;
  };
  accent: string;
  locale: string;
  now: Date;
  vendorKey?: VendorKey;
  vendorBanner?: string;
  vendorIcon?: string;
  onClick: () => void;
}) {
  const def = entry.def;
  const name = def?.displayProperties?.name ?? `Item ${entry.sale.itemHash}`;
  const desc = def?.displayProperties?.description ?? "";
  // Icon fallback chain — package / bundle items often have `displayProperties.icon`
  // missing but expose `secondaryIcon` or entries in `iconSequences`.
  const dp = def?.displayProperties as
    | {
        icon?: string;
        highResIcon?: string;
        hasIcon?: boolean;
        iconSequences?: { frames?: string[] }[];
      }
    | undefined;
  const defExtras = def as unknown as {
    secondaryIcon?: string;
    secondaryOverlay?: string;
    secondarySpecial?: string;
    iconWatermark?: string;
    itemTypeAndTierDisplayName?: string;
    flavorText?: string;
    preview?: { previewActionString?: string };
  };
  // Placeholder-detection: Bungie signals "no real icon for this item" in
  // several sneaky ways — explicit `hasIcon: false`, the missing_icon default
  // path, or placeholder/dummy item types. Any of those → use vendor crest.
  const iconPath =
    dp?.icon ||
    dp?.iconSequences?.[0]?.frames?.[0] ||
    dp?.highResIcon ||
    defExtras?.secondaryIcon ||
    defExtras?.secondarySpecial ||
    "";
  // Only reject an icon when Bungie itself signals it's garbage. Earlier we
  // blanket-killed icons for itemType 25/7/20 (packages/messages/dummies),
  // but those categories often DO carry a perfectly good icon (like the
  // coffin silhouette for "Ancien équipement" or the weekly-reward glyph).
  // Trust the path unless it obviously matches a placeholder.
  const isPlaceholderIcon =
    dp?.hasIcon === false ||
    iconPath === "" ||
    /missing_icon|missing-item|\/items\/dummy|_placeholder/i.test(iconPath);
  const icon = isPlaceholderIcon ? undefined : iconPath || undefined;
  const iconIsVendorFallback = !icon && !!vendorKey;
  const watermark = defExtras?.iconWatermark;
  const typeName =
    defExtras?.itemTypeAndTierDisplayName || def?.itemTypeDisplayName || "";
  const previewAction = defExtras?.preview?.previewActionString;
  const tierType = def?.inventory?.tierType ?? 0;
  const damageType = (def as unknown as { defaultDamageType?: number })?.defaultDamageType;
  const damage = damageType ? DAMAGE_TYPE_LABEL[damageType] : undefined;
  const ammoType = (def?.equippingBlock as unknown as { ammoType?: number })?.ammoType;
  const ammoLabel = ammoType ? AMMO_TYPE_LABEL[ammoType] : undefined;

  const tierColor =
    tierType === 6
      ? "#facc15"
      : tierType === 5
        ? "#c084fc"
        : tierType === 4
          ? "#60a5fa"
          : "rgba(255,255,255,0.35)";

  const refresh = entry.sale.overrideNextRefreshDate
    ? new Date(entry.sale.overrideNextRefreshDate)
    : null;
  const refreshSoon = refresh ? refresh.getTime() - now.getTime() < 6 * 3600 * 1000 : false;

  const isFree = !entry.sale.costs || entry.sale.costs.length === 0;
  const isBundle =
    def?.itemType === 25 ||
    def?.itemType === 7 ||
    def?.itemType === 20 ||
    isPlaceholderIcon;

  const tierLabel =
    tierType === 6
      ? "Exotique"
      : tierType === 5
        ? "Légendaire"
        : tierType === 4
          ? "Rare"
          : tierType === 3
            ? "Peu commun"
            : "Commun";

  const screenshot = (def as unknown as { screenshot?: string })?.screenshot;
  const highResIcon = (def?.displayProperties as { highResIcon?: string } | undefined)?.highResIcon;
  // Prefer the higher-resolution icon when Bungie ships one — the standard
  // icon is ~96px but highResIcon is 512px, which displays crisply at any size.
  const heroIcon = highResIcon || icon;

  // PORTRAIT / VERTICAL card — huge visual footprint, icon dominates.
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        background:
          "linear-gradient(180deg, rgba(18,14,28,0.9) 0%, rgba(8,8,14,0.98) 100%)",
        border: `1px solid ${tierColor}50`,
        boxShadow: `0 10px 32px -10px ${tierColor}60`,
      }}
    >
      {/* ========== HERO ZONE — atmospheric backdrop + crisp icon ========== */}
      <div
        className="relative h-40 overflow-hidden flex items-center justify-center"
        style={{
          // Three-layer atmospheric backdrop:
          //  1. radial tier-colored glow centred on the icon
          //  2. item screenshot OR vendor banner portrait (richer, distinctive)
          //  3. dark gradient for legibility
          background: screenshot
            ? `radial-gradient(circle at 50% 50%, ${tierColor}15 0%, transparent 60%), linear-gradient(180deg, rgba(7,7,13,0.2) 0%, rgba(7,7,13,0.92) 100%), url(https://www.bungie.net${screenshot}) center/cover`
            : vendorBanner
              ? `radial-gradient(circle at 50% 50%, ${tierColor}22 0%, transparent 65%), linear-gradient(180deg, rgba(7,7,13,0.55) 0%, rgba(7,7,13,0.95) 100%), url(https://www.bungie.net${vendorBanner}) center/cover`
              : `radial-gradient(circle at 50% 40%, ${tierColor}30, transparent 70%), rgba(7,7,13,0.85)`,
        }}
      >
        {/* Horizontal tier band top */}
        <div
          className="absolute top-0 left-0 right-0 h-0.75 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${tierColor} 50%, transparent)`,
            boxShadow: `0 0 10px ${tierColor}`,
          }}
        />
        {/* Bottom-corner tick marks (in-game UI style) — out of the way of badges */}
        <span
          className="absolute bottom-2 left-2 w-3 h-3 border-l border-b pointer-events-none"
          style={{ borderColor: `${tierColor}80` }}
        />
        <span
          className="absolute bottom-2 right-2 w-3 h-3 border-r border-b pointer-events-none"
          style={{ borderColor: `${tierColor}80` }}
        />

        {/* Big centered icon — 88px, with halo ring */}
        <div className="relative z-20 transition-transform duration-300 group-hover:scale-[1.06]">
          {/* Halo ring behind the icon */}
          <div
            className="absolute inset-0 -m-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              background: `radial-gradient(circle, ${tierColor}55 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
          {heroIcon ? (
            <div className="relative">
              <img
                src={`https://www.bungie.net${heroIcon}`}
                alt=""
                loading="lazy"
                decoding="async"
                className="relative w-22 h-22 object-cover"
                style={{
                  border: `2px solid ${tierColor}`,
                  boxShadow: `0 0 32px ${tierColor}aa, inset 0 0 0 1px rgba(0,0,0,0.5)`,
                  imageRendering: "auto",
                }}
              />
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-22 h-22 pointer-events-none"
                  style={{ imageRendering: "auto" }}
                />
              )}
            </div>
          ) : iconIsVendorFallback && vendorKey ? (
            <div
              className="relative w-22 h-22 overflow-hidden flex items-center justify-center"
              style={{
                // Clean dark tile with a tier-colored glow — no banner portrait.
                background: `radial-gradient(circle at 50% 40%, ${VENDOR_COLOR[vendorKey]}30 0%, transparent 70%), rgba(7,7,13,0.9)`,
                border: `2px solid ${VENDOR_COLOR[vendorKey]}`,
                boxShadow: `0 0 32px ${VENDOR_COLOR[vendorKey]}80, inset 0 0 0 1px rgba(0,0,0,0.4)`,
              }}
            >
              {vendorIcon ? (
                <img
                  src={`https://www.bungie.net${vendorIcon}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <FactionCrest vendor={vendorKey} size={54} />
              )}
            </div>
          ) : (
            <div
              className="relative w-22 h-22 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), transparent 70%), rgba(7,7,13,0.8)",
                border: `2px solid ${tierColor}`,
              }}
            >
              {/* Bungie-style placeholder: rotated diamond with an isometric cube inside */}
              <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
                <g
                  stroke={tierColor}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer diamond frame */}
                  <path d="M24 4 L44 24 L24 44 L4 24 Z" fill={`${tierColor}10`} />
                  {/* Isometric cube — top face */}
                  <path
                    d="M24 14 L32 19 L24 24 L16 19 Z"
                    fill={`${tierColor}35`}
                  />
                  {/* Cube left face */}
                  <path
                    d="M16 19 L16 30 L24 35 L24 24 Z"
                    fill={`${tierColor}22`}
                  />
                  {/* Cube right face */}
                  <path
                    d="M32 19 L32 30 L24 35 L24 24 Z"
                    fill={`${tierColor}18`}
                  />
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* Top-right refresh timer */}
        {refresh && refresh.getTime() > now.getTime() && (
          <div
            className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-widest z-20 ${
              refreshSoon
                ? "text-amber-200 bg-amber-500/20 border border-amber-400/30"
                : "text-white/60 bg-black/50 border border-white/10"
            }`}
            title={refresh.toLocaleString()}
          >
            ⧗ {fmtCountdown(refresh, now)}
          </div>
        )}

        {/* Top-left tier badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.2em] font-extrabold z-20"
          style={{
            background: `${tierColor}22`,
            border: `1px solid ${tierColor}`,
            color: tierColor,
          }}
        >
          {tierLabel}
        </div>
      </div>

      {/* ========== IDENTITY BAND ========== */}
      <div className="px-4 py-3 space-y-1">
        <div
          className={`font-extrabold text-[15px] leading-tight line-clamp-1 ${
            tierType === 6 ? "text-amber-300" : "text-white"
          }`}
        >
          {name}
        </div>
        <div className="text-[10.5px] text-white/55 line-clamp-1 font-semibold">
          {isBundle ? "Ensemble · " : ""}
          {typeName}
          {damage && (
            <>
              {" · "}
              <span style={{ color: damage.color }}>{damage.label}</span>
            </>
          )}
          {ammoLabel && (
            <>
              <span className="text-white/25"> · </span>
              <span>{ammoLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* ========== DESCRIPTION ========== */}
      {desc && (
        <div className="px-4 pb-3 flex-1">
          <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2">
            {desc}
          </p>
        </div>
      )}
      {!desc && <div className="flex-1" />}

      {/* ========== FOOTER — cost / CTA ========== */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2 border-t"
        style={{
          borderColor: `${tierColor}20`,
          background: `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5))`,
        }}
      >
        {isFree ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-extrabold text-emerald-300">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 8px #34d399" }}
            />
            Gratuit
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {entry.sale.costs!.map((c, i) => (
              <CostBadge
                key={i}
                itemHash={c.itemHash}
                quantity={c.quantity}
                locale={locale}
              />
            ))}
          </div>
        )}
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] font-extrabold transition-all group-hover:translate-x-0.5"
          style={{ color: tierColor }}
        >
          {previewAction ? previewAction : "Voir"}
          <span className="opacity-70">›</span>
        </span>
      </div>
    </button>
  );
}