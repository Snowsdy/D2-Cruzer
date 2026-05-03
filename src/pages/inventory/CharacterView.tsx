import { useTranslation } from "react-i18next";
import type {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2";
import { useManifestStore } from "@/store/manifest";
import { getName } from "@/api/manifest";
import { useItemDef } from "@/hooks/useItemDef";
import { EquippedSlot } from "./EquippedSlot";
import { StatBar } from "./StatBar";
import { Buckets } from "@/constants/buckets";
import {
  ARMOR_STAT_ORDER,
  ARMOR_STAT_MAX,
  armorTier,
  sumArmorStats,
  type StatValues,
} from "@/constants/stats";

interface Props {
  character: DestinyCharacterComponent;
  equipped: Map<number, DestinyItemComponent>;
  itemStats: Record<string, { stats: StatValues }>;
  itemInstances: Record<string, DestinyItemInstanceComponent>;
}

function SlotName({ hash }: { hash: number | undefined }) {
  const def = useItemDef(hash);
  return (
    <div className="text-[10px] text-white/70 truncate max-w-40 font-medium">
      {def.data?.displayProperties?.name ?? ""}
    </div>
  );
}

function ArmorRow({
  bucketHash,
  item,
  characterId,
  itemStats,
}: {
  bucketHash: number;
  item: DestinyItemComponent | undefined;
  characterId: string;
  itemStats: Record<string, { stats: StatValues }>;
}) {
  const total = item?.itemInstanceId
    ? sumArmorStats(itemStats[item.itemInstanceId]?.stats)
    : 0;
  return (
    <div className="flex items-center gap-3 group">
      <EquippedSlot
        bucketHash={bucketHash}
        item={item}
        characterId={characterId}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <SlotName hash={item?.itemHash} />
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-light text-white/90 tabular-nums leading-none">
            {total || (item ? "" : "—")}
          </span>
          {total > 0 && (
            <span className="text-[10px] text-white/40 font-medium">
              /75
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WeaponRow({
  bucketHash,
  item,
  characterId,
  itemInstances,
}: {
  bucketHash: number;
  item: DestinyItemComponent | undefined;
  characterId: string;
  itemInstances: Record<string, DestinyItemInstanceComponent>;
}) {
  const power = item?.itemInstanceId
    ? itemInstances[item.itemInstanceId]?.primaryStat?.value
    : undefined;
  return (
    <div className="flex items-center gap-3 justify-end group">
      <div className="flex-1 min-w-0 text-right">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <SlotName hash={item?.itemHash} />
        </div>
        <div className="flex items-baseline gap-2 justify-end mt-0.5">
          <span className="text-xl font-light text-white/90 tabular-nums leading-none">
            {power ?? (item ? "" : "—")}
          </span>
        </div>
      </div>
      <EquippedSlot
        bucketHash={bucketHash}
        item={item}
        characterId={characterId}
        size="md"
      />
    </div>
  );
}

// Element colors per damage type (DestinyDamageType enum) — used for subclass glow.
const ELEMENT_RGB: Record<number, string> = {
  1: "255,255,255",   // Kinetic (white)
  2: "121,187,235",   // Arc (blue)
  3: "240,99,30",     // Solar (orange)
  4: "177,133,223",   // Void (purple)
  6: "77,136,255",    // Stasis (icy blue)
  7: "53,228,136",    // Strand (green)
};

function CharacterPortrait({
  character,
  subclass,
}: {
  character: DestinyCharacterComponent;
  subclass: DestinyItemComponent | undefined;
}) {
  const manifest = useManifestStore((s) => s.manifest);
  const subclassDef = useItemDef(subclass?.itemHash);
  const className = manifest
    ? getName(manifest.DestinyClassDefinition, character.classHash)
    : "";
  const classIcon =
    manifest?.DestinyClassDefinition?.[character.classHash]?.displayProperties
      ?.icon;
  const subclassIcon = subclassDef.data?.displayProperties?.icon;
  const subclassName = subclassDef.data?.displayProperties?.name ?? "";
  const genderName = manifest
    ? getName(manifest.DestinyGenderDefinition, character.genderHash)
    : "";

  const damageType =
    subclassDef.data?.talentGrid?.hudDamageType ??
    subclassDef.data?.damageTypes?.[0] ??
    0;
  const elementRgb = ELEMENT_RGB[damageType] ?? "243,7,94";

  return (
    <div className="w-64 flex flex-col items-center justify-center py-4 relative">
      {classIcon && (
        <img
          src={`https://www.bungie.net${classIcon}`}
          alt=""
          className="absolute inset-0 m-auto w-52 h-52 opacity-[0.08] pointer-events-none"
          style={{ filter: "blur(2px)" }}
        />
      )}
      {/* Subclass element glow */}
      <div
        className="absolute w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${elementRgb},0.35) 0%, rgba(${elementRgb},0) 65%)`,
          filter: "blur(8px)",
        }}
      />
      <div className="relative flex flex-col items-center">
        {subclassIcon && (
          <img
            src={`https://www.bungie.net${subclassIcon}`}
            alt={subclassName}
            className="w-28 h-28 z-10"
            style={{ filter: `drop-shadow(0 0 24px rgba(${elementRgb},0.7))` }}
          />
        )}
        <div
          className="mt-2 text-[10px] uppercase tracking-[0.2em] font-medium z-10"
          style={{ color: `rgb(${elementRgb})` }}
        >
          {subclassName}
        </div>
      </div>
      <div className="mt-5 text-center z-10">
        <div className="text-3xl font-extrabold tracking-[0.22em] uppercase text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight">
          {className}
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 mt-2">
          {genderName}
        </div>
      </div>
    </div>
  );
}

export function CharacterView({
  character,
  equipped,
  itemStats,
  itemInstances,
}: Props) {
  const { t, i18n } = useTranslation();
  const manifest = useManifestStore((s) => s.manifest);

  const raceName = manifest
    ? getName(manifest.DestinyRaceDefinition, character.raceHash)
    : "";
  const bg = character.emblemBackgroundPath
    ? `https://www.bungie.net${character.emblemBackgroundPath}`
    : null;
  const lastPlayed = character.dateLastPlayed
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(character.dateLastPlayed))
    : "";
  const hours = Math.round(Number(character.minutesPlayedTotal ?? 0) / 60);
  const charStats = character.stats ?? {};
  const cid = character.characterId;

  return (
    <div
      className="relative rounded-2xl overflow-hidden panel"
      style={{
        backgroundImage: bg
          ? `linear-gradient(180deg, rgba(7,7,13,0.3) 0%, rgba(7,7,13,0.85) 100%), url(${bg})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Race + Power header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-medium">
            {raceName}
          </div>
          <div className="text-[11px] text-white/60 mt-1">
            {hours}h {t("inventory.playedTotal")}
            {lastPlayed && <span className="mx-2 text-white/30">•</span>}
            {lastPlayed && `${t("inventory.lastPlayed")}: ${lastPlayed}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">
            {t("inventory.power")}
          </div>
          <div className="text-5xl font-extrabold leading-none mt-1 text-gradient-warm tabular-nums">
            ◆ {character.light}
          </div>
        </div>
      </div>

      {/* Main slots grid */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-8 px-8 pb-6 items-center">
        {/* Weapons (left) */}
        <div className="flex flex-col gap-4">
          <WeaponRow
            bucketHash={Buckets.Kinetic}
            item={equipped.get(Buckets.Kinetic)}
            characterId={cid}
            itemInstances={itemInstances}
          />
          <WeaponRow
            bucketHash={Buckets.Energy}
            item={equipped.get(Buckets.Energy)}
            characterId={cid}
            itemInstances={itemInstances}
          />
          <WeaponRow
            bucketHash={Buckets.Power}
            item={equipped.get(Buckets.Power)}
            characterId={cid}
            itemInstances={itemInstances}
          />
        </div>

        {/* Center portrait */}
        <CharacterPortrait
          character={character}
          subclass={equipped.get(Buckets.Subclass)}
        />

        {/* Armor (right) */}
        <div className="flex flex-col gap-4">
          <ArmorRow
            bucketHash={Buckets.Helmet}
            item={equipped.get(Buckets.Helmet)}
            characterId={cid}
            itemStats={itemStats}
          />
          <ArmorRow
            bucketHash={Buckets.Arms}
            item={equipped.get(Buckets.Arms)}
            characterId={cid}
            itemStats={itemStats}
          />
          <ArmorRow
            bucketHash={Buckets.Chest}
            item={equipped.get(Buckets.Chest)}
            characterId={cid}
            itemStats={itemStats}
          />
          <ArmorRow
            bucketHash={Buckets.Legs}
            item={equipped.get(Buckets.Legs)}
            characterId={cid}
            itemStats={itemStats}
          />
          <ArmorRow
            bucketHash={Buckets.ClassItem}
            item={equipped.get(Buckets.ClassItem)}
            characterId={cid}
            itemStats={itemStats}
          />
        </div>

        {/* General column */}
        <div className="flex flex-col gap-2 pl-4 border-l border-white/10">
          {[
            Buckets.Ghost,
            Buckets.Sparrow,
            Buckets.Ship,
            Buckets.Emblem,
            Buckets.SeasonalArtifact,
            Buckets.Finisher,
          ].map((h) => (
            <EquippedSlot
              key={h}
              bucketHash={h}
              item={equipped.get(h)}
              characterId={cid}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Stats row with bars (Armor 3.0 — max 200 per stat, tiers at every 10) */}
      <div className="grid grid-cols-6 gap-6 px-8 py-5 border-t border-white/10 bg-black/40">
        {ARMOR_STAT_ORDER.map((h) => {
          const value = charStats[h] ?? 0;
          const name =
            manifest?.DestinyStatDefinition?.[h]?.displayProperties?.name ?? "";
          const icon =
            manifest?.DestinyStatDefinition?.[h]?.displayProperties?.icon;
          const tier = armorTier(value);
          return (
            <div key={h} className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {icon && (
                  <img
                    src={`https://www.bungie.net${icon}`}
                    alt=""
                    className="w-4 h-4 opacity-85 shrink-0"
                  />
                )}
                <span className="text-[9px] uppercase tracking-[0.18em] text-white/55 truncate font-medium">
                  {name}
                </span>
                <span className="ml-auto flex items-baseline gap-1 leading-none shrink-0">
                  <span className="text-base font-semibold tabular-nums">
                    {value}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-bungie-accent/80 font-extrabold">
                    T{tier}
                  </span>
                </span>
              </div>
              <StatBar value={value} max={ARMOR_STAT_MAX} />
            </div>
          );
        })}
      </div>
    </div>
  );
}