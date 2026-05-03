import { memo } from "react";
import { useItemDef } from "@/hooks/useItemDef";
import { useUiStore } from "@/store/ui";
import { useDragStore } from "@/store/drag";
import { useSearchStore } from "@/store/search";
import { useTagsStore, TAG_META } from "@/store/tags";
import { TagIcon } from "@/components/tag-icon";
import { useManifestStore } from "@/store/manifest";
import { useProfile } from "@/hooks/useProfile";
import { parseQuery, matches } from "@/utils/itemFilter";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

const TIER_COLOR: Record<number, string> = {
  2: "border-zinc-500",
  3: "border-green-500",
  4: "border-blue-500",
  5: "border-purple-500",
  6: "border-yellow-400",
};

const TIER_NAME_COLOR: Record<number, string> = {
  2: "text-zinc-300",
  3: "text-green-400",
  4: "text-blue-400",
  5: "text-purple-400",
  6: "text-yellow-300",
};

interface Props {
  item: DestinyItemComponent;
  size?: "sm" | "md" | "lg";
  ownerCharacterId?: string | null;
}

function ItemTileInner({ item, size = "md", ownerCharacterId = null }: Props) {
  const def = useItemDef(item.itemHash);
  const d = def.data;

  const tier = d?.inventory?.tierType ?? 0;
  const border = TIER_COLOR[tier] ?? "border-bungie-border";
  const tierColor = TIER_NAME_COLOR[tier] ?? "text-white";
  const iconPath = d?.displayProperties?.icon;
  const watermark = d?.iconWatermark;
  const name = d?.displayProperties?.name ?? "…";
  const typeName = d?.itemTypeDisplayName ?? "";

  const dim =
    size === "sm" ? "w-12 h-12" : size === "lg" ? "w-20 h-20" : "w-16 h-16";

  const stack = (item.quantity ?? 1) > 1 ? item.quantity : null;
  const power = (item as { primaryStat?: { value: number } }).primaryStat?.value;

  const manifest = useManifestStore((s) => s.manifest);
  const damageHash = d?.defaultDamageType;
  const damageIcon = damageHash
    ? manifest?.DestinyDamageTypeDefinition?.[damageHash]?.displayProperties?.icon
    : undefined;

  const selectItem = useUiStore((s) => s.selectItem);
  const setDragging = useDragStore((s) => s.setDragging);

  const query = useSearchStore((s) => s.query);
  const tag = useTagsStore((s) => s.getTag(item.itemInstanceId));
  const { profile } = useProfile();

  // Short-circuit predicate parsing when no search is active — the common
  // case. Avoids parseQuery() + matches() on every render of 100+ tiles.
  const hasQuery = query.trim().length > 0;
  const predicates = hasQuery ? parseQuery(query) : [];
  const itemStats =
    hasQuery && item.itemInstanceId
      ? profile.data?.itemComponents?.stats?.data?.[item.itemInstanceId]?.stats
      : undefined;
  const isDimmed =
    predicates.length > 0 &&
    !matches(predicates, item, {
      def: d,
      stats: itemStats,
      power,
      tag,
      equipped: false,
      inVault: ownerCharacterId === null,
    });

  const draggable = !!item.itemInstanceId;
  const tagMeta = tag ? TAG_META[tag] : null;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectItem(item);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectItem(item)}
      onKeyDown={handleKey}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) {
          e.preventDefault();
          return;
        }
        setDragging({
          item,
          ownerCharacterId,
          naturalSlotHash: d?.inventory?.bucketTypeHash,
        });
        try {
          e.dataTransfer.setData("text/plain", item.itemInstanceId ?? "");
          e.dataTransfer.effectAllowed = "move";
          // Force Chrome/WebView2 to use the tile itself as the drag image,
          // avoiding silent drag-abort on cross-origin image snapshot.
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          e.dataTransfer.setDragImage(
            e.currentTarget as HTMLElement,
            rect.width / 2,
            rect.height / 2
          );
        } catch {
          /* setDragImage may throw in exotic contexts — ignore */
        }
      }}
      onDragEnd={() => setDragging(null)}
      className={`cv-auto-tile relative ${dim} rounded-md border-2 bg-bungie-bg overflow-hidden group ${border} cursor-grab active:cursor-grabbing select-none transition-all focus:outline-none focus:ring-2 focus:ring-bungie-accent/60 ${
        isDimmed ? "opacity-25 saturate-50" : "hover:brightness-110"
      }`}
      style={{ WebkitUserDrag: "element" } as React.CSSProperties}
    >
      {iconPath && (
        <img
          src={`https://www.bungie.net${iconPath}`}
          alt={name}
          className="w-full h-full pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      )}
      {watermark && (
        <img
          src={`https://www.bungie.net${watermark}`}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          draggable={false}
        />
      )}
      {damageIcon && (
        <img
          src={`https://www.bungie.net${damageIcon}`}
          alt=""
          className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/50 rounded-bl pointer-events-none"
          draggable={false}
        />
      )}
      {tag && tagMeta && (
        <span
          className="absolute top-0 left-0 px-0.5 py-0.5 rounded-br pointer-events-none flex items-center justify-center"
          style={{ color: tagMeta.color, background: "rgba(0,0,0,0.75)" }}
        >
          <TagIcon tag={tag} size={10} />
        </span>
      )}
      {power != null && (
        <span className="absolute bottom-0 right-0 bg-black/75 text-[10px] leading-none px-1 py-px rounded-tl text-bungie-accent font-bold pointer-events-none">
          {power}
        </span>
      )}
      {stack && (
        <span className="absolute bottom-0 left-0 bg-black/75 text-[10px] leading-none px-1 py-px rounded-tr text-white font-bold pointer-events-none">
          {stack}
        </span>
      )}

      <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-black/95 border border-white/15 rounded-md px-3 py-2 shadow-xl text-left">
          <div className={`font-semibold text-sm ${tierColor}`}>{name}</div>
          {typeName && (
            <div className="text-[11px] text-white/60 mt-0.5">{typeName}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized so grids that render 100+ tiles don't re-render every child on
 * every parent update. The custom comparator only looks at the stable
 * identity fields — mutable instance data (power, damage, etc.) flows
 * through Bungie's itemInstanceId, which is a stable per-render primitive.
 */
export const ItemTile = memo(ItemTileInner, (a, b) => {
  return (
    a.item.itemHash === b.item.itemHash &&
    a.item.itemInstanceId === b.item.itemInstanceId &&
    a.item.quantity === b.item.quantity &&
    a.size === b.size &&
    a.ownerCharacterId === b.ownerCharacterId
  );
});