import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useItemDef } from "@/hooks/useItemDef"
import { useManifestStore } from "@/store/manifest"
import { PerksDisplay } from "./perk-display"

const TIER_TEXT: Record<number, string> = {
  2: "text-zinc-300",
  3: "text-green-400",
  4: "text-blue-400",
  5: "text-purple-400",
  6: "text-yellow-300",
}

interface Props {
  itemHash: number
  onClose: () => void
}

export function ItemPreviewModal({ itemHash, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const { data: def } = useItemDef(itemHash)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!def) {
    return (
      <Backdrop onClose={onClose}>
        <div className="panel max-w-md p-8">
          <p className="text-bungie-muted">{t("common.loading")}</p>
        </div>
      </Backdrop>
    )
  }

  const tier = def.inventory?.tierType ?? 0
  const tierColor = TIER_TEXT[tier] ?? "text-white"
  const screenshot = def.screenshot
    ? `https://www.bungie.net${def.screenshot}`
    : null
  const icon = def.displayProperties?.icon
  const watermark = def.iconWatermark
  const name = def.displayProperties?.name ?? `Item ${itemHash}`
  const typeName = def.itemTypeDisplayName ?? ""
  const description = def.displayProperties?.description ?? ""
  const flavor = def.flavorText ?? ""
  const tierName = def.inventory?.tierTypeName ?? ""

  return (
    <Backdrop onClose={onClose}>
      <div
        className="border-bungie-accent/40 bg-bungie-panel relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
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
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-sm text-white/80 hover:border-white/40 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-start gap-4 p-6">
          {icon && (
            <div className="relative shrink-0">
              <img
                src={`https://www.bungie.net${icon}`}
                alt=""
                className="h-20 w-20 rounded-lg border border-white/25 bg-black/50"
              />
              {watermark && (
                <img
                  src={`https://www.bungie.net${watermark}`}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-20 w-20"
                />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className={`text-2xl font-bold drop-shadow ${tierColor}`}>
              {name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs tracking-widest text-white/70 uppercase">
              {typeName && <span>{typeName}</span>}
              {typeName && tierName && <span className="opacity-30">·</span>}
              {tierName && <span className="opacity-70">{tierName}</span>}
            </div>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                {description}
              </p>
            )}
            {flavor && (
              <p className="mt-3 border-l-2 border-white/20 pl-3 text-xs leading-relaxed text-white/55 italic">
                {flavor}
              </p>
            )}
          </div>
        </div>

        {/* Weapon / armor stats */}
        {def.stats?.stats && Object.keys(def.stats.stats).length > 0 && (
          <div className="px-6 pb-4">
            <div className="text-bungie-muted mb-2 text-[10px] tracking-widest uppercase">
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
        <div className="flex items-center justify-start px-6 pb-4 text-[10px] text-white/40">
          <span className="font-mono">#{itemHash}</span>
        </div>
      </div>
    </Backdrop>
  )
}

function StatLine({ statHash, value }: { statHash: number; value: number }) {
  const manifest = useManifestStore((s) => s.manifest)
  const statDef = manifest?.DestinyStatDefinition?.[statHash]
  const name = statDef?.displayProperties?.name ?? `#${statHash}`
  const icon = statDef?.displayProperties?.icon
  const max = 100
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="h-4 w-4 shrink-0"
        />
      )}
      <span className="w-28 truncate text-white/80">{name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/50">
        <div
          className="bg-bungie-accent/70 h-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-white/90 tabular-nums">{value}</span>
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
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in-scale max-h-full overflow-auto"
      >
        {children}
      </div>
    </div>
  )
}
