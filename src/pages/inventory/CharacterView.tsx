import { useTranslation } from "react-i18next"
import type {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2"
import { useManifestStore } from "@/store/manifest"
import { getName } from "@/api/manifest"
import { useItemDef } from "@/hooks/useItemDef"
import { EquippedSlot } from "./EquippedSlot"
import { StatBar } from "./StatBar"
import { Buckets } from "@/constants/buckets"
import {
  ARMOR_STAT_ORDER,
  ARMOR_STAT_MAX,
  armorTier,
  sumArmorStats,
  type StatValues,
} from "@/constants/stats"

interface Props {
  character: DestinyCharacterComponent
  equipped: Map<number, DestinyItemComponent>
  itemStats: Record<string, { stats: StatValues }>
  itemInstances: Record<string, DestinyItemInstanceComponent>
}

function SlotName({ hash }: { hash: number | undefined }) {
  const def = useItemDef(hash)
  return (
    <div className="max-w-40 truncate text-[10px] font-medium text-white/70">
      {def.data?.displayProperties?.name ?? ""}
    </div>
  )
}

function ArmorRow({
  bucketHash,
  item,
  characterId,
  itemStats,
}: {
  bucketHash: number
  item: DestinyItemComponent | undefined
  characterId: string
  itemStats: Record<string, { stats: StatValues }>
}) {
  const total = item?.itemInstanceId
    ? sumArmorStats(itemStats[item.itemInstanceId]?.stats)
    : 0
  return (
    <div className="group flex items-center gap-3">
      <EquippedSlot
        bucketHash={bucketHash}
        item={item}
        characterId={characterId}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <SlotName hash={item?.itemHash} />
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-xl leading-none font-light text-white/90 tabular-nums">
            {total || (item ? "" : "—")}
          </span>
          {total > 0 && (
            <span className="text-[10px] font-medium text-white/40">/75</span>
          )}
        </div>
      </div>
    </div>
  )
}

function WeaponRow({
  bucketHash,
  item,
  characterId,
  itemInstances,
}: {
  bucketHash: number
  item: DestinyItemComponent | undefined
  characterId: string
  itemInstances: Record<string, DestinyItemInstanceComponent>
}) {
  const power = item?.itemInstanceId
    ? itemInstances[item.itemInstanceId]?.primaryStat?.value
    : undefined
  return (
    <div className="group flex items-center justify-end gap-3">
      <div className="min-w-0 flex-1 text-right">
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <SlotName hash={item?.itemHash} />
        </div>
        <div className="mt-0.5 flex items-baseline justify-end gap-2">
          <span className="text-xl leading-none font-light text-white/90 tabular-nums">
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
  )
}

// Element colors per damage type (DestinyDamageType enum) — used for subclass glow.
const ELEMENT_RGB: Record<number, string> = {
  1: "255,255,255", // Kinetic (white)
  2: "121,187,235", // Arc (blue)
  3: "240,99,30", // Solar (orange)
  4: "177,133,223", // Void (purple)
  6: "77,136,255", // Stasis (icy blue)
  7: "53,228,136", // Strand (green)
}

function CharacterPortrait({
  character,
  subclass,
}: {
  character: DestinyCharacterComponent
  subclass: DestinyItemComponent | undefined
}) {
  const manifest = useManifestStore((s) => s.manifest)
  const subclassDef = useItemDef(subclass?.itemHash)
  const className = manifest
    ? getName(manifest.DestinyClassDefinition, character.classHash)
    : ""
  const classIcon =
    manifest?.DestinyClassDefinition?.[character.classHash]?.displayProperties
      ?.icon
  const subclassIcon = subclassDef.data?.displayProperties?.icon
  const subclassName = subclassDef.data?.displayProperties?.name ?? ""
  const genderName = manifest
    ? getName(manifest.DestinyGenderDefinition, character.genderHash)
    : ""

  const damageType =
    subclassDef.data?.talentGrid?.hudDamageType ??
    subclassDef.data?.damageTypes?.[0] ??
    0
  const elementRgb = ELEMENT_RGB[damageType] ?? "243,7,94"

  return (
    <div className="relative flex w-64 flex-col items-center justify-center py-4">
      {classIcon && (
        <img
          src={`https://www.bungie.net${classIcon}`}
          alt=""
          className="pointer-events-none absolute inset-0 m-auto h-52 w-52 opacity-[0.08]"
          style={{ filter: "blur(2px)" }}
        />
      )}
      {/* Subclass element glow */}
      <div
        className="pointer-events-none absolute h-36 w-36 rounded-full"
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
            className="z-10 h-28 w-28"
            style={{ filter: `drop-shadow(0 0 24px rgba(${elementRgb},0.7))` }}
          />
        )}
        <div
          className="z-10 mt-2 text-[10px] font-medium tracking-[0.2em] uppercase"
          style={{ color: `rgb(${elementRgb})` }}
        >
          {subclassName}
        </div>
      </div>
      <div className="z-10 mt-5 text-center">
        <div className="text-3xl leading-tight font-extrabold tracking-[0.22em] text-white uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {className}
        </div>
        <div className="mt-2 text-[10px] tracking-[0.25em] text-white/50 uppercase">
          {genderName}
        </div>
      </div>
    </div>
  )
}

export function CharacterView({
  character,
  equipped,
  itemStats,
  itemInstances,
}: Props) {
  const { t, i18n } = useTranslation()
  const manifest = useManifestStore((s) => s.manifest)

  const raceName = manifest
    ? getName(manifest.DestinyRaceDefinition, character.raceHash)
    : ""
  const bg = character.emblemBackgroundPath
    ? `https://www.bungie.net${character.emblemBackgroundPath}`
    : null
  const lastPlayed = character.dateLastPlayed
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(character.dateLastPlayed))
    : ""
  const hours = Math.round(Number(character.minutesPlayedTotal ?? 0) / 60)
  const charStats = character.stats ?? {}
  const cid = character.characterId

  return (
    <div
      className="panel relative overflow-hidden rounded-2xl"
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
          <div className="text-[10px] font-medium tracking-[0.25em] text-white/50 uppercase">
            {raceName}
          </div>
          <div className="mt-1 text-[11px] text-white/60">
            {hours}h {t("inventory.playedTotal")}
            {lastPlayed && <span className="mx-2 text-white/30">•</span>}
            {lastPlayed && `${t("inventory.lastPlayed")}: ${lastPlayed}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium tracking-[0.25em] text-white/60 uppercase">
            {t("inventory.power")}
          </div>
          <div className="text-gradient-warm mt-1 text-5xl leading-none font-extrabold tabular-nums">
            ◆ {character.light}
          </div>
        </div>
      </div>

      {/* Main slots grid */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-8 px-8 pb-6">
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
        <div className="flex flex-col gap-2 border-l border-white/10 pl-4">
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
      <div className="grid grid-cols-6 gap-6 border-t border-white/10 bg-black/40 px-8 py-5">
        {ARMOR_STAT_ORDER.map((h) => {
          const value = charStats[h] ?? 0
          const name =
            manifest?.DestinyStatDefinition?.[h]?.displayProperties?.name ?? ""
          const icon =
            manifest?.DestinyStatDefinition?.[h]?.displayProperties?.icon
          const tier = armorTier(value)
          return (
            <div key={h} className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                {icon && (
                  <img
                    src={`https://www.bungie.net${icon}`}
                    alt=""
                    className="h-4 w-4 shrink-0 opacity-85"
                  />
                )}
                <span className="truncate text-[9px] font-medium tracking-[0.18em] text-white/55 uppercase">
                  {name}
                </span>
                <span className="ml-auto flex shrink-0 items-baseline gap-1 leading-none">
                  <span className="text-base font-semibold tabular-nums">
                    {value}
                  </span>
                  <span className="text-bungie-accent/80 font-mono text-[9px] font-extrabold tracking-[0.15em] uppercase">
                    T{tier}
                  </span>
                </span>
              </div>
              <StatBar value={value} max={ARMOR_STAT_MAX} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
