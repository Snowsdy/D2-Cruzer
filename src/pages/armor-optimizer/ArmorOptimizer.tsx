import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProfile } from "@/hooks/useProfile"
import { useItemDef } from "@/hooks/useItemDef"
import {
  STAT_HASHES,
  ARMOR_STAT_ORDER,
  ARMOR_STAT_PER_PIECE_MAX,
} from "@/constants/stats"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ArmorBuckets = {
  Helmet: 3448274439,
  Arms: 3551918588,
  Chest: 14239492,
  Legs: 20886954,
  ClassItem: 1585787867,
} as const

const BUCKET_LABEL: Record<number, string> = {
  [ArmorBuckets.Helmet]: "Casque",
  [ArmorBuckets.Arms]: "Bras",
  [ArmorBuckets.Chest]: "Torse",
  [ArmorBuckets.Legs]: "Jambes",
  [ArmorBuckets.ClassItem]: "Classe",
}

const BUCKET_ORDER: number[] = [
  ArmorBuckets.Helmet,
  ArmorBuckets.Arms,
  ArmorBuckets.Chest,
  ArmorBuckets.Legs,
  ArmorBuckets.ClassItem,
]

const STAT_NAMES: Record<number, string> = {
  [STAT_HASHES.Weapons]: "Arm",
  [STAT_HASHES.Health]: "Sn",
  [STAT_HASHES.Class]: "Cla",
  [STAT_HASHES.Grenade]: "Gre",
  [STAT_HASHES.Super]: "Sup",
  [STAT_HASHES.Melee]: "Mê",
}

const STAT_FULLNAME: Record<number, string> = {
  [STAT_HASHES.Weapons]: "Armes",
  [STAT_HASHES.Health]: "Santé",
  [STAT_HASHES.Class]: "Classe",
  [STAT_HASHES.Grenade]: "Grenade",
  [STAT_HASHES.Super]: "Super",
  [STAT_HASHES.Melee]: "Mêlée",
}

interface ArmorPiece {
  item: DestinyItemComponent
  bucket: number
  stats: Record<number, number>
  total: number
  power?: number
}

// ---------------------------------------------------------------------------
// UI bits
// ---------------------------------------------------------------------------

function StatCell({ statHash, value }: { statHash: number; value: number }) {
  const pct = Math.min(100, (value / ARMOR_STAT_PER_PIECE_MAX) * 100)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="font-mono text-[8.5px] font-extrabold tracking-[0.15em] text-white/40 uppercase">
        {STAT_NAMES[statHash]}
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-sm border border-white/5 bg-black/40">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(243,7,94,0.3), rgba(243,7,94,0.7))",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {value}
        </div>
      </div>
    </div>
  )
}

function ArmorCard({ piece }: { piece: ArmorPiece }) {
  const def = useItemDef(piece.item.itemHash)
  const d = def.data
  const icon = d?.displayProperties?.icon
  const watermark = d?.iconWatermark
  const name = d?.displayProperties?.name ?? "…"
  const typeName = d?.itemTypeDisplayName
  const tier = d?.inventory?.tierType ?? 5
  const isExotic = tier === 6

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-3 transition-all hover:-translate-y-0.5"
      style={{
        background: "rgba(12,8,20,0.9)",
        border: `1px solid ${isExotic ? "rgba(206,165,46,0.45)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="relative h-11 w-11 shrink-0 overflow-hidden"
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
            className={`truncate text-[13px] font-bold ${
              isExotic ? "text-amber-300" : "text-white"
            }`}
          >
            {name}
          </div>
          <div className="flex items-center gap-1.5 truncate text-[10px] text-white/50">
            {typeName && <span>{typeName}</span>}
            {piece.power && (
              <>
                <span className="text-white/25">·</span>
                <span className="text-amber-300/85">◆ {piece.power}</span>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase">
            Total
          </div>
          <div className="text-[15px] font-extrabold text-white">
            {piece.total}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {ARMOR_STAT_ORDER.map((h) => (
          <StatCell key={h} statHash={h} value={piece.stats[h] ?? 0} />
        ))}
      </div>
    </div>
  )
}

function ComboTile({ piece }: { piece: ArmorPiece }) {
  const def = useItemDef(piece.item.itemHash)
  const icon = def.data?.displayProperties?.icon
  const tier = def.data?.inventory?.tierType ?? 5
  const isExotic = tier === 6
  const name = def.data?.displayProperties?.name ?? ""
  const bucketLabel = BUCKET_LABEL[piece.bucket] ?? ""
  return (
    <div
      className="h-10 w-10 shrink-0 overflow-hidden"
      title={`${name} (${bucketLabel})`}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Combo search
// ---------------------------------------------------------------------------

interface Combo {
  pieces: ArmorPiece[]
  stats: Record<number, number>
  targetScore: number
  total: number
}

function findTopCombos(
  helmets: ArmorPiece[],
  arms: ArmorPiece[],
  chests: ArmorPiece[],
  legs: ArmorPiece[],
  classItems: ArmorPiece[],
  targetStat: number,
  limit = 5
): Combo[] {
  const cap = (arr: ArmorPiece[]) =>
    [...arr]
      .sort((a, b) => (b.stats[targetStat] ?? 0) - (a.stats[targetStat] ?? 0))
      .slice(0, 6)
  const H = cap(helmets)
  const A = cap(arms)
  const C = cap(chests)
  const L = cap(legs)
  // class items have no stats typically — pick any representative
  const X: (ArmorPiece | null)[] =
    classItems.length > 0 ? cap(classItems) : [null]

  const out: Combo[] = []
  for (const h of H) {
    for (const a of A) {
      for (const c of C) {
        for (const l of L) {
          for (const x of X) {
            const picks = [h, a, c, l, x].filter(Boolean) as ArmorPiece[]
            const stats: Record<number, number> = {}
            for (const h2 of ARMOR_STAT_ORDER) stats[h2] = 0
            let total = 0
            for (const p of picks) {
              for (const h2 of ARMOR_STAT_ORDER) {
                const v = p.stats[h2] ?? 0
                stats[h2] += v
                total += v
              }
            }
            out.push({
              pieces: picks,
              stats,
              targetScore: stats[targetStat] ?? 0,
              total,
            })
          }
        }
      }
    }
  }
  out.sort((a, b) => b.targetScore - a.targetScore || b.total - a.total)
  return out.slice(0, limit)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ArmorOptimizer() {
  const { t } = useTranslation()
  const { profile, activeCharacterId } = useProfile()
  const [sortStat, setSortStat] = useState<number>(STAT_HASHES.Discipline)
  const [minTotal, setMinTotal] = useState(0)

  const pieces = useMemo<ArmorPiece[]>(() => {
    const p = profile.data
    if (!p) return []
    const all: DestinyItemComponent[] = []
    all.push(...(p.profileInventory?.data?.items ?? []))
    for (const c of Object.values(p.characterInventories?.data ?? {}))
      all.push(...c.items)
    for (const c of Object.values(p.characterEquipment?.data ?? {}))
      all.push(...c.items)

    const stats = p.itemComponents?.stats?.data ?? {}
    const instances = p.itemComponents?.instances?.data ?? {}
    const out: ArmorPiece[] = []
    for (const it of all) {
      if (!BUCKET_ORDER.includes(it.bucketHash)) continue
      if (!it.itemInstanceId) continue
      const sData = stats[it.itemInstanceId]?.stats ?? {}
      const perStat: Record<number, number> = {}
      let total = 0
      for (const h of ARMOR_STAT_ORDER) {
        const v = sData[h]?.value ?? 0
        perStat[h] = v
        total += v
      }
      // Drop no-stat class items from the sortable list, but allow class items in combos
      const isClassItem = it.bucketHash === ArmorBuckets.ClassItem
      if (!isClassItem && total < 30) continue
      const inst = instances[it.itemInstanceId]
      out.push({
        item: it,
        bucket: it.bucketHash,
        stats: perStat,
        total,
        power: inst?.primaryStat?.value,
      })
    }
    return out
  }, [profile.data])

  const helmets = pieces.filter((p) => p.bucket === ArmorBuckets.Helmet)
  const arms = pieces.filter((p) => p.bucket === ArmorBuckets.Arms)
  const chests = pieces.filter((p) => p.bucket === ArmorBuckets.Chest)
  const legs = pieces.filter((p) => p.bucket === ArmorBuckets.Legs)
  const classItems = pieces.filter((p) => p.bucket === ArmorBuckets.ClassItem)

  const sortedPieces = useMemo(() => {
    const list =
      minTotal > 0 ? pieces.filter((p) => p.total >= minTotal) : pieces
    return [...list].sort(
      (a, b) =>
        (b.stats[sortStat] ?? 0) - (a.stats[sortStat] ?? 0) || b.total - a.total
    )
  }, [pieces, sortStat, minTotal])

  const combos = useMemo(
    () => findTopCombos(helmets, arms, chests, legs, classItems, sortStat, 5),
    [helmets, arms, chests, legs, classItems, sortStat]
  )

  if (profile.isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold">{t("nav.armor")}</h2>
        <p className="text-bungie-muted">{t("common.loading")}</p>
      </div>
    )
  }

  if (!activeCharacterId || pieces.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-2xl font-bold">{t("nav.armor")}</h2>
        <div className="panel text-bungie-muted p-6">
          Aucune armure détectée — sélectionne un personnage pour commencer.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">{t("nav.armor")}</h2>
        <p className="text-bungie-muted mt-1 text-sm">
          Trie et combine ton armure pour maximiser une stat · {pieces.length}{" "}
          pièces détectées.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-bungie-border flex items-center gap-1 rounded-full border bg-black/30 p-1">
          {ARMOR_STAT_ORDER.map((h) => (
            <button
              key={h}
              onClick={() => setSortStat(h)}
              className={`h-8 rounded-full px-3 text-xs font-bold tracking-wider uppercase transition-all ${
                sortStat === h
                  ? "bg-bungie-accent shadow-glow text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {STAT_FULLNAME[h]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-white/65">
          <span className="font-bold tracking-[0.15em] uppercase">
            Total min
          </span>
          <input
            type="number"
            min={0}
            max={90}
            step={2}
            value={minTotal}
            onChange={(e) =>
              setMinTotal(Math.max(0, Number(e.target.value) || 0))
            }
            className="border-bungie-border focus:border-bungie-accent h-8 w-16 rounded-md border bg-black/30 px-2 text-sm text-white focus:outline-none"
          />
        </label>
      </div>

      {/* Top 5 combos */}
      <section>
        <h3 className="mb-2 font-mono text-sm font-extrabold tracking-[0.2em] text-white/70 uppercase">
          ★ Top 5 combos pour {STAT_FULLNAME[sortStat]}
        </h3>
        <div className="space-y-2">
          {combos.length === 0 ? (
            <div className="panel text-bungie-muted p-4 text-sm">
              Pas assez de pièces pour générer des combos.
            </div>
          ) : (
            combos.map((c, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 rounded-md p-2.5"
                style={{
                  background: "rgba(20,12,30,0.6)",
                  border: "1px solid rgba(243,7,94,0.18)",
                }}
              >
                <div className="text-bungie-accent w-6 text-center font-mono text-[14px] font-extrabold">
                  {i + 1}
                </div>
                <div className="flex items-center gap-1">
                  {c.pieces.map((p, j) => (
                    <ComboTile key={j} piece={p} />
                  ))}
                </div>
                <div className="flex-1" />
                <div className="grid grid-cols-6 gap-2 text-center">
                  {ARMOR_STAT_ORDER.map((h) => (
                    <div key={h} className="min-w-8">
                      <div className="font-mono text-[8.5px] font-bold tracking-[0.15em] text-white/40 uppercase">
                        {STAT_NAMES[h]}
                      </div>
                      <div
                        className={`text-[13px] font-extrabold ${
                          h === sortStat
                            ? "text-bungie-accent"
                            : "text-white/85"
                        }`}
                      >
                        {c.stats[h]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ml-1 border-l border-white/8 pl-3 text-center">
                  <div className="font-mono text-[8.5px] font-bold tracking-[0.15em] text-white/40 uppercase">
                    Total
                  </div>
                  <div className="text-[15px] font-extrabold text-white">
                    {c.total}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Per-slot piece list */}
      <section>
        <h3 className="mb-2 font-mono text-sm font-extrabold tracking-[0.2em] text-white/70 uppercase">
          Pièces classées par {STAT_FULLNAME[sortStat]}
        </h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {sortedPieces.slice(0, 24).map((p, i) => (
            <ArmorCard key={p.item.itemInstanceId ?? i} piece={p} />
          ))}
        </div>
        {sortedPieces.length > 24 && (
          <p className="mt-2 text-center text-[11px] text-white/45">
            + {sortedPieces.length - 24} pièces supplémentaires (affichage des
            24 meilleures).
          </p>
        )}
      </section>
    </div>
  )
}
