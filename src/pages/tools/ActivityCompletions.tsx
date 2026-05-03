/**
 * Activity completions — raids, dungeons, strikes, nightfalls, public events
 * cleared across the account. Grouped by category for readability.
 */

import { useMemo } from "react"
import { useAccountStats } from "@/hooks/useAccountStats"
import { readStat } from "@/api/stats"

interface Row {
  label: string
  value: number
  hint?: string
  color: string
}

interface Group {
  title: string
  accent: string
  rows: Row[]
}

export function ActivityCompletionsSection() {
  const stats = useAccountStats()

  const groups = useMemo<Group[]>(() => {
    const r = stats.data?.mergedAllCharacters?.results
    if (!r) return []

    const raid = r.raid?.allTime
    const dungeon = (
      r as unknown as Record<
        string,
        { allTime?: Parameters<typeof readStat>[0] }
      >
    ).dungeon?.allTime
    const strikes = r.allStrikes?.allTime
    const nightfall =
      r.nightfall?.allTime ||
      (
        r as unknown as Record<
          string,
          { allTime?: Parameters<typeof readStat>[0] }
        >
      ).scored_nightfall?.allTime
    const pvp = r.allPvP?.allTime
    const pve = r.allPvE?.allTime
    const trials = r.trialsOfOsiris?.allTime
    const ib = r.ironBanner?.allTime
    const gambit = r.gambit?.allTime

    const ratio = (won: number, entered: number) =>
      entered > 0 ? `${((won / entered) * 100).toFixed(1)}% winrate` : ""

    const pveGroup: Group = {
      title: "Activités PvE",
      accent: "#34d399",
      rows: [
        {
          label: "Raids",
          value: readStat(raid, "activitiesCleared"),
          color: "#c084fc",
        },
        {
          label: "Donjons",
          value: readStat(dungeon, "activitiesCleared"),
          color: "#e879f9",
        },
        {
          label: "Assauts",
          value: readStat(strikes, "activitiesCleared"),
          color: "#f472b6",
        },
        {
          label: "Cauchemars",
          value: readStat(nightfall, "activitiesCleared"),
          color: "#60a5fa",
        },
        {
          label: "Aventures",
          value: readStat(pve, "adventuresCompleted"),
          color: "#4ade80",
        },
        {
          label: "Patrouilles",
          value: readStat(pve, "patrolsCompleted"),
          color: "#a3e635",
        },
      ].filter((x) => x.value > 0),
    }

    const pvpGroup: Group = {
      title: "Matches PvP",
      accent: "#f87171",
      rows: [
        {
          label: "Épreuve (total)",
          value: readStat(pvp, "activitiesEntered"),
          hint: ratio(
            readStat(pvp, "activitiesWon"),
            readStat(pvp, "activitiesEntered")
          ),
          color: "#f87171",
        },
        {
          label: "Épreuves d'Osiris",
          value: readStat(trials, "activitiesEntered"),
          hint: ratio(
            readStat(trials, "activitiesWon"),
            readStat(trials, "activitiesEntered")
          ),
          color: "#c084fc",
        },
        {
          label: "Bannière de fer",
          value: readStat(ib, "activitiesEntered"),
          hint: ratio(
            readStat(ib, "activitiesWon"),
            readStat(ib, "activitiesEntered")
          ),
          color: "#fbbf24",
        },
      ].filter((x) => x.value > 0),
    }

    const eventGroup: Group = {
      title: "Monde ouvert",
      accent: "#22d3ee",
      rows: [
        {
          label: "Événements publics",
          value: readStat(pve, "publicEventsCompleted"),
          hint:
            readStat(pve, "heroicPublicEventsCompleted") > 0
              ? `${readStat(pve, "heroicPublicEventsCompleted").toLocaleString("fr-FR")} héroïques`
              : "",
          color: "#22d3ee",
        },
        {
          label: "Gambit",
          value: readStat(gambit, "activitiesEntered"),
          hint: ratio(
            readStat(gambit, "activitiesWon"),
            readStat(gambit, "activitiesEntered")
          ),
          color: "#34d399",
        },
      ].filter((x) => x.value > 0),
    }

    return [pveGroup, pvpGroup, eventGroup].filter((g) => g.rows.length > 0)
  }, [stats.data])

  if (stats.isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Activités terminées</h2>
        <p className="text-bungie-muted text-sm">Chargement…</p>
      </section>
    )
  }

  if (groups.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-extrabold">Activités terminées</h2>
        <p className="text-bungie-muted mt-0.5 text-xs">
          Cumul de toutes tes saisons — raids, donjons, matches compétitifs et
          exploration.
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
                    className="shrink-0 text-xl leading-none font-extrabold tabular-nums"
                    style={{ color: row.color }}
                  >
                    {row.value.toLocaleString("fr-FR")}
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
