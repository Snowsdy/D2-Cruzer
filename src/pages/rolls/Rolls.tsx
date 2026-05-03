import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useItemDef } from "@/hooks/useItemDef"
import {
  GOD_ROLLS,
  ELEMENT_COLORS,
  type GodRoll,
  type PerkRef,
  type RollRow,
} from "@/constants/godRolls"

type Tab = "all" | "pve" | "pvp"

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function PerkChip({ perk, color }: { perk: PerkRef; color: string }) {
  const def = useItemDef(perk.hash)
  const icon = def.data?.displayProperties?.icon
  const resolvedName = def.data?.displayProperties?.name
  const displayName = resolvedName ?? perk.name
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-sm pr-1.5 pl-0.5 text-[10.5px] font-bold text-white"
      style={{
        background: `${color}1f`,
        border: `1px solid ${color}55`,
      }}
    >
      {icon ? (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="h-5 w-5"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${color}80`,
          }}
        />
      ) : (
        <span
          className="flex h-5 w-5 items-center justify-center text-[10px] text-white/40"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${color}35`,
          }}
        >
          ◇
        </span>
      )}
      <span className="max-w-40 truncate">{displayName}</span>
    </span>
  )
}

function RollColumn({ row, color }: { row: RollRow; color: string }) {
  return (
    <div
      className="rounded-md p-2"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${color}22`,
      }}
    >
      <div className="mb-1.5 font-mono text-[9px] font-extrabold tracking-[0.22em] text-white/40 uppercase">
        {row.column}
      </div>
      <div className="flex flex-wrap gap-1">
        {row.perks.map((p, i) => (
          <PerkChip key={i} perk={p} color={color} />
        ))}
      </div>
    </div>
  )
}

function RollCard({ roll, filter }: { roll: GodRoll; filter: Tab }) {
  const def = useItemDef(roll.hash)
  const d = def.data
  const icon = d?.displayProperties?.icon
  const watermark = d?.iconWatermark
  const name = d?.displayProperties?.name ?? roll.nameHint
  const typeName = d?.itemTypeDisplayName ?? roll.type
  const elementColor = ELEMENT_COLORS[roll.element] ?? "#f3075e"
  const tier = d?.inventory?.tierType ?? 5
  const isExotic = tier === 6

  const showPve = filter !== "pvp" && roll.pve && roll.pve.length > 0
  const showPvp = filter !== "pve" && roll.pvp && roll.pvp.length > 0

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,10,22,0.95), rgba(7,7,13,0.98))",
        border: `1px solid ${isExotic ? "rgba(206,165,46,0.4)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: `0 6px 20px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Element accent stripe */}
      <div
        className="absolute top-0 bottom-0 left-0 w-0.5"
        style={{
          background: `linear-gradient(180deg, ${elementColor}, transparent)`,
          boxShadow: `0 0 10px ${elementColor}`,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="relative h-14 w-14 shrink-0 overflow-hidden"
          style={{
            border: `1px solid ${isExotic ? "rgba(206,165,46,0.7)" : "rgba(255,255,255,0.14)"}`,
          }}
        >
          {icon && (
            <img
              src={`https://www.bungie.net${icon}`}
              alt=""
              className="h-full w-full object-cover"
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
          <div
            className={`truncate text-[16px] font-extrabold ${
              isExotic ? "text-amber-300" : "text-white"
            }`}
          >
            {name}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] uppercase">
            <span style={{ color: elementColor }}>{roll.element}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/55">{typeName}</span>
          </div>
        </div>
      </div>

      {roll.notes && (
        <div className="mx-4 mb-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-2 py-1.5 text-[11px] text-amber-200/75 italic">
          {roll.notes}
        </div>
      )}

      <div className="space-y-3 px-4 pb-4">
        {showPve && roll.pve && (
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-extrabold tracking-[0.25em] text-emerald-300/85 uppercase">
              <span>PvE</span>
              <div className="h-px flex-1 bg-emerald-300/15" />
            </div>
            <div className="space-y-1.5">
              {roll.pve.map((r, i) => (
                <RollColumn key={i} row={r} color="#34d399" />
              ))}
            </div>
          </div>
        )}
        {showPvp && roll.pvp && (
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-extrabold tracking-[0.25em] text-red-300/85 uppercase">
              <span>PvP</span>
              <div className="h-px flex-1 bg-red-300/15" />
            </div>
            <div className="space-y-1.5">
              {roll.pvp.map((r, i) => (
                <RollColumn key={i} row={r} color="#f87171" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Rolls() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Tab>("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    let list = GOD_ROLLS
    if (filter === "pve") list = list.filter((r) => r.pve && r.pve.length)
    if (filter === "pvp") list = list.filter((r) => r.pvp && r.pvp.length)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) =>
          r.nameHint.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.element.toLowerCase().includes(q)
      )
    }
    return list
  }, [filter, query])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">{t("nav.rolls")}</h2>
        <p className="text-bungie-muted mt-1 text-sm">
          God rolls communautaires — références pour reconnaître un drop digne
          du coffre.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-bungie-border flex gap-1 rounded-full border bg-black/30 p-1">
          {[
            { key: "all", label: `Tout (${GOD_ROLLS.length})` },
            { key: "pve", label: "PvE" },
            { key: "pvp", label: "PvP" },
          ].map((it) => (
            <button
              key={it.key}
              onClick={() => setFilter(it.key as Tab)}
              className={`h-8 rounded-full px-4 text-xs font-bold transition-all ${
                filter === it.key
                  ? "bg-bungie-accent shadow-glow text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une arme, un type, un élément…"
          className="border-bungie-border focus:border-bungie-accent h-8 min-w-60 flex-1 rounded-full border bg-black/30 px-3 text-sm text-white focus:outline-none"
        />
        <div className="text-bungie-muted text-[11px]">
          {filtered.length} arme{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel text-bungie-muted p-8 text-center">
          Aucun résultat pour « {query} ».
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RollCard key={r.hash} roll={r} filter={filter} />
          ))}
        </div>
      )}

      <p className="text-bungie-muted/70 text-[10px] italic">
        Données curatées depuis la méta communautaire (Light.gg / D2Gunsmith).
        Les noms de perks sont indicatifs — ton drop peut varier.
      </p>
    </div>
  )
}
