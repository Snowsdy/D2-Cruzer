/* eslint-disable react-hooks/purity */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";
import { useManifestStore } from "@/store/manifest";
import { useCharacterStore } from "@/store/character";
import { getName } from "@/api/manifest";
import { useItemDef } from "@/hooks/useItemDef";
import { getItemDef } from "@/api/itemDef";
import { ItemTile } from "./ItemTile";
import { EquippedSlot } from "./EquippedSlot";
import { DropZone } from "./DropZone";
import { StatBar } from "./StatBar";
import { VaultColumn } from "./VaultColumn";
import { IconMail, IconScope, IconShield, IconSparkle } from "@/components/icon";
import { invoke } from "@tauri-apps/api/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

import { useSelectedMembership } from "@/hooks/useProfile";
import { toast } from "@/store/toast";
import {
  Buckets,
  WEAPON_BUCKETS,
  ARMOR_BUCKETS,
  GENERAL_BUCKETS,
} from "@/constants/buckets";
import {
  ARMOR_STAT_ORDER,
  ARMOR_STAT_MAX,
  armorTier,
  sumArmorStats,
  type StatValues,
} from "@/constants/stats";
import type {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2";

interface CharacterData {
  character: DestinyCharacterComponent;
  equipped: Map<number, DestinyItemComponent>;
  stash: Map<number, DestinyItemComponent[]>;
  postmaster: DestinyItemComponent[];
}

const TRANSFERABLE_BUCKETS = [
  ...WEAPON_BUCKETS,
  ...ARMOR_BUCKETS,
  ...GENERAL_BUCKETS,
] as readonly number[];

/* -------------------------------------------------------------------------- */
/* Character header — click to switch active, drop to transfer                */
/* -------------------------------------------------------------------------- */

function CharacterHeader({
  character,
}: {
  character: DestinyCharacterComponent;
}) {
  const manifest = useManifestStore((s) => s.manifest);
  const { activeCharacterId, setActiveCharacter } = useCharacterStore();
  const active = character.characterId === activeCharacterId;

  const className = manifest
    ? getName(manifest.DestinyClassDefinition, character.classHash)
    : "";
  const raceName = manifest
    ? getName(manifest.DestinyRaceDefinition, character.raceHash)
    : "";
  const bg = character.emblemBackgroundPath
    ? `https://www.bungie.net${character.emblemBackgroundPath}`
    : null;
  const emblem = character.emblemPath
    ? `https://www.bungie.net${character.emblemPath}`
    : null;
  const charStats = character.stats ?? {};

  return (
    <DropZone
      accept={(src) =>
        TRANSFERABLE_BUCKETS.includes(src.naturalSlotHash ?? src.bucketHash)
      }
      onDrop={async (actions, src) => {
        try {
          await actions.moveToCharacter.mutateAsync({
            itemInstanceId: src.itemInstanceId,
            itemReferenceHash: src.itemHash,
            fromCharacterId: src.ownerCharacterId,
            toCharacterId: character.characterId,
          });
        } catch (e) {
          console.error("Transfer to character failed:", e);
        }
      }}
      className={`rounded-xl cursor-pointer ${
        active ? "ring-2 ring-bungie-accent shadow-glow" : ""
      }`}
    >
      <button
        onClick={() => setActiveCharacter(character.characterId)}
        className="relative w-full rounded-xl overflow-hidden panel text-left"
        style={{
          backgroundImage: bg
            ? `linear-gradient(180deg, rgba(7,7,13,0.2), rgba(7,7,13,0.85)), url(${bg})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          {emblem && (
            <img
              src={emblem}
              alt=""
              className="w-12 h-12 rounded border border-white/15 bg-black/40 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/55 truncate">
              {raceName}
            </div>
            <div className="font-bold tracking-[0.12em] uppercase text-base truncate">
              {className}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/55">
              Power
            </div>
            <div className="text-2xl font-bold text-gradient-warm leading-none tabular-nums">
              ◆{character.light}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-1 px-4 pb-3">
          {ARMOR_STAT_ORDER.map((h) => {
            const value = charStats[h] ?? 0;
            const icon =
              manifest?.DestinyStatDefinition?.[h]?.displayProperties?.icon;
            const tier = armorTier(value);
            return (
              <div key={h} className="min-w-0">
                <div className="flex items-center justify-end gap-1.5 mb-0.5 leading-none">
                  {icon && (
                    <img
                      src={`https://www.bungie.net${icon}`}
                      alt=""
                      className="w-3.5 h-3.5 opacity-85 shrink-0"
                    />
                  )}
                  <span className="text-[11px] font-semibold tabular-nums">
                    {value}
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-bungie-accent/75 font-extrabold">
                    T{tier}
                  </span>
                </div>
                <StatBar value={value} max={ARMOR_STAT_MAX} />
              </div>
            );
          })}
        </div>
      </button>
    </DropZone>
  );
}


/* -------------------------------------------------------------------------- */
/* Section label                                                              */
/* -------------------------------------------------------------------------- */

function SectionLabel({
  label,
  icon,
  iconUrl,
}: {
  label: string;
  icon?: React.ReactNode;
  iconUrl?: string;
}) {
  return (
    <div className="py-2 pl-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-bungie-accent/80 font-semibold">
      {iconUrl ? (
        <img src={iconUrl} alt="" className="w-3.5 h-3.5 opacity-85" />
      ) : icon ? (
        <span className="text-bungie-accent">{icon}</span>
      ) : null}
      <span>{label}</span>
      <div className="flex-1 h-px bg-linear-to-r from-bungie-accent/30 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bucket cell — the entire row is a drop target                              */
/* -------------------------------------------------------------------------- */

function sortBySignificance(
  items: DestinyItemComponent[],
  showStats: "armor" | "weapon" | null,
  itemStats: Record<string, { stats: StatValues }>,
  itemInstances: Record<string, DestinyItemInstanceComponent>
): DestinyItemComponent[] {
  return [...items].sort((a, b) => {
    if (showStats === "weapon") {
      const pa = a.itemInstanceId ? itemInstances[a.itemInstanceId]?.primaryStat?.value ?? 0 : 0;
      const pb = b.itemInstanceId ? itemInstances[b.itemInstanceId]?.primaryStat?.value ?? 0 : 0;
      return pb - pa;
    }
    if (showStats === "armor") {
      const pa = a.itemInstanceId ? itemInstances[a.itemInstanceId]?.primaryStat?.value ?? 0 : 0;
      const pb = b.itemInstanceId ? itemInstances[b.itemInstanceId]?.primaryStat?.value ?? 0 : 0;
      if (pb !== pa) return pb - pa;
      const ta = a.itemInstanceId ? sumArmorStats(itemStats[a.itemInstanceId]?.stats) : 0;
      const tb = b.itemInstanceId ? sumArmorStats(itemStats[b.itemInstanceId]?.stats) : 0;
      return tb - ta;
    }
    return 0;
  });
}

function BucketCell({
  bucketHash,
  characterId,
  equipped,
  stash,
  showStats,
  itemStats,
  itemInstances,
  bucketName,
}: {
  bucketHash: number;
  characterId: string;
  equipped: DestinyItemComponent | undefined;
  stash: DestinyItemComponent[];
  showStats: "armor" | "weapon" | null;
  itemStats: Record<string, { stats: StatValues }>;
  itemInstances: Record<string, DestinyItemInstanceComponent>;
  bucketName: string;
}) {
  const total =
    showStats === "armor" && equipped?.itemInstanceId
      ? sumArmorStats(itemStats[equipped.itemInstanceId]?.stats)
      : 0;
  const power =
    showStats === "weapon" && equipped?.itemInstanceId
      ? itemInstances[equipped.itemInstanceId]?.primaryStat?.value
      : undefined;
  const statValue = power ?? (total || undefined);

  return (
    <DropZone
      accept={(src) =>
        (src.naturalSlotHash ?? src.bucketHash) === bucketHash
      }
      onDrop={async (actions, src) => {
        try {
          if (src.ownerCharacterId !== characterId) {
            await actions.moveToCharacter.mutateAsync({
              itemInstanceId: src.itemInstanceId,
              itemReferenceHash: src.itemHash,
              fromCharacterId: src.ownerCharacterId,
              toCharacterId: characterId,
            });
          }
        } catch (e) {
          console.error("BucketCell drop failed:", e);
        }
      }}
      className="rounded-md"
    >
      <div className="py-2 border-b border-bungie-border/30 last:border-b-0">
        <div className="text-[9px] uppercase tracking-[0.18em] text-bungie-muted/70 mb-1 pl-1">
          {bucketName}
        </div>
        <div className="flex items-start gap-1.5 flex-wrap">
          <div className="relative">
            <div
              className={`rounded-md ${
                equipped
                  ? "ring-1 ring-bungie-accent/60 ring-offset-2 ring-offset-bungie-bg"
                  : ""
              }`}
            >
              <EquippedSlot
                bucketHash={bucketHash}
                item={equipped}
                characterId={characterId}
                size="md"
              />
            </div>
            {statValue != null && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold tabular-nums text-bungie-accent bg-bungie-bg px-1 rounded shadow-sm whitespace-nowrap">
                {statValue}
              </div>
            )}
          </div>
          {sortBySignificance(stash, showStats, itemStats, itemInstances).map(
            (it) => (
              <ItemTile
                key={it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`}
                item={it}
                size="sm"
                ownerCharacterId={characterId}
              />
            )
          )}
        </div>
      </div>
    </DropZone>
  );
}

/* Postmaster + subclass cells (unchanged other than no drop) */

function PostmasterCell({
  items,
  characterId,
}: {
  items: DestinyItemComponent[];
  characterId: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const membership = useSelectedMembership();

  const pullMutation = useMutation({
    mutationFn: async (it: DestinyItemComponent) => {
      if (!membership) throw new Error("No membership");
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Not authenticated");
      await invoke("pull_from_postmaster", {
        apiKey: import.meta.env.VITE_BUNGIE_API_KEY,
        accessToken: token,
        itemReferenceHash: it.itemHash,
        stackSize: it.quantity ?? 1,
        itemId: it.itemInstanceId ?? "0",
        characterId,
        membershipType: membership.membershipType,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 1000);
      setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 2500);
    },
    onError: (e) => toast.error(`${t("inventory.pull")} · ${(e as Error).message}`),
  });

  const pullAll = async () => {
    for (const it of items) {
      try {
        await pullMutation.mutateAsync(it);
      } catch {
        /* already toasted */
      }
    }
    toast.success(`Postmaster vidé (${items.length})`);
  };

  const full = items.length >= 20;

  if (items.length === 0) {
    return (
      <div className="py-2 text-xs text-bungie-muted/30 pl-1 border-b border-bungie-border/30">
        —
      </div>
    );
  }

  return (
    <div
      className={`py-2 border-b border-bungie-border/30 ${
        full ? "bg-red-500/5" : ""
      }`}
    >
      <div className="flex items-center justify-between pl-1 mb-1.5">
        <div
          className={`text-[9px] uppercase tracking-[0.18em] inline-flex items-center gap-1 ${
            full ? "text-red-400 font-bold" : "text-bungie-muted/70"
          }`}
        >
          <IconMail size={11} /> Postmaster
          <span className="tabular-nums ml-1">
            {items.length}/21
          </span>
        </div>
        <button
          onClick={pullAll}
          disabled={pullMutation.isPending}
          className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-bungie-accent/15 border border-bungie-accent/40 text-bungie-accent hover:bg-bungie-accent/25 disabled:opacity-50 transition-all"
          title={t("inventory.pull")}
        >
          {pullMutation.isPending ? "…" : t("inventory.pull")}
        </button>
      </div>
      <div className="flex items-start gap-1 flex-wrap">
        {items.map((it) => (
          <div key={it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`} className="relative group/pm">
            <ItemTile
              item={it}
              size="sm"
              ownerCharacterId={characterId}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                pullMutation.mutate(it);
              }}
              disabled={pullMutation.isPending}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-bungie-accent text-black text-[10px] font-bold leading-none opacity-0 group-hover/pm:opacity-100 transition-opacity hover:scale-110"
              title="Récupérer cet item"
            >
              ↓
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const SUBCLASS_ELEMENT_RGB: Record<number, string> = {
  1: "255,255,255",   // Kinetic
  2: "121,187,235",   // Arc
  3: "240,99,30",     // Solar
  4: "177,133,223",   // Void
  6: "77,136,255",    // Stasis
  7: "53,228,136",    // Strand
};

function SubclassCell({ item }: { item: DestinyItemComponent | undefined }) {
  const def = useItemDef(item?.itemHash);
  if (!item) {
    return (
      <div className="py-2 text-xs text-bungie-muted/30 pl-1 border-b border-bungie-border/30">
        —
      </div>
    );
  }
  const icon = def.data?.displayProperties?.icon;
  const name = def.data?.displayProperties?.name ?? "";
  const damageType =
    def.data?.talentGrid?.hudDamageType ?? def.data?.damageTypes?.[0] ?? 0;
  const rgb = SUBCLASS_ELEMENT_RGB[damageType] ?? "243,7,94";
  return (
    <div className="py-2 border-b border-bungie-border/30">
      <div className="text-[9px] uppercase tracking-[0.18em] text-bungie-muted/70 mb-1 pl-1">
        Subclass
      </div>
      <div className="flex items-center gap-2 pl-1">
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="w-10 h-10"
            style={{ filter: `drop-shadow(0 0 10px rgba(${rgb},0.7))` }}
          />
        )}
        <div
          className="text-xs font-medium truncate"
          style={{ color: `rgb(${rgb})` }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export function DimGrid() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const { profile } = useProfile();
  const manifest = useManifestStore((s) => s.manifest);

  // Fetch defs for every vault item hash so we can route each one to its
  // natural slot (vault items all share bucketHash=GeneralVault at runtime).
  const vaultRaw = useMemo(() => {
    return profile.data?.profileInventory?.data?.items ?? []
  }, [profile.data]);
  const vaultUniqueHashes = useMemo(() => {
    const set = new Set<number>();
    for (const it of vaultRaw) set.add(it.itemHash);
    return [...set];
  }, [vaultRaw]);
  const vaultDefQueries = useQueries({
    queries: vaultUniqueHashes.map((h) => ({
      queryKey: ["itemDef", h, locale],
      queryFn: () => getItemDef(h, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });
  const vaultSlotByHash = useMemo(() => {
    const m = new Map<number, number>();
    vaultUniqueHashes.forEach((h, i) => {
      const d = vaultDefQueries[i]?.data;
      if (d?.inventory?.bucketTypeHash) m.set(h, d.inventory.bucketTypeHash);
    });
    return m;
  }, [vaultUniqueHashes, vaultDefQueries]);

  const { characters, vaultOtherCount } = useMemo(() => {
    const characters: CharacterData[] = [];

    if (!profile.data) return { characters, vaultOtherCount: 0 };

    const chars = profile.data.characters?.data ?? {};
    for (const cid of Object.keys(chars)) {
      const equipped = new Map<number, DestinyItemComponent>();
      const stash = new Map<number, DestinyItemComponent[]>();
      const postmaster: DestinyItemComponent[] = [];

      for (const it of profile.data.characterEquipment?.data?.[cid]?.items ?? []) {
        equipped.set(it.bucketHash, it);
      }
      for (const it of profile.data.characterInventories?.data?.[cid]?.items ?? []) {
        if (it.bucketHash === Buckets.LostItems) {
          postmaster.push(it);
        } else {
          const arr = stash.get(it.bucketHash) ?? [];
          arr.push(it);
          stash.set(it.bucketHash, arr);
        }
      }

      characters.push({ character: chars[cid], equipped, stash, postmaster });
    }
    characters.sort(
      (a, b) =>
        new Date(b.character.dateLastPlayed).getTime() -
        new Date(a.character.dateLastPlayed).getTime()
    );

    let vaultOtherCount = 0;
    const known = [...WEAPON_BUCKETS, ...ARMOR_BUCKETS, ...GENERAL_BUCKETS];
    for (const it of profile.data.profileInventory?.data?.items ?? []) {
      const slot = vaultSlotByHash.get(it.itemHash) ?? it.bucketHash;
      if (!known.includes(slot as never)) vaultOtherCount++;
    }

    return { characters, vaultOtherCount };
  }, [profile.data, vaultSlotByHash]);

  const itemStats = profile.data?.itemComponents?.stats?.data ?? {};
  const itemInstances = profile.data?.itemComponents?.instances?.data ?? {};

  if (profile.isLoading) {
    return <p className="text-bungie-muted">{t("common.loading")}</p>;
  }
  if (characters.length === 0) {
    return <p className="text-bungie-muted">{t("inventory.noCharacter")}</p>;
  }

  const bucketName = (h: number) =>
    manifest?.DestinyInventoryBucketDefinition?.[h]?.displayProperties?.name ?? "";

  const colTemplate = `repeat(${characters.length}, minmax(0, 1fr))`;
  const outerTemplate = `1fr minmax(320px, 400px)`;

  const bucketIcon = (h: number) => {
    const p = manifest?.DestinyInventoryBucketDefinition?.[h]?.displayProperties?.icon;
    return p ? `https://www.bungie.net${p}` : undefined;
  };

  const renderCharColumn = (c: CharacterData) => (
    <div key={c.character.characterId} className="panel px-2.5 py-1 flex flex-col">
      <PostmasterCell items={c.postmaster} characterId={c.character.characterId} />

      <SectionLabel
        iconUrl={bucketIcon(Buckets.Kinetic)}
        icon={<IconScope size={14} />}
        label={t("inventory.filter.weapons")}
      />
      {WEAPON_BUCKETS.map((h) => (
        <BucketCell
          key={h}
          bucketHash={h}
          characterId={c.character.characterId}
          equipped={c.equipped.get(h)}
          stash={c.stash.get(h) ?? []}
          showStats="weapon"
          itemStats={itemStats}
          itemInstances={itemInstances}
          bucketName={bucketName(h)}
        />
      ))}

      <SectionLabel
        iconUrl={bucketIcon(Buckets.Helmet)}
        icon={<IconShield size={14} />}
        label={t("inventory.filter.armor")}
      />
      {ARMOR_BUCKETS.map((h) => (
        <BucketCell
          key={h}
          bucketHash={h}
          characterId={c.character.characterId}
          equipped={c.equipped.get(h)}
          stash={c.stash.get(h) ?? []}
          showStats="armor"
          itemStats={itemStats}
          itemInstances={itemInstances}
          bucketName={bucketName(h)}
        />
      ))}

      <SectionLabel
        iconUrl={bucketIcon(Buckets.Ghost)}
        icon={<IconSparkle size={14} />}
        label="Général"
      />
      <SubclassCell item={c.equipped.get(Buckets.Subclass)} />
      {GENERAL_BUCKETS.filter((h) => h !== Buckets.Subclass).map((h) => (
        <BucketCell
          key={h}
          bucketHash={h}
          characterId={c.character.characterId}
          equipped={c.equipped.get(h)}
          stash={c.stash.get(h) ?? []}
          showStats={null}
          itemStats={itemStats}
          itemInstances={itemInstances}
          bucketName={bucketName(h)}
        />
      ))}
    </div>
  );

  // Outer two-column layout: characters (left) + persistent vault (right).
  // Grid rows let the right-column sticky anchor against the tall left-column.
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: outerTemplate }}
    >
      {/* Left: character headers + columns */}
      <div className="space-y-3 min-w-0">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: colTemplate }}
        >
          {characters.map((c) => (
            <CharacterHeader key={c.character.characterId} character={c.character} />
          ))}
        </div>

        <div
          className="grid gap-3 items-start"
          style={{ gridTemplateColumns: colTemplate }}
        >
          {characters.map(renderCharColumn)}
        </div>

        {vaultOtherCount > 0 && (
          <p className="text-xs text-bungie-muted pl-1">
            +{vaultOtherCount} {t("inventory.otherItems")}
          </p>
        )}
      </div>

      {/* Right: sticky vault — pinned while scrolling the left side */}
      <div className="self-start sticky top-4">
        <VaultColumn />
      </div>
    </div>
  );
}