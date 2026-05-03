import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { getItemDef } from "@/api/itemDef";
import { useProfile, useSelectedMembership } from "@/hooks/useProfile";
import { useItemDef } from "@/hooks/useItemDef";
import {
  useLoadoutName,
  useLoadoutColor,
  useLoadoutIcon,
} from "@/hooks/useLoadoutDef";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type {
  DestinyLoadoutComponent,
  DestinyLoadoutItemComponent,
  DestinyProfileResponse,
  DestinyInventoryItemDefinition,
} from "bungie-api-ts/destiny2";

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface InstanceInfo {
  itemHash: number;
  bucketHash?: number;
  power?: number;
}

function buildInstanceMap(
  profile: DestinyProfileResponse | undefined
): Map<string, InstanceInfo> {
  const map = new Map<string, InstanceInfo>();
  if (!profile) return map;

  const push = (items?: { itemHash: number; itemInstanceId?: string; bucketHash?: number }[]) => {
    if (!items) return;
    for (const it of items) {
      if (it.itemInstanceId) {
        map.set(it.itemInstanceId, {
          itemHash: it.itemHash,
          bucketHash: it.bucketHash,
        });
      }
    }
  };

  push(profile.profileInventory?.data?.items);
  const invs = profile.characterInventories?.data ?? {};
  for (const c of Object.values(invs)) push(c.items);
  const eqs = profile.characterEquipment?.data ?? {};
  for (const c of Object.values(eqs)) push(c.items);

  const instances = profile.itemComponents?.instances?.data ?? {};
  for (const [id, info] of map) {
    const inst = instances[id];
    if (inst?.primaryStat?.value) {
      info.power = inst.primaryStat.value;
    }
  }

  return map;
}

// Element hash → accent color / short label
const DAMAGE_META: Record<number, { color: string; label: string }> = {
  3373582085: { color: "#cccccc", label: "Kinétique" },
  1847026933: { color: "#f57a22", label: "Solaire" },
  2303181850: { color: "#79bbe8", label: "Arc" },
  3454344768: { color: "#b185df", label: "Vide" },
  151347233: { color: "#4d88ff", label: "Stasis" },
  2122313384: { color: "#35c19f", label: "Toile" },
  1067729826: { color: "#f0e668", label: "Prismatique" },
};
function dmgMeta(hash?: number) {
  return hash ? DAMAGE_META[hash] : undefined;
}

const TIER_BORDER: Record<number, string> = {
  6: "rgba(206,165,46,0.85)",
  5: "rgba(126,38,153,0.75)",
  4: "rgba(81,108,186,0.7)",
};
const TIER_GLOW: Record<number, string> = {
  6: "rgba(206,165,46,0.25)",
  5: "rgba(126,38,153,0.2)",
};
const TIER_NAME_COLOR: Record<number, string> = {
  6: "#ceaf2e", // Exotic gold
  5: "#a855e0", // Legendary purple
  4: "#5a7dd0", // Rare blue
  3: "#3c9142", // Uncommon green
  2: "#c3bcb4", // Common white
};

// ---------------------------------------------------------------------------
// HoverCard — portal-based rich tooltip that escapes card clip-paths.
// ---------------------------------------------------------------------------

function HoverCard({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const show = useCallback(() => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  }, []);
  const hide = useCallback(() => setRect(null), []);

  if (!content) {
    return (
      <span ref={ref} className="contents">
        {children}
      </span>
    );
  }
  return (
    <span
      ref={ref}
      className="contents"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-9999"
            style={{
              left: rect.left + rect.width / 2,
              top: rect.top - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}

function TooltipShell({
  borderColor,
  children,
}: {
  borderColor?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="w-65 max-w-[calc(100vw-24px)] p-2.5 text-[11px] text-white/90"
      style={{
        background: "rgba(8,6,14,0.98)",
        border: `1px solid ${borderColor ?? "rgba(255,255,255,0.12)"}`,
        boxShadow: `0 10px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)`,
        backdropFilter: "blur(6px)",
      }}
    >
      {children}
    </div>
  );
}

function ItemHoverContent({
  def,
}: {
  def?: DestinyInventoryItemDefinition;
}) {
  if (!def) return null;
  const name = def.displayProperties?.name;
  if (!name) return null;
  const icon = def.displayProperties?.icon;
  const typeName = def.itemTypeDisplayName;
  const tier = def.inventory?.tierType ?? 5;
  const tierName = def.inventory?.tierTypeName;
  const dmgHash = def.defaultDamageTypeHash ?? def.damageTypeHashes?.[0];
  const dmg = dmgMeta(dmgHash);
  const flavor = def.flavorText || def.displayProperties?.description;
  const nameColor = TIER_NAME_COLOR[tier] ?? "#fff";
  const borderColor = TIER_BORDER[tier] ?? "rgba(255,255,255,0.2)";

  return (
    <TooltipShell borderColor={borderColor}>
      <div className="flex items-start gap-2">
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="w-10 h-10 shrink-0"
            style={{ border: `1px solid ${borderColor}` }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className="font-extrabold text-[13px] leading-tight"
            style={{ color: nameColor }}
          >
            {name}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/55 font-semibold flex items-center flex-wrap gap-x-1.5">
            {tierName && <span>{tierName}</span>}
            {typeName && (
              <>
                {tierName && <span className="text-white/25">·</span>}
                <span>{typeName}</span>
              </>
            )}
            {dmg && (
              <>
                <span className="text-white/25">·</span>
                <span style={{ color: dmg.color }} className="font-bold">
                  {dmg.label}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {flavor && (
        <div className="mt-2 pt-2 text-[11px] leading-snug text-white/70 italic border-t border-white/10">
          {flavor}
        </div>
      )}
    </TooltipShell>
  );
}

function PlugHoverContent({
  def,
  accent,
}: {
  def?: DestinyInventoryItemDefinition;
  accent?: string;
}) {
  if (!def) return null;
  const name = def.displayProperties?.name;
  if (!name) return null;
  const icon = def.displayProperties?.icon;
  const typeName = def.itemTypeDisplayName;
  const desc = def.displayProperties?.description;
  return (
    <TooltipShell borderColor={accent ?? "rgba(255,255,255,0.2)"}>
      <div className="flex items-start gap-2">
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="w-9 h-9 shrink-0"
            style={{
              border: `1px solid ${accent ?? "rgba(255,255,255,0.2)"}`,
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[13px] leading-tight text-white">
            {name}
          </div>
          {typeName && (
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/55 font-semibold">
              {typeName}
            </div>
          )}
        </div>
      </div>
      {desc && (
        <div className="mt-2 pt-2 text-[11px] leading-snug text-white/70 border-t border-white/10 whitespace-pre-line">
          {desc}
        </div>
      )}
    </TooltipShell>
  );
}

// ---------------------------------------------------------------------------
// ItemTile — compact icon with tier border + element corner dot
// ---------------------------------------------------------------------------

function ItemTile({
  hash,
  size = 44,
}: {
  hash: number | undefined;
  size?: number;
}) {
  const def = useItemDef(hash);
  const icon = def.data?.displayProperties?.icon;
  const watermark = def.data?.iconWatermark;
  const tier = def.data?.inventory?.tierType ?? 5;
  const dmgHash = def.data?.defaultDamageTypeHash ?? def.data?.damageTypeHashes?.[0];
  const dmg = dmgMeta(dmgHash);
  const border = icon ? TIER_BORDER[tier] ?? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)";
  const glow = icon ? TIER_GLOW[tier] : undefined;

  return (
    <HoverCard content={<ItemHoverContent def={def.data} />}>
      <div
        className="relative shrink-0"
        style={{
          width: size,
          height: size,
          filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined,
        }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{
            border: `1px solid ${border}`,
            background: icon
              ? "rgba(0,0,0,0.45)"
              : "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 5px, rgba(255,255,255,0) 5px 10px), rgba(7,7,13,0.55)",
          }}
        >
          {icon && (
            <>
              <img
                src={`https://www.bungie.net${icon}`}
                alt=""
                className="w-full h-full object-cover"
              />
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
            </>
          )}
        </div>
        {icon && dmg && dmgHash !== 3373582085 && (
          <div
            className="absolute -top-1 -left-1 rounded-full z-10"
            style={{
              width: Math.max(9, size * 0.2),
              height: Math.max(9, size * 0.2),
              background: dmg.color,
              border: "1.5px solid #0a0a12",
              boxShadow: `0 0 4px ${dmg.color}`,
            }}
          />
        )}
      </div>
    </HoverCard>
  );
}

// ---------------------------------------------------------------------------
// WeaponRow — icon + detailed inline text
// ---------------------------------------------------------------------------

const WEAPON_SLOT_LABELS = ["Cinétique", "Énergie", "Lourde"];

function WeaponRow({
  hash,
  slotIndex,
}: {
  hash: number | undefined;
  slotIndex: number;
}) {
  const def = useItemDef(hash);
  const d = def.data;
  const dmgHash = d?.defaultDamageTypeHash ?? d?.damageTypeHashes?.[0];
  const dmg = dmgMeta(dmgHash);
  const tier = d?.inventory?.tierType ?? 5;
  const isExotic = tier === 6;

  return (
    <div className="flex items-center gap-2.5">
      <ItemTile hash={hash} size={40} />
      <div className="min-w-0 flex-1">
        <div
          className={`text-[13px] font-bold leading-tight truncate ${
            isExotic ? "text-amber-300" : "text-white"
          }`}
        >
          {d?.displayProperties?.name ?? (hash ? "…" : "—")}
        </div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-white/45 font-semibold leading-tight truncate flex items-center gap-1.5 mt-0.5">
          <span>{WEAPON_SLOT_LABELS[slotIndex]}</span>
          {d?.itemTypeDisplayName && (
            <>
              <span className="text-white/20">·</span>
              <span className="truncate">{d.itemTypeDisplayName}</span>
            </>
          )}
          {dmg && (
            <>
              <span className="text-white/20">·</span>
              <span style={{ color: dmg.color }} className="font-bold">
                {dmg.label}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function LoadoutCard({
  loadout,
  index,
  characterId,
  membershipType,
  instanceMap,
  onRefresh,
}: {
  loadout: DestinyLoadoutComponent;
  index: number;
  characterId: string;
  membershipType: number;
  instanceMap: Map<string, InstanceInfo>;
  onRefresh: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const empty = !loadout.nameHash && !loadout.colorHash && !loadout.iconHash;

  const nameDef = useLoadoutName(loadout.nameHash);
  const colorDef = useLoadoutColor(loadout.colorHash);
  const iconDef = useLoadoutIcon(loadout.iconHash);
  const resolvedName = nameDef.data?.name;
  const colorPath = colorDef.data?.colorImagePath;
  const iconPath = iconDef.data?.iconImagePath;

  const items = useMemo(() => {
    return loadout.items ?? []
  }, [loadout.items]);

  const resolved = useMemo(
    () =>
      items.map((it: DestinyLoadoutItemComponent) => {
        const ref = it.itemInstanceId
          ? instanceMap.get(it.itemInstanceId)
          : undefined;
        return { hash: ref?.itemHash, power: ref?.power };
      }),
    [items, instanceMap]
  );

  // Batch-fetch all 9 main slot item defs.
  const defQueries = useQueries({
    queries: resolved.map((r) => ({
      queryKey: ["itemDef", r.hash, locale],
      queryFn: () => getItemDef(r.hash!, locale),
      enabled: !!r.hash,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  // Detect exotic armor / weapon in the loadout (skip subclass slot 8).
  const exoticHash = useMemo(() => {
    for (let i = 0; i < resolved.length; i++) {
      if (i === 8) continue;
      if (defQueries[i]?.data?.inventory?.tierType === 6) {
        return resolved[i].hash;
      }
    }
    return undefined;
  }, [defQueries, resolved]);

  // Subclass meta (name + element color)
  const subclassDef = defQueries[8]?.data;
  const subclassName = subclassDef?.displayProperties?.name;
  const subclassDmgHash =
    subclassDef?.defaultDamageTypeHash ?? subclassDef?.damageTypeHashes?.[0];
  const subclassDmg = dmgMeta(subclassDmgHash);

  // Fetch subclass plug defs (aspects / fragments / abilities)
  const subclassPlugs = useMemo(() => {
    return items[8]?.plugItemHashes ?? [];
  }, [items])

  const subclassPlugQueries = useQueries({
    queries: subclassPlugs.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      enabled: !!h,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  interface PlugInfo {
    name: string;
    icon?: string;
    hash?: number;
  }

  // Flat array of [slotIndex, plugHash] pairs so we can resolve each plug
  // individually while remembering which item slot it came from.
  const slotPlugPairs = useMemo(() => {
    const pairs: { slot: number; hash: number }[] = [];
    for (let s = 0; s < 8; s++) {
      for (const h of items[s]?.plugItemHashes ?? []) {
        pairs.push({ slot: s, hash: h });
      }
    }
    return pairs;
  }, [items]);

  const slotPlugQueries = useQueries({
    queries: slotPlugPairs.map(({ hash }) => ({
      queryKey: ["itemDef", hash, locale],
      queryFn: () => getItemDef(hash, locale),
      enabled: !!hash,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  /**
   * A plug is a "real" mod (not a random roll / intrinsic / cosmetic) when it
   * belongs to the Mods item category (59) and isn't an empty placeholder,
   * intrinsic frame, masterwork, or shader.
   */
  const modsPerSlot = useMemo(() => {
    const perSlot: PlugInfo[][] = [[], [], [], [], [], [], [], []];
    slotPlugPairs.forEach(({ slot, hash }, i) => {
      const d = slotPlugQueries[i]?.data;
      if (!d) return;
      const cats = d.itemCategoryHashes ?? [];
      if (!cats.includes(59)) return;
      const cat = (d.plug?.plugCategoryIdentifier ?? "").toLowerCase();
      if (
        cat.includes("intrinsic") ||
        cat.includes("masterwork") ||
        cat.includes("shader") ||
        cat.includes("empty")
      )
        return;
      const name = d.displayProperties?.name ?? "";
      const lname = name.toLowerCase();
      if (!name || lname.includes("vide") || lname.includes("empty")) return;
      perSlot[slot].push({ name, icon: d.displayProperties?.icon, hash });
    });
    return perSlot;
  }, [slotPlugPairs, slotPlugQueries]);

  const subclassBreakdown = useMemo(() => {
    const aspects: PlugInfo[] = [];
    const fragments: PlugInfo[] = [];
    let grenade: PlugInfo | undefined;
    let melee: PlugInfo | undefined;
    let classAbility: PlugInfo | undefined;
    let movement: PlugInfo | undefined;
    let superPlug: PlugInfo | undefined;
    subclassPlugQueries.forEach((q, i) => {
      const d = q.data;
      if (!d) return;
      const cat = (d.plug?.plugCategoryIdentifier ?? "").toLowerCase();
      const name = d.displayProperties?.name ?? "";
      const icon = d.displayProperties?.icon;
      const info: PlugInfo = { name, icon, hash: subclassPlugs[i] };
      if (cat.includes("aspect")) aspects.push(info);
      else if (cat.includes("fragment")) fragments.push(info);
      else if (cat.includes("grenade")) grenade = info;
      else if (cat.includes("melee")) melee = info;
      else if (cat.includes("class_ability") || cat.includes("classability"))
        classAbility = info;
      else if (cat.includes("movement")) movement = info;
      else if (cat.includes("super")) superPlug = info;
    });
    return {
      aspects,
      fragments,
      grenade,
      melee,
      classAbility,
      movement,
      superPlug,
    };
  }, [subclassPlugQueries, subclassPlugs]);

  // Aggregates
  const armorPowers = resolved
    .slice(3, 8)
    .map((r) => r.power)
    .filter((p): p is number => typeof p === "number");
  const avgPower = armorPowers.length
    ? Math.round(armorPowers.reduce((a, b) => a + b, 0) / armorPowers.length)
    : undefined;
  const unresolved = resolved.filter((r) => !r.hash).length;

  const withToken = () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) throw new Error("Non authentifié");
    return token;
  };

  const equipMut = useMutation({
    mutationFn: async () => {
      const token = withToken();
      await invoke("equip_loadout", {
        apiKey: API_KEY,
        accessToken: token,
        loadoutIndex: index,
        characterId,
        membershipType,
      });
    },
    onSuccess: () => {
      toast.success(`Loadout ${index + 1} équipé en jeu`);
      onRefresh();
    },
    onError: (e) => toast.error(`Échec équipement: ${(e as Error).message}`),
  });

  const snapshotMut = useMutation({
    mutationFn: async () => {
      const token = withToken();
      await invoke("snapshot_loadout", {
        apiKey: API_KEY,
        accessToken: token,
        loadoutIndex: index,
        characterId,
        membershipType,
        colorHash: loadout.colorHash ?? null,
        iconHash: loadout.iconHash ?? null,
        nameHash: loadout.nameHash ?? null,
      });
    },
    onSuccess: () => {
      toast.success(`Loadout ${index + 1} écrasé avec l'équipement actuel`);
      onRefresh();
    },
    onError: (e) => toast.error(`Échec MAJ: ${(e as Error).message}`),
  });

  const clearMut = useMutation({
    mutationFn: async () => {
      const token = withToken();
      await invoke("clear_loadout", {
        apiKey: API_KEY,
        accessToken: token,
        loadoutIndex: index,
        characterId,
        membershipType,
      });
    },
    onSuccess: () => {
      toast.success(`Loadout ${index + 1} effacé`);
      setConfirmClear(false);
      onRefresh();
    },
    onError: (e) => toast.error(`Échec: ${(e as Error).message}`),
  });

  const pending =
    equipMut.isPending || snapshotMut.isPending || clearMut.isPending;

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------------------------
  if (empty) {
    return (
      <div
        className="relative flex flex-col min-h-65 overflow-hidden"
        style={{
          clipPath:
            "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
          background:
            "radial-gradient(circle at 50% 0%, rgba(243,7,94,0.05), transparent 65%), rgba(7,7,13,0.7)",
          border: "1px dashed rgba(255,255,255,0.1)",
        }}
      >
        <div className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.3em] text-white/30 font-mono font-extrabold">
          #{String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div
            className="w-14 h-14 flex items-center justify-center text-2xl text-white/25"
            style={{
              clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              border: "1px dashed rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            +
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-bold text-center">
            {t("loadouts.empty")}
          </div>
        </div>
        <button
          onClick={() => snapshotMut.mutate()}
          disabled={pending}
          className="h-10 border-t border-white/5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-bungie-accent hover:bg-bungie-accent/10 transition-colors disabled:opacity-50"
        >
          {snapshotMut.isPending ? "…" : "+ Enregistrer équipement actuel"}
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // POPULATED CARD
  // ---------------------------------------------------------------------------

  const accentColor = subclassDmg?.color ?? "#f3075e";

  return (
    <>
      <div
        className="group relative flex flex-col transition-all duration-200 hover:-translate-y-0.5"
        style={{
          clipPath:
            "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
          background:
            "linear-gradient(180deg, rgba(14,10,22,0.95) 0%, rgba(7,7,13,0.98) 100%)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 12px 28px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Left element accent stripe */}
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 z-10 transition-all group-hover:w-0.75"
          style={{
            background: `linear-gradient(180deg, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

        {/* ============== HERO ============== */}
        <div className="relative px-4 pt-3.5 pb-3 flex items-start gap-3">
          {/* Slot number — monospaced */}
          <div className="absolute top-2 right-3 text-[9px] uppercase tracking-[0.3em] font-mono font-extrabold text-white/35">
            SLOT / {String(index + 1).padStart(2, "0")}
          </div>

          {/* Color + icon diamond */}
          <div
            className="relative w-13 h-13 shrink-0 overflow-hidden"
            style={{
              clipPath:
                "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              background: colorPath
                ? `url(https://www.bungie.net${colorPath}) center/cover`
                : "linear-gradient(135deg, rgba(243,7,94,0.4), rgba(168,85,247,0.35))",
            }}
          >
            <div
              className="absolute inset-0"
              style={{ boxShadow: "inset 0 0 18px rgba(0,0,0,0.6)" }}
            />
            {iconPath && (
              <img
                src={`https://www.bungie.net${iconPath}`}
                alt=""
                className="absolute inset-0 m-auto w-8 h-8"
                style={{
                  filter:
                    "drop-shadow(0 1px 2px rgba(0,0,0,0.9)) brightness(1.7) contrast(1.15)",
                }}
              />
            )}
          </div>

          {/* Name & meta */}
          <div className="min-w-0 flex-1 pr-12">
            <div className="font-extrabold text-[17px] leading-tight text-white truncate">
              {resolvedName || `Loadout ${index + 1}`}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] font-bold">
              {avgPower != null && (
                <span className="flex items-center gap-0.5 text-amber-300">
                  <span className="text-[11px]">◆</span>
                  <span className="font-mono">{avgPower}</span>
                </span>
              )}
              {subclassDmg && (
                <>
                  <span className="text-white/25">│</span>
                  <span style={{ color: subclassDmg.color }} className="font-bold">
                    {subclassDmg.label}
                  </span>
                </>
              )}
              <span className="text-white/25">│</span>
              <span className="text-white/55 font-mono">
                {items.length}/9
              </span>
              {unresolved > 0 && (
                <span
                  className="text-amber-300/80 ml-auto"
                  title={`${unresolved} objet(s) non trouvé(s) dans l'inventaire`}
                >
                  ⚠ {unresolved}
                </span>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* ============== WEAPONS ============== */}
        <Section title="Armes">
          <div className="space-y-1">
            {[0, 1, 2].map((i) => {
              const isOpen = selectedSlot === i;
              const mods = modsPerSlot[i] ?? [];
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSlot(isOpen ? null : i)
                    }
                    className={`w-full text-left rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                      isOpen
                        ? "bg-white/5 ring-1 ring-white/10"
                        : "hover:bg-white/3"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <WeaponRow hash={resolved[i]?.hash} slotIndex={i} />
                      {mods.length > 0 && (
                        <span
                          className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono font-bold shrink-0"
                          aria-hidden
                        >
                          {isOpen ? "▾" : "▸"} {mods.length}
                        </span>
                      )}
                    </div>
                  </button>
                  {isOpen && mods.length > 0 && (
                    <ModDrawer mods={mods} color="#8b92a5" />
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* ============== ARMOR ============== */}
        <Section title="Armure">
          <div className="flex items-center gap-1.5">
            {[3, 4, 5, 6, 7].map((i) => {
              const isOpen = selectedSlot === i;
              const mods = modsPerSlot[i] ?? [];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSlot(isOpen ? null : i)}
                  className="relative"
                >
                  <ItemTile hash={resolved[i]?.hash} size={36} />
                  {mods.length > 0 && (
                    <span
                      className="absolute -bottom-1 -right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-bungie-accent text-black text-[9px] font-extrabold flex items-center justify-center leading-none"
                      style={{ fontFamily: "monospace" }}
                    >
                      {mods.length}
                    </span>
                  )}
                  {isOpen && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: "0 0 0 2px #f3075e inset",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {selectedSlot != null &&
            selectedSlot >= 3 &&
            selectedSlot < 8 &&
            (modsPerSlot[selectedSlot]?.length ?? 0) > 0 && (
              <ModDrawer
                mods={modsPerSlot[selectedSlot]}
                color="#a78bfa"
              />
            )}
          {exoticHash && <ExoticCallout hash={exoticHash} />}
        </Section>

        <Divider />

        {/* ============== SUBCLASS ============== */}
        <Section title="Doctrine">
          {(() => {
            const isOpen = selectedSlot === 8;
            const hasAbilities =
              !!subclassBreakdown.grenade ||
              !!subclassBreakdown.melee ||
              !!subclassBreakdown.movement;
            const abilityCount =
              (subclassBreakdown.grenade ? 1 : 0) +
              (subclassBreakdown.melee ? 1 : 0) +
              (subclassBreakdown.movement ? 1 : 0);
            const hasDetails =
              hasAbilities ||
              subclassBreakdown.aspects.length > 0 ||
              subclassBreakdown.fragments.length > 0;
            return (
              <>
                <button
                  type="button"
                  disabled={!hasDetails}
                  onClick={() => setSelectedSlot(isOpen ? null : 8)}
                  className={`w-full text-left rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                    isOpen
                      ? "bg-white/5 ring-1 ring-white/10"
                      : hasDetails
                        ? "hover:bg-white/3"
                        : ""
                  } disabled:cursor-default`}
                >
                  <div className="flex items-center gap-3">
                    <ItemTile hash={resolved[8]?.hash} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-mono font-bold leading-none">
                        Super
                      </div>
                      <div
                        className="text-[14px] font-extrabold leading-tight truncate mt-0.5"
                        style={{ color: subclassDmg?.color ?? "#fff" }}
                      >
                        {subclassBreakdown.superPlug?.name ??
                          subclassName ??
                          "—"}
                      </div>
                    </div>
                    {hasDetails && (
                      <div className="flex items-center gap-2 shrink-0 text-[9px] uppercase tracking-[0.15em] font-mono font-bold text-white/45">
                        {abilityCount > 0 && (
                          <span>{abilityCount}<span className="text-white/30">c</span></span>
                        )}
                        {subclassBreakdown.aspects.length > 0 && (
                          <span>
                            {subclassBreakdown.aspects.length}
                            <span className="text-white/30">a</span>
                          </span>
                        )}
                        {subclassBreakdown.fragments.length > 0 && (
                          <span>
                            {subclassBreakdown.fragments.length}
                            <span className="text-white/30">f</span>
                          </span>
                        )}
                        <span className="text-white/50">{isOpen ? "▾" : "▸"}</span>
                      </div>
                    )}
                  </div>
                </button>

                {isOpen && hasDetails && (
                  <div
                    className="mt-2 px-2 py-2 rounded-md space-y-2.5"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      border: `1px solid ${accentColor}22`,
                    }}
                  >
                    {/* Abilities */}
                    {hasAbilities && (
                      <div>
                        <SubLabel title="Compétences" />
                        <div className="grid grid-cols-3 gap-1">
                          <AbilitySlot
                            label="Grenade"
                            info={subclassBreakdown.grenade}
                            color={accentColor}
                          />
                          <AbilitySlot
                            label="Mêlée"
                            info={subclassBreakdown.melee}
                            color={accentColor}
                          />
                          <AbilitySlot
                            label="Saut"
                            info={subclassBreakdown.movement}
                            color={accentColor}
                          />
                        </div>
                      </div>
                    )}

                    {/* Aspects */}
                    {subclassBreakdown.aspects.length > 0 && (
                      <div>
                        <SubLabel
                          title="Aspects"
                          count={subclassBreakdown.aspects.length}
                        />
                        <div className="grid grid-cols-3 gap-1">
                          {subclassBreakdown.aspects.map((a, i) => (
                            <AbilitySlot
                              key={i}
                              info={a}
                              color={accentColor}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fragments */}
                    {subclassBreakdown.fragments.length > 0 && (
                      <div>
                        <SubLabel
                          title="Fragments"
                          count={subclassBreakdown.fragments.length}
                        />
                        <div className="grid grid-cols-4 gap-1">
                          {subclassBreakdown.fragments.map((f, i) => (
                            <AbilitySlot
                              key={i}
                              info={f}
                              color={accentColor}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </Section>

        {/* push action bar to the bottom on short cards */}
        <div className="flex-1" />

        {/* ============== ACTION BAR ============== */}
        <div
          className="grid grid-cols-[1fr_auto_auto] border-t mt-auto"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => equipMut.mutate()}
            disabled={pending}
            className="h-11 flex items-center justify-center gap-2 bg-bungie-accent hover:brightness-110 text-black text-[12px] font-extrabold uppercase tracking-[0.22em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Équiper ce loadout en jeu"
          >
            {equipMut.isPending ? (
              "…"
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Appliquer</span>
              </>
            )}
          </button>
          <button
            onClick={() => snapshotMut.mutate()}
            disabled={pending}
            className="h-11 w-11 flex items-center justify-center text-white/60 hover:text-bungie-accent hover:bg-white/5 border-l border-white/5 transition-colors disabled:opacity-40"
            title="Écraser avec l'équipement actuel"
          >
            {snapshotMut.isPending ? (
              "…"
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={pending}
            className="h-11 w-11 flex items-center justify-center text-white/45 hover:text-red-300 hover:bg-red-500/10 border-l border-white/5 transition-colors disabled:opacity-40"
            title="Effacer ce slot"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title={`Effacer le loadout ${index + 1} ?`}
        message="Le slot de loadout sera vidé en jeu. Cette action est irréversible."
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={() => clearMut.mutate()}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Small structural pieces
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-2">
      <div className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-extrabold font-mono mb-1.5 flex items-center gap-2">
        <span>{title}</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      {children}
    </div>
  );
}

function SubLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="text-[8.5px] uppercase tracking-[0.22em] text-white/30 font-extrabold font-mono mb-1 flex items-center gap-1.5">
      <span>{title}</span>
      {count != null && <span className="text-white/45">·</span>}
      {count != null && <span className="text-white/45">{count}</span>}
    </div>
  );
}

function ModDrawer({
  mods,
  color,
}: {
  mods: { name: string; icon?: string }[];
  color: string;
}) {
  return (
    <div
      className="mt-2 px-2 py-2 rounded-md"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${color}22`,
      }}
    >
      <SubLabel title="Mods" count={mods.length} />
      <div className="grid grid-cols-4 gap-1">
        {mods.map((m, i) => (
          <AbilitySlot key={i} info={m} color={color} compact />
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px mx-4"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)",
      }}
    />
  );
}

function AbilitySlot({
  label,
  info,
  color,
  compact,
}: {
  label?: string;
  info?: { name: string; icon?: string; hash?: number };
  color: string;
  compact?: boolean;
}) {
  const iconSize = compact ? 26 : 30;
  const def = useItemDef(info?.hash);
  return (
    <HoverCard
      content={
        info?.hash ? <PlugHoverContent def={def.data} accent={color} /> : null
      }
    >
      <div
        className="flex flex-col items-center gap-0.5 py-1 px-1 rounded-sm min-w-0"
        style={{
          background: "rgba(255,255,255,0.015)",
          border: `1px solid ${info ? `${color}28` : "rgba(255,255,255,0.04)"}`,
        }}
      >
        <div
          className="overflow-hidden shrink-0"
          style={{
            width: iconSize,
            height: iconSize,
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${info ? `${color}50` : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {info?.icon && (
            <img
              src={`https://www.bungie.net${info.icon}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {label && !compact && (
          <div className="text-[7.5px] uppercase tracking-[0.18em] text-white/35 font-extrabold leading-none mt-0.5">
            {label}
          </div>
        )}
        {info?.name && (
          <div className="text-[9px] font-semibold text-white/85 leading-tight text-center truncate w-full mt-0.5">
            {info.name}
          </div>
        )}
      </div>
    </HoverCard>
  );
}

function ExoticCallout({ hash }: { hash: number }) {
  const def = useItemDef(hash);
  if (!def.data) return null;
  const name = def.data.displayProperties?.name;
  const icon = def.data.displayProperties?.icon;
  const typeName = def.data.itemTypeDisplayName;
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 mt-2"
      style={{
        background:
          "linear-gradient(90deg, rgba(206,165,46,0.16), rgba(206,165,46,0.02))",
        borderLeft: "2px solid rgba(206,165,46,0.75)",
      }}
    >
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="w-7 h-7"
          style={{ border: "1px solid rgba(206,165,46,0.5)" }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[8px] uppercase tracking-[0.25em] text-amber-300/85 font-mono font-extrabold flex items-center gap-1">
          <span>★ Exotique</span>
          {typeName && <span className="text-amber-200/55">· {typeName}</span>}
        </div>
        <div className="text-[12px] font-bold text-white truncate">{name}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Loadouts() {
  const { t } = useTranslation();
  const { profile, activeCharacterId } = useProfile();
  const membership = useSelectedMembership();
  const qc = useQueryClient();

  const instanceMap = useMemo(
    () => buildInstanceMap(profile.data),
    [profile.data]
  );

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  if (profile.isLoading) {
    return <p className="text-bungie-muted">{t("common.loading")}</p>;
  }
  if (!activeCharacterId) {
    return <p className="text-bungie-muted">{t("inventory.noCharacter")}</p>;
  }

  const raw =
    profile.data?.characterLoadouts?.data?.[activeCharacterId]?.loadouts;
  const loadouts: DestinyLoadoutComponent[] =
    raw && raw.length > 0
      ? raw
      : (Array.from({ length: 10 }, () => ({})) as DestinyLoadoutComponent[]);

  const populatedCount = loadouts.filter(
    (l) => l.nameHash || l.iconHash || l.colorHash
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold">{t("loadouts.title")}</h2>
          <p className="text-sm text-bungie-muted mt-0.5">
            {t("loadouts.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 h-9 rounded-full bg-bungie-accent/10 border border-bungie-accent/30 text-bungie-accent text-[11px] font-extrabold uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-bungie-accent animate-pulse" />
          {populatedCount} / {loadouts.length} actifs
        </div>
      </div>

      {!raw && (
        <p className="text-[11px] text-amber-300/90 -mt-2">
          ⚠ Les loadouts n'ont pas encore été détectés côté API — tu peux
          quand même créer un slot via « Enregistrer équipement actuel ».
        </p>
      )}

      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loadouts.map((l, i) => (
          <LoadoutCard
            key={i}
            loadout={l}
            index={i}
            characterId={activeCharacterId}
            membershipType={membership?.membershipType ?? 0}
            instanceMap={instanceMap}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}