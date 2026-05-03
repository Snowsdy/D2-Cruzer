import { useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useItemDef } from "@/hooks/useItemDef"
import { useManifestStore } from "@/store/manifest"
import { useTagsStore, TAG_META, TAG_ORDER, type ItemTag } from "@/store/tags"
import { useCompareStore } from "@/store/compare"
import { TagIcon } from "@/components/tag-icon"
import { PerksDisplay } from "@/components/perk-display"
import { useSelectedMembership } from "@/hooks/useProfile"
import { getItemInstance } from "@/api/itemInstance"
import type {
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2"
import {
  ARMOR_STAT_ORDER,
  isArmorStat,
  type StatValues,
} from "@/constants/stats"

const TIER_TEXT: Record<number, string> = {
  2: "text-zinc-300",
  3: "text-green-400",
  4: "text-blue-400",
  5: "text-purple-400",
  6: "text-yellow-300",
}

const TIER_GLOW: Record<number, string> = {
  5: "shadow-[0_0_28px_rgba(168,85,247,0.35)]",
  6: "shadow-[0_0_32px_rgba(250,204,21,0.45)]",
}

interface Props {
  item: DestinyItemComponent
  instance?: DestinyItemInstanceComponent
  stats?: StatValues
  onClose: () => void
}

export function ItemDetailsModal({ item, instance, stats, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const def = useItemDef(item.itemHash)
  const manifest = useManifestStore((s) => s.manifest)
  const d = def.data

  // Fetch the live socket state for this instance so we show the actual
  // rolled perks (barrels, frames, stocks, masterwork, catalyst, …).
  const membership = useSelectedMembership()
  const itemQuery = useQuery({
    queryKey: [
      "itemInstance",
      membership?.membershipType,
      membership?.membershipId,
      item.itemInstanceId,
    ],
    queryFn: () =>
      getItemInstance(
        membership!.membershipType,
        membership!.membershipId,
        item.itemInstanceId!
      ),
    enabled: !!membership && !!item.itemInstanceId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const plugHashes = useMemo(() => {
    const instanceSockets = itemQuery.data?.sockets?.data?.sockets ?? []
    if (instanceSockets.length > 0) {
      return instanceSockets.map((s) => s.plugHash ?? 0)
    }
    // Fallback to template defaults when instance sockets not yet fetched
    // (or when the item isn't instanced).
    return (
      d?.sockets?.socketEntries?.map((e) => e.singleInitialItemHash ?? 0) ?? []
    )
  }, [itemQuery.data, d])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!d) {
    return (
      <Backdrop onClose={onClose}>
        <p className="text-bungie-muted">{t("common.loading")}</p>
      </Backdrop>
    )
  }

  const tier = d.inventory?.tierType ?? 0
  const tierColor = TIER_TEXT[tier] ?? "text-white"
  const glow = TIER_GLOW[tier] ?? ""
  const screenshot = d.screenshot
    ? `https://www.bungie.net${d.screenshot}`
    : null
  const icon = d.displayProperties?.icon
  const watermark = d.iconWatermark
  const typeName = d.itemTypeDisplayName ?? ""
  const flavor = d.flavorText ?? ""
  const power = instance?.primaryStat?.value
  const damageHash = d.defaultDamageType
  const damageDef = damageHash
    ? manifest?.DestinyDamageTypeDefinition?.[damageHash]
    : undefined
  const damageIcon = damageDef?.displayProperties?.icon
  const damageName = damageDef?.displayProperties?.name

  // Weapon/armor stats — display by manifest stat order (investmentStats is best when instance stats absent).
  // For armor items, force the canonical Armor 3.0 order (Armes → Santé → Classe → Grenade → Super → Mêlée)
  // so the modal always reads the same way regardless of how stats are keyed.
  const rawEntries = stats
    ? Object.entries(stats)
        .filter(([h]) => manifest?.DestinyStatDefinition?.[Number(h)])
        .map(([h, v]) => ({
          hash: Number(h),
          value: v.value,
          name:
            manifest?.DestinyStatDefinition?.[Number(h)]?.displayProperties
              ?.name ?? "",
          icon: manifest?.DestinyStatDefinition?.[Number(h)]?.displayProperties
            ?.icon,
        }))
    : []

  const isArmorItem = rawEntries.some((e) => isArmorStat(e.hash))
  const statEntries = isArmorItem
    ? [...rawEntries].sort(
        (a, b) =>
          ARMOR_STAT_ORDER.indexOf(a.hash) - ARMOR_STAT_ORDER.indexOf(b.hash)
      )
    : rawEntries

  return (
    <Backdrop onClose={onClose}>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-white/10 ${glow}`}
        style={{
          background: "#07070d",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Hero screenshot layer — clipped to the top half */}
        {screenshot && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.45) 0%, rgba(7,7,13,0.85) 55%, rgba(7,7,13,0.99) 100%), url(${screenshot})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        )}
        <div className="relative max-h-[85vh] w-[min(92vw,720px)] max-w-3xl overflow-auto p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 border-white/20">
              {icon && (
                <img
                  src={`https://www.bungie.net${icon}`}
                  alt=""
                  className="h-full w-full"
                />
              )}
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`text-2xl font-bold ${tierColor}`}>
                {d.displayProperties?.name}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-white/70">
                {damageIcon && (
                  <img
                    src={`https://www.bungie.net${damageIcon}`}
                    alt=""
                    className="h-4 w-4"
                  />
                )}
                <span>{typeName}</span>
                {damageName && damageHash !== 1 && (
                  <span className="text-xs text-white/50">• {damageName}</span>
                )}
              </div>
              {power != null && (
                <div className="text-bungie-accent mt-2 text-2xl font-bold">
                  ◆ {power}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={onClose}
                aria-label={t("common.cancel")}
                className="px-2 text-xl leading-none text-white/50 hover:text-white"
              >
                ✕
              </button>
              {item.itemInstanceId && (
                <button
                  onClick={() => {
                    useCompareStore.getState().add(item)
                    onClose()
                  }}
                  className="border-bungie-border hover:border-bungie-accent text-bungie-muted hover:text-bungie-accent rounded-full border px-2 py-1 text-xs transition-colors"
                >
                  ⇄ {t("compare.add")}
                </button>
              )}
            </div>
          </div>

          {item.itemInstanceId && (
            <TagSection instanceId={item.itemInstanceId} />
          )}

          {flavor && (
            <p className="border-bungie-accent/60 mt-5 border-l-2 pl-3 text-sm text-white/70 italic">
              {flavor}
            </p>
          )}

          {statEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs tracking-widest text-white/50 uppercase">
                {t("item.stats")}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-3">
                {statEntries.map((s) => (
                  <div key={s.hash} className="flex items-center gap-2">
                    {s.icon && (
                      <img
                        src={`https://www.bungie.net${s.icon}`}
                        alt=""
                        className="h-4 w-4 opacity-85"
                      />
                    )}
                    <span className="flex-1 truncate text-sm text-white/75">
                      {s.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.displayProperties?.description && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs tracking-widest text-white/50 uppercase">
                {t("item.description")}
              </h3>
              <p className="text-sm whitespace-pre-line text-white/80">
                {d.displayProperties.description}
              </p>
            </div>
          )}

          {/* Rolled perks, catalyst, masterwork — live sockets from Bungie */}
          <PerksDisplay
            plugHashes={plugHashes}
            isExotic={d.inventory?.tierType === 6}
            locale={i18n.language}
          />
        </div>
      </div>
    </Backdrop>
  )
}

function TagSection({ instanceId }: { instanceId: string }) {
  const tag = useTagsStore((s) => s.getTag(instanceId))
  const note = useTagsStore((s) => s.getNote(instanceId))
  const setTag = useTagsStore((s) => s.setTag)
  const setNote = useTagsStore((s) => s.setNote)

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] tracking-widest text-white/50 uppercase">
          Tag
        </span>
        {TAG_ORDER.map((key: ItemTag) => {
          const m = TAG_META[key]
          const active = tag === key
          return (
            <button
              key={key}
              onClick={() => setTag(instanceId, active ? null : key)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                active
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-bungie-border text-white/60 hover:text-white"
              }`}
              style={
                active ? { color: m.color, borderColor: m.color } : undefined
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <span style={{ color: m.color }}>
                  <TagIcon tag={key} size={11} />
                </span>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(instanceId, e.target.value)}
        placeholder="Note personnelle…"
        rows={2}
        className="border-bungie-border focus:border-bungie-accent/60 mt-3 w-full resize-none rounded-md border bg-black/50 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none"
      />
    </div>
  )
}

function Backdrop({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  if (typeof document === "undefined") return null
  return createPortal(
    <div
      className="fade-in-fast fixed inset-0 z-9998 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}
