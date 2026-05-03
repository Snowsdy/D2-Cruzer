import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useManifestStore } from "@/store/manifest";
import { useItemDef } from "@/hooks/useItemDef";
import { getVendorDef } from "@/api/vendors";

type Source =
  | "category"
  | "bucket"
  | "stat"
  | "damage"
  | "class"
  | "item"
  | "activityMode"
  | "vendor"
  | "vendorCrest";

interface Props {
  source: Source;
  hash: number;
  size?: number;
  className?: string;
  fallback?: React.ReactNode;
  alt?: string;
  /**
   * Render the icon as a monochrome glyph masked with this color.
   * Use for grayscale PNGs like vendor crests so they take on an
   * accent color instead of appearing washed out.
   */
  tint?: string;
}

/**
 * Renders a Destiny 2 game icon from the manifest by hash.
 * Falls back to the `fallback` prop if the icon isn't available yet
 * or the target hash has no icon defined.
 */
export function BungieIcon({
  source,
  hash,
  size = 16,
  className = "",
  fallback,
  alt = "",
  tint,
}: Props) {
  const manifest = useManifestStore((s) => s.manifest);
  const itemDef = useItemDef(source === "item" ? hash : undefined);
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const vendorDef = useQuery({
    queryKey: ["vendorDef", hash, locale],
    queryFn: () => getVendorDef(hash, locale),
    enabled: source === "vendor" || source === "vendorCrest",
    staleTime: Infinity,
    gcTime: Infinity,
  });

  let icon: string | undefined;

  if (source === "item") {
    icon = itemDef.data?.displayProperties?.icon;
  } else if (source === "vendor") {
    icon = vendorDef.data?.displayProperties?.icon;
  } else if (source === "vendorCrest") {
    const dp = vendorDef.data?.displayProperties;
    icon =
      dp?.smallTransparentIcon ||
      dp?.mapIcon ||
      dp?.icon;
  } else if (manifest) {
    switch (source) {
      case "category":
        icon =
          manifest.DestinyItemCategoryDefinition?.[hash]?.displayProperties?.icon;
        break;
      case "bucket":
        icon =
          manifest.DestinyInventoryBucketDefinition?.[hash]?.displayProperties
            ?.icon;
        break;
      case "stat":
        icon =
          manifest.DestinyStatDefinition?.[hash]?.displayProperties?.icon;
        break;
      case "damage":
        icon =
          manifest.DestinyDamageTypeDefinition?.[hash]?.displayProperties?.icon;
        break;
      case "class":
        icon =
          manifest.DestinyClassDefinition?.[hash]?.displayProperties?.icon;
        break;
      case "activityMode":
        icon =
          manifest.DestinyActivityModeDefinition?.[hash]?.displayProperties
            ?.icon;
        break;
    }
  }

  if (!icon) {
    if (import.meta.env.DEV) {
      const present =
        manifest && source !== "item"
          ? !!(
              (source === "class" && manifest.DestinyClassDefinition?.[hash]) ||
              (source === "bucket" && manifest.DestinyInventoryBucketDefinition?.[hash]) ||
              (source === "stat" && manifest.DestinyStatDefinition?.[hash]) ||
              (source === "damage" && manifest.DestinyDamageTypeDefinition?.[hash]) ||
              (source === "category" && manifest.DestinyItemCategoryDefinition?.[hash])
            )
          : null;
      console.warn(`[BungieIcon] no icon ${source}:${hash}`, {
        manifestLoaded: !!manifest,
        tablePresent: present,
        itemDef: source === "item" ? itemDef.data : undefined,
        itemStatus: source === "item" ? itemDef.status : undefined,
      });
    }
    return <>{fallback}</>;
  }

  const src = icon.startsWith("http")
    ? icon
    : `https://www.bungie.net${icon}`;

  if (tint) {
    // Use the alpha channel of the icon as a CSS mask and fill with `tint`.
    // Perfect for monochrome glyphs (vendor crests, stat icons) that need
    // to match an accent color.
    return (
      <span
        aria-label={alt}
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          backgroundColor: tint,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
      onError={(e) => {
        if (import.meta.env.DEV) {
          console.warn(`[BungieIcon] image failed: ${src}`, e);
        }
      }}
    />
  );
}
