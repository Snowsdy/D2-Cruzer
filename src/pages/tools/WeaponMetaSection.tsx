/**
 * Native "Meta" section — weapon archetype kill counts from the Bungie
 * account stats. Rendered as a clean typographic leaderboard — no bars,
 * no podium, no emoji clutter.
 */

import { useMemo, useState } from "react"
import { useAccountStats } from "@/hooks/useAccountStats"
import { readStat } from "@/api/stats"

type Mode = "allPvE" | "allPvP" | "trialsOfOsiris" | "gambit" | "ironBanner"

const MODE_LABELS: Record<Mode, string> = {
  allPvE: "Avant-Garde",
  allPvP: "Épreuve",
  trialsOfOsiris: "Jugement d'Osiris",
  gambit: "Gambit",
  ironBanner: "Bannière de Fer",
}

// Couleurs canoniques Destiny 2 :
//   Avant-garde (PvE)      → bleu (Zavala)
//   Épreuve (PvP)          → rouge (Shaxx)
//   Épreuves d'Osiris      → jaune (Saint-14)
//   Gambit                 → vert (Drifter)
//   Bannière de fer        → kaki / olive (Saladin)
const MODE_COLORS: Record<Mode, string> = {
  allPvE: "#60a5fa",
  allPvP: "#f87171",
  trialsOfOsiris: "#facc15",
  gambit: "#34d399",
  ironBanner: "#bdb76b",
}

interface Archetype {
  key: string
  label: string
  statKey: string
}

const WEAPON_ARCHETYPES: Archetype[] = [
  { key: "auto", label: "Fusil auto", statKey: "weaponKillsAutoRifle" },
  { key: "hc", label: "Revolver", statKey: "weaponKillsHandCannon" },
  {
    key: "pulse",
    label: "Fusil à impulsion",
    statKey: "weaponKillsPulseRifle",
  },
  { key: "scout", label: "Fusil à visée", statKey: "weaponKillsScoutRifle" },
  {
    key: "smg",
    label: "Pistolet-mitrailleur",
    statKey: "weaponKillsSubmachinegun",
  },
  { key: "sidearm", label: "Pistolet", statKey: "weaponKillsSidearm" },
  { key: "bow", label: "Arc", statKey: "weaponKillsBow" },
  { key: "trace", label: "Fusil à traçage", statKey: "weaponKillsTraceRifle" },
  { key: "fusion", label: "Fusil à fusion", statKey: "weaponKillsFusionRifle" },
  {
    key: "linear",
    label: "FF linéaire",
    statKey: "weaponKillsLinearFusionRifle",
  },
  { key: "sniper", label: "Fusil de précision", statKey: "weaponKillsSniper" },
  { key: "shotgun", label: "Fusil à pompe", statKey: "weaponKillsShotgun" },
  { key: "gl", label: "Lance-grenades", statKey: "weaponKillsGrenadeLauncher" },
  {
    key: "rocket",
    label: "Lance-roquettes",
    statKey: "weaponKillsRocketLauncher",
  },
  {
    key: "machine",
    label: "Mitrailleuse lourde",
    statKey: "weaponKillsMachineGun",
  },
  { key: "sword", label: "Épée", statKey: "weaponKillsSword" },
]

const ABILITY_KILLS = [
  { key: "super", label: "Super", statKey: "weaponKillsSuper" },
  { key: "grenade", label: "Grenade", statKey: "weaponKillsGrenade" },
  { key: "melee", label: "Mêlée", statKey: "weaponKillsMelee" },
  { key: "ability", label: "Capacité", statKey: "weaponKillsAbility" },
]

// ---------------------------------------------------------------------------
// Leaderboard — a dense typography-driven list.
// Each row:
//   [rank]  [label ........................]  [count]    [pct]
// Columns are strictly aligned; the row bg fades out with rank so the top
// items visually dominate without needing a bar.
// ---------------------------------------------------------------------------

function Leaderboard({
  rows,
  total,
  color,
}: {
  rows: { key: string; label: string; value: number }[]
  total: number
  color: string
}) {
  if (rows.length === 0) return null
  const max = rows[0]?.value ?? 0
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: "rgba(10,8,16,0.55)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((r, i) => {
            const rank = i + 1
            const pct = total > 0 ? (r.value / total) * 100 : 0
            // Background intensity scales with rank — top items slightly
            // brighter so you can parse the leaderboard without bars.
            const weight = max > 0 ? r.value / max : 0
            return (
              <tr
                key={r.key}
                className="group transition-colors"
                style={{
                  background:
                    rank === 1
                      ? `linear-gradient(90deg, ${color}10, transparent 60%)`
                      : undefined,
                  borderTop:
                    rank > 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                }}
              >
                {/* Rank */}
                <td
                  className="w-10 py-2.5 pr-3 pl-4 text-right align-middle"
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontWeight: 800,
                    color: rank === 1 ? color : "rgba(255,255,255,0.35)",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {String(rank).padStart(2, "0")}
                </td>
                {/* Label with a subtle inline weight indicator (dot) */}
                <td className="py-2.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{
                        background: color,
                        opacity: 0.25 + weight * 0.75,
                        boxShadow:
                          weight > 0.5 ? `0 0 6px ${color}` : undefined,
                      }}
                    />
                    <div
                      className="truncate font-semibold"
                      style={{
                        color:
                          rank === 1
                            ? "#ffffff"
                            : `rgba(255,255,255,${0.55 + weight * 0.4})`,
                        fontSize: rank === 1 ? "14px" : "13px",
                      }}
                    >
                      {r.label}
                    </div>
                  </div>
                </td>
                {/* Count */}
                <td
                  className="px-3 py-2.5 text-right align-middle tabular-nums"
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontWeight: 700,
                    fontSize: rank === 1 ? "15px" : "13px",
                    color: rank === 1 ? color : "rgba(255,255,255,0.82)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {r.value.toLocaleString("fr-FR")}
                </td>
                {/* Pct */}
                <td
                  className="w-16 py-2.5 pr-4 pl-3 text-right align-middle tabular-nums"
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: rank === 1 ? color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {pct.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function WeaponMetaSection() {
  const stats = useAccountStats()
  const [mode, setMode] = useState<Mode>("allPvE")
  const color = MODE_COLORS[mode]

  const bucket = stats.data?.mergedAllCharacters?.results?.[mode]?.allTime

  const ranked = useMemo(() => {
    const rows = WEAPON_ARCHETYPES.map((a) => ({
      key: a.key,
      label: a.label,
      value: readStat(bucket, a.statKey),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
    const total = rows.reduce((s, r) => s + r.value, 0)
    return { rows, total }
  }, [bucket])

  const abilities = useMemo(() => {
    const rows = ABILITY_KILLS.map((a) => ({
      key: a.key,
      label: a.label,
      value: readStat(bucket, a.statKey),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
    const total = rows.reduce((s, r) => s + r.value, 0)
    return { rows, total }
  }, [bucket])

  const kills = readStat(bucket, "kills")
  const deaths = readStat(bucket, "deaths")
  const kd = deaths > 0 ? kills / deaths : kills
  const secPlayed = readStat(bucket, "secondsPlayed")
  const hours = Math.round(secPlayed / 3600)
  const activities = readStat(bucket, "activitiesEntered")
  const precisionKills = readStat(bucket, "precisionKills")
  const precisionPct = kills > 0 ? (precisionKills / kills) * 100 : 0

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Usage d'armes</h2>
          <p className="text-bungie-muted mt-0.5 text-xs">
            Classement par kills · tiré de l'API Bungie
          </p>
        </div>
        <div className="border-bungie-border no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border bg-black/30 p-1">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`h-7 rounded-full px-3 text-[11px] font-bold whitespace-nowrap transition-all ${
                mode === m
                  ? "shadow-glow text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
              style={mode === m ? { background: MODE_COLORS[m] } : undefined}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div
        className="flex flex-wrap items-center gap-5 rounded-lg px-4 py-3"
        style={{
          background: "rgba(14,12,20,0.6)",
          border: `1px solid ${color}30`,
        }}
      >
        <Summary
          label="Kills"
          value={kills.toLocaleString("fr-FR")}
          color={color}
        />
        <Summary label="K / D" value={kd.toFixed(2)} color="#ffffff" />
        <Summary
          label="Précision"
          value={`${precisionPct.toFixed(1)}%`}
          color="#fde047"
        />
        <Summary
          label="Activités"
          value={activities.toLocaleString("fr-FR")}
          color="#a78bfa"
        />
        <Summary
          label="Temps"
          value={hours > 0 ? `${hours.toLocaleString("fr-FR")} h` : "—"}
          color="#60a5fa"
        />
      </div>

      {stats.isLoading && (
        <p className="text-bungie-muted text-sm">Chargement…</p>
      )}

      {!stats.isLoading && ranked.rows.length === 0 && (
        <div
          className="rounded-lg p-6 text-center"
          style={{
            background: "rgba(14,12,20,0.5)",
            border: `1px dashed ${color}50`,
          }}
        >
          <div className="text-sm text-white/70">
            Tu n'as pas encore joué ce mode.
          </div>
        </div>
      )}

      {ranked.rows.length > 0 && (
        <div className="space-y-2">
          <SectionHeader
            title="Armes"
            sub={`${ranked.rows.length} archétypes · ${ranked.total.toLocaleString("fr-FR")} kills`}
            color={color}
          />
          <Leaderboard rows={ranked.rows} total={ranked.total} color={color} />
        </div>
      )}

      {abilities.rows.length > 0 && (
        <div className="space-y-2">
          <SectionHeader
            title="Capacités"
            sub={`${abilities.total.toLocaleString("fr-FR")} kills`}
            color={color}
          />
          <Leaderboard
            rows={abilities.rows}
            total={abilities.total}
            color={color}
          />
        </div>
      )}
    </section>
  )
}

function Summary({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="font-mono text-[9px] font-extrabold tracking-[0.22em] text-white/40 uppercase">
        {label}
      </span>
      <span
        className="text-lg leading-none font-extrabold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  )
}

function SectionHeader({
  title,
  sub,
  color,
}: {
  title: string
  sub: string
  color: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <span
        className="font-mono text-[10px] font-extrabold tracking-[0.3em] uppercase"
        style={{ color }}
      >
        ◆ {title}
      </span>
      <span className="font-mono text-[10px] font-extrabold text-white/40 tabular-nums">
        {sub}
      </span>
    </div>
  )
}
