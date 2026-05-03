/**
 * Combat records — bests + cumulative stats from Bungie aggregate data.
 * Grouped by theme for readability (Kills, Distance, Combat).
 */

import { useMemo } from "react"
import { useAccountStats } from "@/hooks/useAccountStats"
import { readStat } from "@/api/stats"

interface Row {
  label: string
  value: string
  hint?: string
}

interface Group {
  title: string
  accent: string
  rows: Row[]
}

export function CombatRecordsSection() {
  const stats = useAccountStats()

  const groups = useMemo<Group[]>(() => {
    const r = stats.data?.mergedAllCharacters?.results
    if (!r) return []
    const pvp = r.allPvP?.allTime
    const pve = r.allPvE?.allTime
    const tr = r.trialsOfOsiris?.allTime
    const ib = r.ironBanner?.allTime

    const bestPvPKills = Math.max(
      readStat(pvp, "bestSingleGameKills"),
      readStat(tr, "bestSingleGameKills"),
      readStat(ib, "bestSingleGameKills")
    )
    const bestPvEKills = readStat(pve, "bestSingleGameKills")
    const longestSpreePvP = Math.max(
      readStat(pvp, "longestKillSpree"),
      readStat(tr, "longestKillSpree"),
      readStat(ib, "longestKillSpree")
    )
    const longestSpreePvE = readStat(pve, "longestKillSpree")
    const longestDistPvP = Math.max(
      readStat(pvp, "longestKillDistance"),
      readStat(tr, "longestKillDistance")
    )
    const longestDistPvE = readStat(pve, "longestKillDistance")
    const longestLife = Math.max(
      readStat(pvp, "longestSingleLife"),
      readStat(pve, "longestSingleLife")
    )
    const bestScorePvP = Math.max(
      readStat(pvp, "bestSingleGameScore"),
      readStat(tr, "bestSingleGameScore"),
      readStat(ib, "bestSingleGameScore")
    )
    const orbsDropped =
      readStat(pvp, "orbsDropped") + readStat(pve, "orbsDropped")
    const resurrections =
      readStat(pvp, "resurrectionsPerformed") +
      readStat(pve, "resurrectionsPerformed")
    const assists = readStat(pvp, "assists") + readStat(pve, "assists")
    const suicides = readStat(pvp, "suicides") + readStat(pve, "suicides")
    const averageLifespan = readStat(pvp, "averageLifespan")
    const combatRating = readStat(pvp, "combatRating")

    return [
      {
        title: "Records de kills",
        accent: "#f87171",
        rows: [
          {
            label: "Meilleur match (PvP)",
            value: bestPvPKills.toLocaleString("fr-FR"),
            hint: "Kills sur une seule partie",
          },
          {
            label: "Meilleur match (PvE)",
            value: bestPvEKills.toLocaleString("fr-FR"),
            hint: "Kills sur une activité",
          },
          {
            label: "Plus longue série (PvP)",
            value: longestSpreePvP.toLocaleString("fr-FR"),
            hint: "Kills sans mourir",
          },
          {
            label: "Plus longue série (PvE)",
            value: longestSpreePvE.toLocaleString("fr-FR"),
          },
        ].filter((x) => parseInt(x.value.replace(/\s/g, "")) > 0),
      },
      {
        title: "Précision & portée",
        accent: "#fbbf24",
        rows: [
          {
            label: "Kill le plus lointain (PvP)",
            value: `${Math.round(longestDistPvP)} m`,
          },
          {
            label: "Kill le plus lointain (PvE)",
            value: `${Math.round(longestDistPvE)} m`,
          },
          {
            label: "Vie la plus longue",
            value:
              longestLife > 0
                ? `${Math.floor(longestLife / 60)} min ${Math.round(longestLife % 60)} s`
                : "—",
            hint: "Temps sans mourir",
          },
          {
            label: "Meilleur score Crucible",
            value: bestScorePvP.toLocaleString("fr-FR"),
          },
        ].filter((x) => x.value !== "—" && !x.value.startsWith("0 ")),
      },
      {
        title: "Support & combat",
        accent: "#60a5fa",
        rows: [
          {
            label: "Orbes distribués",
            value: orbsDropped.toLocaleString("fr-FR"),
            hint: "Super + armure mods",
          },
          {
            label: "Résurrections alliées",
            value: resurrections.toLocaleString("fr-FR"),
          },
          {
            label: "Total d'assistances",
            value: assists.toLocaleString("fr-FR"),
          },
          {
            label: "Espérance de vie PvP",
            value:
              averageLifespan > 0 ? `${Math.round(averageLifespan)} s` : "—",
          },
          {
            label: "Combat rating",
            value: combatRating > 0 ? Math.round(combatRating).toString() : "—",
            hint: "Classement Crucible",
          },
          {
            label: "Suicides",
            value: suicides.toLocaleString("fr-FR"),
            hint: "Chutes, explosions…",
          },
        ].filter((x) => x.value !== "—"),
      },
    ].filter((g) => g.rows.length > 0)
  }, [stats.data])

  if (stats.isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Records personnels</h2>
        <p className="text-bungie-muted text-sm">Chargement…</p>
      </section>
    )
  }

  if (groups.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-extrabold">Records personnels</h2>
        <p className="text-bungie-muted mt-0.5 text-xs">
          Bests et cumuls calculés depuis l'API Bungie — toutes saisons.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((g) => (
          <div
            key={g.title}
            className="overflow-hidden rounded-lg"
            style={{
              background: "rgba(10,8,16,0.6)",
              border: `1px solid ${g.accent}25`,
            }}
          >
            <div
              className="px-3 py-2 font-mono text-[10px] font-extrabold tracking-[0.25em] uppercase"
              style={{
                color: g.accent,
                borderBottom: `1px solid ${g.accent}20`,
                background: `linear-gradient(90deg, ${g.accent}15, transparent)`,
              }}
            >
              {g.title}
            </div>
            <div className="divide-y divide-white/5">
              {g.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-white/85">
                      {row.label}
                    </div>
                    {row.hint && (
                      <div className="mt-0.5 truncate text-[10px] text-white/40">
                        {row.hint}
                      </div>
                    )}
                  </div>
                  <div
                    className="shrink-0 text-base leading-none font-extrabold tabular-nums"
                    style={{ color: g.accent }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
