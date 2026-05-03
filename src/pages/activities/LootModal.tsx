import { useEffect } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { getItemDef } from "../../api/itemDef"
import { useManifestStore } from "../../store/manifest"
import type { ActivityGuide, Element, WeaponDrop } from "@/constants/lootTables"

const ARMOR_LABEL: Record<string, string> = {
  helmet: "Casque",
  arms: "Gantelets",
  chest: "Plastron",
  legs: "Jambières",
  class: "Objet de classe",
}

const ELEMENT_COLOR: Record<Element, string> = {
  Cinétique: "#e5e7eb",
  Solaire: "#fb923c",
  Arc: "#60a5fa",
  Vide: "#a78bfa",
  Stasis: "#38bdf8",
  Strand: "#34d399",
  Prismatique: "#f472b6",
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ArmorSvg({ slot, size = 22 }: { slot: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  switch (slot) {
    case "helmet":
      return (
        <svg {...common}>
          <path d="M5 10a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2h-2v-2h-6v2H7a2 2 0 0 1-2-2z" />
          <path d="M9 10h6" />
        </svg>
      )
    case "arms":
      return (
        <svg {...common}>
          <path d="M4 7h5l3 5 3-5h5" />
          <path d="M4 7v9a2 2 0 0 0 2 2h3V12" />
          <path d="M20 7v9a2 2 0 0 1-2 2h-3V12" />
        </svg>
      )
    case "chest":
      return (
        <svg {...common}>
          <path d="M6 5l4 2h4l4-2 2 4v11H4V9z" />
        </svg>
      )
    case "legs":
      return (
        <svg {...common}>
          <path d="M8 4h8l-1 8-1 9h-2l-1-7-1 7H8L7 12z" />
        </svg>
      )
    case "class":
      return (
        <svg {...common}>
          <path d="M7 4h10l-1 6a5 5 0 0 1-4 4 5 5 0 0 1-4-4z" />
          <path d="M7 14v6M17 14v6" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function WeaponSilhouette({
  type,
  color,
  size = 22,
}: {
  type: string
  color: string
  size?: number
}) {
  const t = type.toLowerCase()
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  if (t.includes("sniper"))
    return (
      <svg {...common}>
        <path d="M2 15h4l2-2h6l4 1 4-2-1-1-4 2h-6l-2 2H2z" />
        <circle cx="10" cy="9" r="1.5" />
      </svg>
    )
  if (t.includes("reconnaissance") || t.includes("scout"))
    return (
      <svg {...common}>
        <path d="M3 14h13l4-1 1 1-1 1-4-1H3z" />
        <path d="M6 14v3h3v-3" />
      </svg>
    )
  if (t.includes("pompe") || t.includes("shotgun"))
    return (
      <svg {...common}>
        <path d="M3 12h14l2-1h2v3h-2l-2-1H3z" />
        <path d="M5 13v2h2v-2" />
      </svg>
    )
  if (t.includes("roquette"))
    return (
      <svg {...common}>
        <path d="M3 12l2-2h10l6 2-6 2H5l-2-2z" />
        <path d="M15 10v4" />
      </svg>
    )
  if (t.includes("grenade"))
    return (
      <svg {...common}>
        <path d="M3 12h10l3-2 1 1v2l-1 1-3-2H3z" />
        <circle cx="16" cy="16" r="2" />
      </svg>
    )
  if (t.includes("mitrailleuse"))
    return (
      <svg {...common}>
        <path d="M3 12h16l2 1v2l-2 1H3z" />
        <path d="M5 13v4h4v-4" />
      </svg>
    )
  if (t.includes("fusion linéaire"))
    return (
      <svg {...common}>
        <path d="M3 12h12l4-1 2 2-2 1-4-1H3z" />
        <path d="M6 11v2M9 11v2M12 11v2" />
      </svg>
    )
  if (t.includes("fusion"))
    return (
      <svg {...common}>
        <path d="M3 12h10l3-1 2 1-2 2-3-1H3z" />
        <path d="M5 11v3M8 11v3" />
      </svg>
    )
  if (t.includes("traceur"))
    return (
      <svg {...common}>
        <path d="M3 12h13l4-1 1 1-1 1-4-1H3z" />
        <path d="M17 11l3 4M18 13l2 -1" />
      </svg>
    )
  if (t.includes("épée"))
    return (
      <svg {...common}>
        <path d="M3 20l12-12 3-3 1 1-3 3-12 12H3z" />
        <path d="M17 6l2 2" />
      </svg>
    )
  if (t.includes("arc"))
    return (
      <svg {...common}>
        <path d="M5 4c6 3 6 13 0 16" />
        <path d="M5 4l14 8-14 8" />
      </svg>
    )
  if (t.includes("revolver"))
    return (
      <svg {...common}>
        <path d="M5 10h10l3 2-3 2h-2l-1 4H6l-1-5" />
        <circle cx="9" cy="11" r="1.2" />
      </svg>
    )
  if (t.includes("arme de poing") || t.includes("pistolet-mitrailleur"))
    return (
      <svg {...common}>
        <path d="M6 10h10l2 1v2l-2 1h-2l-1 3H7l-1-4" />
      </svg>
    )
  if (t.includes("glaive"))
    return (
      <svg {...common}>
        <path d="M4 20l10-10M10 14l8 6M14 4l6 6M4 20h4v-4" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M3 12h15l3-1 1 1-1 1-3-1H3z" />
      <path d="M6 13v3h3v-3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function WeaponRow({ weapon, locale }: { weapon: WeaponDrop; locale: string }) {
  const { name, type, element, exotic, hash } = weapon
  const col = exotic ? "#facc15" : element ? ELEMENT_COLOR[element] : "#d4d4d8"

  const itemQ = useQuery({
    queryKey: ["itemDef", hash, locale],
    queryFn: () => getItemDef(hash as number, locale),
    enabled: typeof hash === "number" && hash > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  const iconPath = itemQ.data?.displayProperties?.icon

  return (
    <div
      className="group relative flex items-center gap-3 rounded-md py-2 pr-2.5 pl-2 transition-all"
      title={`${name} · ${type}`}
      style={{
        background: exotic
          ? "linear-gradient(90deg, rgba(250,204,21,0.14) 0%, rgba(250,204,21,0.03) 100%)"
          : "rgba(0,0,0,0.32)",
        border: `1px solid ${exotic ? "rgba(250,204,21,0.45)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {/* Element accent bar */}
      <span
        className="absolute top-1 bottom-1 left-0 w-0.75 rounded-full"
        style={{
          background: col,
          boxShadow: `0 0 6px ${col}`,
        }}
      />
      {/* Icon */}
      <div
        className="relative ml-1.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded"
        style={{
          background: iconPath
            ? "#000"
            : `radial-gradient(circle at 30% 30%, ${col}33, ${col}08 70%)`,
          border: `1px solid ${exotic ? "rgba(250,204,21,0.65)" : "rgba(255,255,255,0.14)"}`,
          boxShadow: exotic
            ? "0 0 14px rgba(250,204,21,0.32), inset 0 0 14px rgba(250,204,21,0.16)"
            : undefined,
        }}
      >
        {iconPath ? (
          <img
            src={`https://www.bungie.net${iconPath}`}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <WeaponSilhouette type={type} color={col} size={26} />
        )}
        {exotic && (
          <span
            className="absolute right-0 bottom-0 pr-0.5 pb-0.5 text-[10px] leading-none font-black text-amber-300"
            style={{ textShadow: "0 0 6px rgba(250,204,21,0.95)" }}
          >
            ★
          </span>
        )}
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[13px] leading-tight font-bold"
          style={{
            color: exotic ? "#fde68a" : "#fff",
            textShadow: exotic ? "0 0 8px rgba(250,204,21,0.4)" : undefined,
          }}
        >
          {name}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] tracking-widest uppercase">
          <span className="truncate text-white/60">{type}</span>
          {element && (
            <span
              className="shrink-0 rounded-sm px-1.5 py-0.5 font-extrabold"
              style={{
                background: `${ELEMENT_COLOR[element]}26`,
                color: ELEMENT_COLOR[element],
              }}
            >
              {element}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ArmorRow({
  slot,
  setName,
  hash,
  locale,
}: {
  slot: string
  setName: string
  hash?: number
  locale: string
}) {
  const itemQ = useQuery({
    queryKey: ["itemDef", hash, locale],
    queryFn: () => getItemDef(hash as number, locale),
    enabled: typeof hash === "number" && hash > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  const iconPath = itemQ.data?.displayProperties?.icon

  return (
    <div
      className="relative flex items-center gap-3 rounded-md py-2 pr-2.5 pl-2 transition-all"
      style={{
        background: "rgba(0,0,0,0.32)",
        border: "1px solid rgba(244,114,182,0.22)",
      }}
    >
      <span
        className="absolute top-1 bottom-1 left-0 w-0.75 rounded-full"
        style={{
          background: "#f472b6",
          boxShadow: "0 0 6px rgba(244,114,182,0.6)",
        }}
      />
      <div
        className="ml-1.5 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded text-pink-200"
        style={{
          background: iconPath
            ? "#000"
            : "radial-gradient(circle at 30% 30%, rgba(244,114,182,0.28), rgba(244,114,182,0.04) 70%)",
          border: "1px solid rgba(244,114,182,0.35)",
        }}
      >
        {iconPath ? (
          <img
            src={`https://www.bungie.net${iconPath}`}
            alt={ARMOR_LABEL[slot] ?? slot}
            className="h-full w-full object-cover"
          />
        ) : (
          <ArmorSvg slot={slot} size={26} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-tight font-bold">
          {ARMOR_LABEL[slot] ?? slot}
        </div>
        <div className="mt-1 line-clamp-2 text-[10px] leading-snug tracking-widest text-white/55 uppercase">
          {setName}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header (weapon / armor)
// ---------------------------------------------------------------------------

function SectionLabel({
  children,
  color,
  icon,
}: {
  children: React.ReactNode
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span
        className="flex h-4 w-4 items-center justify-center rounded-sm"
        style={{ color, background: `${color}18` }}
      >
        {icon}
      </span>
      <span
        className="text-[9px] font-extrabold tracking-[0.22em] uppercase"
        style={{ color }}
      >
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{
          background: `linear-gradient(90deg, ${color}55, transparent)`,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exotic feature card (in rewards column)
// ---------------------------------------------------------------------------

function ExoticCard({
  name,
  hash,
  locale,
}: {
  name: string
  hash?: number
  locale: string
}) {
  const itemQ = useQuery({
    queryKey: ["itemDef", hash, locale],
    queryFn: () => getItemDef(hash as number, locale),
    enabled: typeof hash === "number" && hash > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  const def = itemQ.data
  const iconPath = def?.displayProperties?.icon
  const screenshot = def?.screenshot
  const typeName = def?.itemTypeDisplayName

  return (
    <div
      className="relative overflow-hidden rounded-lg border"
      style={{
        borderColor: "rgba(250,204,21,0.55)",
        background:
          "linear-gradient(135deg, rgba(250,204,21,0.16) 0%, rgba(60,30,4,0.7) 100%)",
        boxShadow:
          "0 0 24px rgba(250,204,21,0.18), inset 0 0 20px rgba(250,204,21,0.08)",
      }}
    >
      {screenshot && (
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url(https://www.bungie.net${screenshot})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="relative flex items-center gap-3 p-3">
        <div
          className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-amber-300/60"
          style={{
            background: "#000",
            boxShadow: "0 0 18px rgba(250,204,21,0.4)",
          }}
        >
          {iconPath ? (
            <img
              src={`https://www.bungie.net${iconPath}`}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-amber-300">
              ★
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-extrabold tracking-[0.24em] text-amber-300 uppercase">
            ★ Exotique
          </div>
          <div
            className="mt-0.5 text-sm leading-tight font-extrabold text-amber-100"
            style={{ textShadow: "0 0 10px rgba(250,204,21,0.5)" }}
          >
            {def?.displayProperties?.name ?? name.split(" — ")[0]}
          </div>
          {typeName && (
            <div className="mt-0.5 text-[9px] tracking-wider text-amber-200/80 uppercase">
              {typeName}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Weapon section icon
// ---------------------------------------------------------------------------

const WeaponSectionIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 11h10l3-2 4 1-1 3-4 1-3-2H4z" />
  </svg>
)
const ArmorSectionIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V5z" />
  </svg>
)

// ---------------------------------------------------------------------------
// Stat chip (hero → strip)
// ---------------------------------------------------------------------------

function StatChip({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-white/45">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[8px] font-extrabold tracking-[0.25em] text-white/40 uppercase">
          {label}
        </span>
        <span
          className="mt-1 text-[12px] font-extrabold"
          style={{ color: valueColor ?? "#fff" }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function LootModal({
  guide,
  onClose,
}: {
  guide: ActivityGuide
  onClose: () => void
}) {
  const manifest = useManifestStore((s) => s.manifest)
  const actDef = manifest?.DestinyActivityDefinition?.[guide.activityHash]
  const image = actDef?.pgcrImage
  // Use the localized name from the Bungie manifest when available so the
  // activity matches exactly what the Reports page shows.
  const displayName = actDef?.displayProperties?.name ?? guide.name

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const armorSet = guide.armorSet ?? "Raid Armor"
  const typeLabel = guide.type === "raid" ? "RAID" : "DONJON"

  // Estimate a representative exotic hash from the encounters.
  const exoticDrop = guide.encounters
    .flatMap((e) => e.weapons)
    .find((w) => w.exotic && typeof w.hash === "number")

  const node = (
    <div
      className="fixed inset-0 z-100 overflow-y-auto"
      onClick={onClose}
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(243,7,94,0.18) 0%, rgba(0,0,0,0.92) 60%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-bungie-bg flex w-full max-w-360 flex-col rounded-2xl"
          style={{
            border: "1px solid rgba(243,7,94,0.25)",
            boxShadow:
              "0 30px 80px -20px rgba(243,7,94,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
            overflow: "hidden",
          }}
        >
          {/* -------------------------------------------------------------------- */}
          {/* HERO                                                                  */}
          {/* -------------------------------------------------------------------- */}
          <div
            className="border-bungie-border/60 relative border-b"
            style={
              image
                ? {
                    backgroundImage: `linear-gradient(90deg, rgba(7,7,13,0.98) 0%, rgba(7,7,13,0.8) 50%, rgba(7,7,13,0.4) 100%), url(https://www.bungie.net${image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {/* Accent line */}
            <div
              className="absolute top-0 right-0 left-0 h-0.5"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(243,7,94,0.7), transparent)",
              }}
            />

            <div className="relative flex min-h-45 items-center gap-6 px-8 py-7">
              {/* Type glyph */}
              <div
                className="text-bungie-accent flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(243,7,94,0.25) 0%, rgba(243,7,94,0.05) 100%)",
                  border: "1px solid rgba(243,7,94,0.55)",
                  boxShadow:
                    "0 0 32px rgba(243,7,94,0.35), inset 0 0 20px rgba(243,7,94,0.15)",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {guide.type === "raid" ? (
                    <>
                      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
                      <path d="M12 8v8M8 12h8" />
                    </>
                  ) : (
                    <>
                      <path d="M4 20v-8a8 8 0 0 1 16 0v8" />
                      <path d="M9 12h6v4H9z" />
                      <path d="M4 20h16" />
                    </>
                  )}
                </svg>
              </div>

              {/* Title block — clean, no cramming */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.3em] uppercase">
                  <span
                    className="rounded px-2 py-0.5"
                    style={{
                      background: "rgba(243,7,94,0.12)",
                      border: "1px solid rgba(243,7,94,0.5)",
                      color: "#f3075e",
                    }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-white/40">Table de butin</span>
                  {guide.expansion && (
                    <>
                      <span className="text-white/25">·</span>
                      <span className="tracking-wider text-white/45 normal-case">
                        {guide.expansion}
                      </span>
                    </>
                  )}
                </div>
                <h2
                  className="mt-2 text-5xl leading-none font-black tracking-tight uppercase"
                  style={{ textShadow: "0 4px 24px rgba(0,0,0,0.9)" }}
                >
                  {displayName}
                </h2>
                {guide.destination && (
                  <div className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-white/75">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-bungie-accent"
                    >
                      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {guide.destination}
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="hover:border-bungie-accent/70 hover:bg-bungie-accent/15 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full border border-white/15 bg-black/60 text-base text-white/80 transition-colors hover:text-white"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------------------- */}
          {/* STATS STRIP                                                           */}
          {/* -------------------------------------------------------------------- */}
          <div
            className="border-bungie-border/50 flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-8 py-3"
            style={{
              background:
                "linear-gradient(90deg, rgba(243,7,94,0.04), transparent 40%, transparent 60%, rgba(243,7,94,0.04))",
            }}
          >
            {guide.recommendedPower && (
              <StatChip
                icon={
                  <span className="text-bungie-accent text-[13px] leading-none">
                    ◆
                  </span>
                }
                label="Puissance"
                value={String(guide.recommendedPower)}
                valueColor="#f3075e"
              />
            )}
            {guide.fireteamSize && (
              <StatChip
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
                    <circle cx="17" cy="7" r="2.5" />
                    <path d="M15 13c4 0 6 2 6 5" />
                  </svg>
                }
                label="Fireteam"
                value={`${guide.fireteamSize} joueurs`}
              />
            )}
            {guide.duration && (
              <StatChip
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                }
                label="Durée"
                value={guide.duration}
              />
            )}
            {guide.encounters.length > 0 && (
              <StatChip
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="4" />
                    <rect x="3" y="11" width="18" height="4" />
                    <rect x="3" y="17" width="12" height="4" />
                  </svg>
                }
                label="Étapes"
                value={String(guide.encounters.length)}
              />
            )}
            {guide.secretChests && (
              <StatChip
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="8" width="18" height="13" rx="1" />
                    <path d="M3 12h18M10 8V5h4v3" />
                  </svg>
                }
                label="Coffres cachés"
                value={String(guide.secretChests)}
                valueColor="#fde68a"
              />
            )}
            {guide.matchmaking === false && (
              <StatChip
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M5 5l14 14" />
                  </svg>
                }
                label="Matchmaking"
                value="Pas de MM"
                valueColor="#fca5a5"
              />
            )}

            {/* Separator */}
            <span className="min-w-px flex-1" />

            {/* Difficulty + seal on the right */}
            <div className="flex flex-wrap items-center gap-1.5">
              {guide.difficulties?.map((d) => {
                const isMaster =
                  d.toLowerCase().includes("maître") ||
                  d.toLowerCase().includes("master")
                return (
                  <span
                    key={d}
                    className="rounded-sm border px-2 py-1 text-[10px] font-extrabold tracking-[0.18em] uppercase"
                    style={{
                      borderColor: isMaster
                        ? "rgba(192,132,252,0.55)"
                        : "rgba(255,255,255,0.2)",
                      background: isMaster
                        ? "rgba(192,132,252,0.14)"
                        : "rgba(255,255,255,0.06)",
                      color: isMaster ? "#d8b4fe" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    {d}
                  </span>
                )
              })}
              {guide.seal && (
                <span
                  className="flex items-center gap-1 rounded-sm border border-amber-400/50 bg-amber-400/12 px-2 py-1 text-[10px] font-extrabold tracking-[0.18em] text-amber-200 uppercase"
                  title="Sceau / titre"
                >
                  🏅 {guide.seal}
                </span>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------------------- */}
          {/* COLUMNS                                                               */}
          {/* -------------------------------------------------------------------- */}
          <div className="flex-1">
            <div className="flex">
              {guide.encounters.map((e, i) => (
                <div
                  key={e.encounter + i}
                  className="relative flex min-w-0 flex-1 flex-col"
                  style={{
                    borderRight:
                      i < guide.encounters.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : undefined,
                  }}
                >
                  {/* Column top gradient accent */}
                  <div
                    className="absolute top-0 right-0 left-0 h-0.5"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(243,7,94,${0.35 - i * 0.04}), transparent)`,
                    }}
                  />

                  {/* Encounter header */}
                  <div className="border-bungie-border/30 border-b px-5 pt-5 pb-4">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="text-[32px] leading-none font-black tabular-nums"
                        style={{
                          color: "rgba(243,7,94,0.95)",
                          textShadow: "0 0 18px rgba(243,7,94,0.5)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="text-[9px] font-extrabold tracking-[0.28em] text-white/45 uppercase">
                        Étape
                      </div>
                    </div>
                    <h3 className="mt-2 text-[17px] leading-tight font-extrabold">
                      {e.encounter}
                    </h3>
                    {e.summary && (
                      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-white/55">
                        {e.summary}
                      </p>
                    )}
                  </div>

                  {/* Weapons */}
                  <div className="px-4 pt-4 pb-4">
                    <SectionLabel color="#fb7185" icon={WeaponSectionIcon}>
                      Armes
                    </SectionLabel>
                    {e.weapons.length > 0 ? (
                      <div className="space-y-2">
                        {e.weapons.map((w, k) => (
                          <WeaponRow
                            key={`${w.name}-${k}`}
                            weapon={w}
                            locale="fr"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="px-2 py-3 text-[11px] text-white/30 italic">
                        Aucun drop fixe
                      </div>
                    )}
                  </div>

                  {/* Armor */}
                  <div className="flex-1 px-4 pb-4">
                    <SectionLabel color="#f472b6" icon={ArmorSectionIcon}>
                      Armure
                    </SectionLabel>
                    {e.armor && e.armor.length > 0 ? (
                      <div className="space-y-2">
                        {e.armor.map((slot) => (
                          <ArmorRow
                            key={slot}
                            slot={slot}
                            setName={armorSet}
                            hash={guide.armorSetHashes?.[slot]}
                            locale="fr"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="px-2 py-3 text-[11px] text-white/30 italic">
                        Aucun drop
                      </div>
                    )}
                  </div>

                  {/* Extras */}
                  {e.extras && e.extras.length > 0 && (
                    <div
                      className="mx-4 mb-4 space-y-1 rounded-md px-3.5 py-2.5"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(250,204,21,0.14), rgba(250,204,21,0.02))",
                        border: "1px solid rgba(250,204,21,0.35)",
                      }}
                    >
                      {e.extras.map((x, k) => (
                        <div
                          key={k}
                          className="flex items-start gap-2 text-[11px] font-semibold text-amber-100"
                        >
                          <span className="shrink-0 text-[12px] text-amber-300">
                            ★
                          </span>
                          <span className="leading-snug">{x}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Rewards column */}
              {(guide.exotic || guide.armorSet) && (
                <div
                  className="relative flex min-w-0 flex-1 flex-col"
                  style={{
                    borderLeft: "1px solid rgba(243,7,94,0.12)",
                    background:
                      "linear-gradient(180deg, rgba(250,204,21,0.02) 0%, transparent 70%)",
                  }}
                >
                  <div
                    className="absolute top-0 right-0 left-0 h-0.5"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(250,204,21,0.5), transparent)",
                    }}
                  />
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-[26px] leading-none font-black"
                        style={{
                          color: "rgba(250,204,21,0.95)",
                          textShadow: "0 0 16px rgba(250,204,21,0.4)",
                        }}
                      >
                        ★
                      </span>
                      <div className="text-[9px] font-extrabold tracking-[0.25em] text-white/45 uppercase">
                        Récompenses
                      </div>
                    </div>
                    <h3 className="mt-1.5 text-base leading-tight font-extrabold">
                      Butin garanti
                    </h3>
                    <p className="mt-1.5 text-[10px] leading-snug text-white/50">
                      Armes exotiques, quêtes, triomphes.
                    </p>
                  </div>

                  <div className="space-y-2 px-3 pb-3">
                    {guide.exotic && (
                      <ExoticCard
                        name={guide.exotic}
                        hash={exoticDrop?.hash}
                        locale="fr"
                      />
                    )}
                    {guide.armorSet && (
                      <div
                        className="rounded-md p-3"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(244,114,182,0.14) 0%, rgba(244,114,182,0.03) 100%)",
                          border: "1px solid rgba(244,114,182,0.4)",
                        }}
                      >
                        <div className="text-[9px] font-extrabold tracking-[0.22em] text-pink-300 uppercase">
                          Set d'armure
                        </div>
                        <div className="mt-1 text-sm leading-tight font-extrabold text-pink-100">
                          {guide.armorSet}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 opacity-80">
                          {(
                            [
                              "helmet",
                              "arms",
                              "chest",
                              "legs",
                              "class",
                            ] as const
                          ).map((s) => (
                            <span
                              key={s}
                              className="flex h-6 w-6 items-center justify-center rounded border border-pink-400/30 bg-pink-400/5 text-pink-200/80"
                              title={ARMOR_LABEL[s]}
                            >
                              <ArmorSvg slot={s} size={14} />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div
                      className="rounded-md p-3"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="text-[9px] font-extrabold tracking-[0.22em] text-white/50 uppercase">
                        Triomphes
                      </div>
                      <div className="mt-1 text-[11px] leading-snug font-semibold text-white/70">
                        Complète les défis pour les triomphes et le sceau du{" "}
                        {guide.type === "raid" ? "raid" : "donjon"}.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------------------- */}
          {/* FOOTER                                                                */}
          {/* -------------------------------------------------------------------- */}
          <div
            className="flex items-center justify-between border-t px-6 py-2.5 text-[10px] leading-relaxed"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <span className="text-white/40">
              Tables de butin communautaires · les armes peuvent changer selon
              les mises à jour Bungie ·{" "}
              <span className="text-amber-300">★</span> = exotique (aléatoire
              sauf quête)
            </span>
            <span className="font-extrabold tracking-[0.22em] text-white/30 uppercase">
              Cruzer · Base de butin
            </span>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(node, document.body)
}
