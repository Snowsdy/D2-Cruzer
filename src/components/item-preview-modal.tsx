import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useItemDef } from "@/hooks/useItemDef";
import { useManifestStore } from "@/store/manifest";
import { PerksDisplay } from "./perk-display";

const TIER_TEXT: Record<number, string> = {
  2: "text-zinc-300",
  3: "text-green-400",
  4: "text-blue-400",
  5: "text-purple-400",
  6: "text-yellow-300",
};

interface Props {
  itemHash: number;
  onClose: () => void;
}

export function ItemPreviewModal({ itemHash, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { data: def } = useItemDef(itemHash);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!def) {
    return (
      <Backdrop onClose={onClose}>
        <div className="panel p-8 max-w-md">
          <p className="text-bungie-muted">{t("common.loading")}</p>
        </div>
      </Backdrop>
    );
  }

  const tier = def.inventory?.tierType ?? 0;
  const tierColor = TIER_TEXT[tier] ?? "text-white";
  const screenshot = def.screenshot
    ? `https://www.bungie.net${def.screenshot}`
    : null;
  const icon = def.displayProperties?.icon;
  const watermark = def.iconWatermark;
  const name = def.displayProperties?.name ?? `Item ${itemHash}`;
  const typeName = def.itemTypeDisplayName ?? "";
  const description = def.displayProperties?.description ?? "";
  const flavor = def.flavorText ?? "";
  const tierName = def.inventory?.tierTypeName ?? "";

  return (
    <Backdrop onClose={onClose}>
      <div
        className="relative rounded-2xl overflow-hidden border border-bungie-accent/40 max-w-2xl w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] bg-bungie-panel"
        style={
          screenshot
            ? {
                // Stronger top-to-bottom fade so the text block at the bottom
                // stays legible against the armor/weapon screenshot art.
                backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.45) 0%, rgba(7,7,13,0.82) 45%, rgba(7,7,13,0.96) 100%), url(${screenshot})`,
                backgroundSize: "cover",
                backgroundPosition: "center 30%",
              }
            : undefined
        }
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 hover:border-white/40 flex items-center justify-center text-white/80 hover:text-white text-sm"
        >
          ✕
        </button>

        <div className="p-6 flex gap-4 items-start">
          {icon && (
            <div className="relative shrink-0">
              <img
                src={`https://www.bungie.net${icon}`}
                alt=""
                className="w-20 h-20 rounded-lg border border-white/25 bg-black/50"
              />
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  className="absolute inset-0 w-20 h-20 pointer-events-none"
                />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className={`text-2xl font-bold drop-shadow ${tierColor}`}>
              {name}
            </h2>
            <div className="text-xs text-white/70 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-2">
              {typeName && <span>{typeName}</span>}
              {typeName && tierName && <span className="opacity-30">·</span>}
              {tierName && <span className="opacity-70">{tierName}</span>}
            </div>
            {description && (
              <p className="text-sm text-white/85 mt-3 leading-relaxed">
                {description}
              </p>
            )}
            {flavor && (
              <p className="text-xs italic text-white/55 mt-3 leading-relaxed border-l-2 border-white/20 pl-3">
                {flavor}
              </p>
            )}
          </div>
        </div>

        {/* Weapon / armor stats */}
        {def.stats?.stats && Object.keys(def.stats.stats).length > 0 && (
          <div className="px-6 pb-4">
            <div className="text-[10px] uppercase tracking-widest text-bungie-muted mb-2">
              {t("itemPreview.stats")}
            </div>
            <div className="space-y-1">
              {Object.entries(def.stats.stats)
                .slice(0, 8)
                .map(([hash, s]) => (
                  <StatLine
                    key={hash}
                    statHash={Number(hash)}
                    value={s.value ?? 0}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Perks + catalyst (from template socket entries) */}
        <div className="px-6">
          <PerksDisplay
            plugHashes={
              def.sockets?.socketEntries
                ?.map((e) => e.singleInitialItemHash ?? 0)
                .filter((h) => h > 0) ?? []
            }
            isExotic={def.inventory?.tierType === 6}
            locale={i18n.language}
          />
        </div>

        {/* Meta row */}
        <div className="px-6 pb-4 flex items-center justify-start text-[10px] text-white/40">
          <span className="font-mono">#{itemHash}</span>
        </div>
      </div>
    </Backdrop>
  );
}

function StatLine({ statHash, value }: { statHash: number; value: number }) {
  const manifest = useManifestStore((s) => s.manifest);
  const statDef = manifest?.DestinyStatDefinition?.[statHash];
  const name = statDef?.displayProperties?.name ?? `#${statHash}`;
  const icon = statDef?.displayProperties?.icon;
  const max = 100;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="w-4 h-4 shrink-0"
        />
      )}
      <span className="text-white/80 w-28 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-bungie-accent/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums text-white/90 w-8 text-right">{value}</span>
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
  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-full overflow-auto fade-in-scale"
      >
        {children}
      </div>
    </div>
  );
}