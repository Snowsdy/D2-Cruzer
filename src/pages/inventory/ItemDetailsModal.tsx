import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useItemDef } from "@/hooks/useItemDef";
import { useManifestStore } from "@/store/manifest";
import { useTagsStore, TAG_META, TAG_ORDER, type ItemTag } from "@/store/tags";
import { useCompareStore } from "@/store/compare";
import { TagIcon } from "@/components/tag-icon";
import { PerksDisplay } from "@/components/perk-display";
import { useSelectedMembership } from "@/hooks/useProfile";
import { getItemInstance } from "@/api/itemInstance";
import type {
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2";
import { ARMOR_STAT_ORDER, isArmorStat, type StatValues } from "@/constants/stats";

const TIER_TEXT: Record<number, string> = {
  2: "text-zinc-300",
  3: "text-green-400",
  4: "text-blue-400",
  5: "text-purple-400",
  6: "text-yellow-300",
};

const TIER_GLOW: Record<number, string> = {
  5: "shadow-[0_0_28px_rgba(168,85,247,0.35)]",
  6: "shadow-[0_0_32px_rgba(250,204,21,0.45)]",
};

interface Props {
  item: DestinyItemComponent;
  instance?: DestinyItemInstanceComponent;
  stats?: StatValues;
  onClose: () => void;
}

export function ItemDetailsModal({ item, instance, stats, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const def = useItemDef(item.itemHash);
  const manifest = useManifestStore((s) => s.manifest);
  const d = def.data;

  // Fetch the live socket state for this instance so we show the actual
  // rolled perks (barrels, frames, stocks, masterwork, catalyst, …).
  const membership = useSelectedMembership();
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
  });

  const plugHashes = useMemo(() => {
    const instanceSockets = itemQuery.data?.sockets?.data?.sockets ?? [];
    if (instanceSockets.length > 0) {
      return instanceSockets.map((s) => s.plugHash ?? 0);
    }
    // Fallback to template defaults when instance sockets not yet fetched
    // (or when the item isn't instanced).
    return (
      d?.sockets?.socketEntries?.map(
        (e) => e.singleInitialItemHash ?? 0
      ) ?? []
    );
  }, [itemQuery.data, d]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!d) {
    return (
      <Backdrop onClose={onClose}>
        <p className="text-bungie-muted">{t("common.loading")}</p>
      </Backdrop>
    );
  }

  const tier = d.inventory?.tierType ?? 0;
  const tierColor = TIER_TEXT[tier] ?? "text-white";
  const glow = TIER_GLOW[tier] ?? "";
  const screenshot = d.screenshot ? `https://www.bungie.net${d.screenshot}` : null;
  const icon = d.displayProperties?.icon;
  const watermark = d.iconWatermark;
  const typeName = d.itemTypeDisplayName ?? "";
  const flavor = d.flavorText ?? "";
  const power = instance?.primaryStat?.value;
  const damageHash = d.defaultDamageType;
  const damageDef = damageHash
    ? manifest?.DestinyDamageTypeDefinition?.[damageHash]
    : undefined;
  const damageIcon = damageDef?.displayProperties?.icon;
  const damageName = damageDef?.displayProperties?.name;

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
          icon:
            manifest?.DestinyStatDefinition?.[Number(h)]?.displayProperties
              ?.icon,
        }))
    : [];

  const isArmorItem = rawEntries.some((e) => isArmorStat(e.hash));
  const statEntries = isArmorItem
    ? [...rawEntries].sort(
        (a, b) =>
          ARMOR_STAT_ORDER.indexOf(a.hash) - ARMOR_STAT_ORDER.indexOf(b.hash)
      )
    : rawEntries;

  return (
    <Backdrop onClose={onClose}>
      <div
        className={`relative rounded-xl overflow-hidden border-2 border-white/10 ${glow}`}
        style={{
          background: "#07070d",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Hero screenshot layer — clipped to the top half */}
        {screenshot && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.45) 0%, rgba(7,7,13,0.85) 55%, rgba(7,7,13,0.99) 100%), url(${screenshot})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        )}
        <div className="relative p-6 max-w-3xl w-[min(92vw,720px)] max-h-[85vh] overflow-auto">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden border-2 border-white/20 shrink-0">
              {icon && (
                <img
                  src={`https://www.bungie.net${icon}`}
                  alt=""
                  className="w-full h-full"
                />
              )}
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-2xl font-bold ${tierColor}`}>
                {d.displayProperties?.name}
              </h2>
              <div className="text-sm text-white/70 mt-0.5 flex items-center gap-2 flex-wrap">
                {damageIcon && (
                  <img
                    src={`https://www.bungie.net${damageIcon}`}
                    alt=""
                    className="w-4 h-4"
                  />
                )}
                <span>{typeName}</span>
                {damageName && damageHash !== 1 && (
                  <span className="text-white/50 text-xs">• {damageName}</span>
                )}
              </div>
              {power != null && (
                <div className="mt-2 text-2xl font-bold text-bungie-accent">
                  ◆ {power}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={onClose}
                aria-label={t("common.cancel")}
                className="text-white/50 hover:text-white text-xl leading-none px-2"
              >
                ✕
              </button>
              {item.itemInstanceId && (
                <button
                  onClick={() => {
                    useCompareStore.getState().add(item);
                    onClose();
                  }}
                  className="text-xs px-2 py-1 rounded-full border border-bungie-border hover:border-bungie-accent text-bungie-muted hover:text-bungie-accent transition-colors"
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
            <p className="mt-5 italic text-sm text-white/70 border-l-2 border-bungie-accent/60 pl-3">
              {flavor}
            </p>
          )}

          {statEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">
                {t("item.stats")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
                {statEntries.map((s) => (
                  <div key={s.hash} className="flex items-center gap-2">
                    {s.icon && (
                      <img
                        src={`https://www.bungie.net${s.icon}`}
                        alt=""
                        className="w-4 h-4 opacity-85"
                      />
                    )}
                    <span className="flex-1 text-sm text-white/75 truncate">
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
              <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">
                {t("item.description")}
              </h3>
              <p className="text-sm text-white/80 whitespace-pre-line">
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
  );
}

function TagSection({ instanceId }: { instanceId: string }) {
  const tag = useTagsStore((s) => s.getTag(instanceId));
  const note = useTagsStore((s) => s.getNote(instanceId));
  const setTag = useTagsStore((s) => s.setTag);
  const setNote = useTagsStore((s) => s.setNote);

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-widest text-white/50 mr-1">
          Tag
        </span>
        {TAG_ORDER.map((key: ItemTag) => {
          const m = TAG_META[key];
          const active = tag === key;
          return (
            <button
              key={key}
              onClick={() => setTag(instanceId, active ? null : key)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                active
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-bungie-border text-white/60 hover:text-white"
              }`}
              style={active ? { color: m.color, borderColor: m.color } : undefined}
            >
              <span className="inline-flex items-center gap-1.5">
                <span style={{ color: m.color }}>
                  <TagIcon tag={key} size={11} />
                </span>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(instanceId, e.target.value)}
        placeholder="Note personnelle…"
        rows={2}
        className="mt-3 w-full bg-black/50 border border-bungie-border rounded-md px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-bungie-accent/60 resize-none"
      />
    </div>
  );
}

function Backdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-9998 flex items-center justify-center p-4 fade-in-fast"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  );
}