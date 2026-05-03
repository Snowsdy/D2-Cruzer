import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useSelectedMembership } from "@/hooks/useProfile"
import { getAccountStats, readStat } from "@/api/stats"
import { ACTIVITY_MODE } from "@/constants/bungieHashes"
import { ACCENTS } from "@/constants/uiAccents"

const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.ironBanner
const IRON_BANNER_MODE = ACTIVITY_MODE.IronBanner

function fmtNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`
  return `${m}m`
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string
  accent?: string
  hint?: string
}) {
  return (
    <div className="panel p-4">
      <div className="text-bungie-muted text-[9px] tracking-widest uppercase">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-bungie-muted mt-0.5 text-[10px] tabular-nums">
          {hint}
        </div>
      )}
    </div>
  )
}

export function IronBannerView() {
  const { t } = useTranslation()
  const membership = useSelectedMembership()

  const stats = useQuery({
    queryKey: [
      "ironBannerStats",
      membership?.membershipType,
      membership?.membershipId,
    ],
    queryFn: () =>
      getAccountStats(membership!.membershipType, membership!.membershipId, [
        IRON_BANNER_MODE,
      ]),
    enabled: !!membership,
    staleTime: 15_000,
    refetchInterval: 45_000,
  })

  const row = useMemo(() => {
    const r = stats.data?.mergedAllCharacters?.results
    const bucket = r?.ironBanner?.allTime ?? null
    if (!bucket) return null

    const kills = readStat(bucket, "kills")
    const deaths = readStat(bucket, "deaths")
    const assists = readStat(bucket, "assists")
    const matches = readStat(bucket, "activitiesEntered")
    const wins = readStat(bucket, "activitiesWon")
    const losses = Math.max(0, matches - wins)
    const kd = deaths > 0 ? kills / deaths : kills
    const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists
    const winRate = matches > 0 ? wins / matches : 0
    const bestKills = readStat(bucket, "bestSingleGameKills")
    const avgKillDist = readStat(bucket, "averageKillDistance")
    const longestKill = readStat(bucket, "longestKillDistance")
    const precision = readStat(bucket, "precisionKills")
    const secondsPlayed = readStat(bucket, "secondsPlayed")
    const opponentsDefeated = readStat(bucket, "opponentsDefeated")
    const longestSpree = readStat(bucket, "longestKillSpree")
    const lifespan = readStat(bucket, "averageLifespan")

    return {
      kills,
      deaths,
      assists,
      matches,
      wins,
      losses,
      kd,
      kda,
      winRate,
      bestKills,
      avgKillDist,
      longestKill,
      precision,
      precisionPct: kills > 0 ? precision / kills : 0,
      secondsPlayed,
      opponentsDefeated,
      longestSpree,
      lifespan,
    }
  }, [stats.data])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Header */}
      <div className={`panel border p-5 ${ACCENT_BORDER}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`text-[10px] tracking-widest uppercase ${ACCENT}`}>
              {t("ironBanner.title")}
            </div>
            <div className="text-3xl font-bold">
              {row ? fmtNum(row.matches) : "—"}{" "}
              <span className="text-bungie-muted text-base font-normal">
                {t("ironBanner.matches")}
              </span>
            </div>
            <div className="text-bungie-muted mt-1 text-sm">
              {row
                ? `${fmtNum(row.wins)} ${t("ironBanner.wins")} · ${fmtNum(row.losses)} ${t("ironBanner.losses")}`
                : t("common.loading")}
            </div>
          </div>
          <div className={`text-5xl ${ACCENT} opacity-80 drop-shadow`}>⚒</div>
        </div>
      </div>

      {stats.isLoading && !row && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {stats.isError && (
        <div className="panel border border-red-500/40 p-4">
          <p className="mb-1 font-semibold text-red-400">{t("common.error")}</p>
          <p className="text-bungie-muted text-sm">{String(stats.error)}</p>
        </div>
      )}

      {!stats.isLoading && row && row.matches === 0 && (
        <div className="panel text-bungie-muted p-6 text-center text-sm">
          {t("ironBanner.noMatches")}
        </div>
      )}

      {row && row.matches > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label={t("ironBanner.kd")}
              value={fmtNum(row.kd)}
              accent={ACCENT}
              hint={`${fmtNum(row.kills)} K · ${fmtNum(row.deaths)} D`}
            />
            <Stat
              label={t("ironBanner.kda")}
              value={fmtNum(row.kda)}
              hint={`+ ${fmtNum(row.assists)} A`}
            />
            <Stat
              label={t("ironBanner.winRate")}
              value={fmtPct(row.winRate)}
              accent="text-emerald-300"
              hint={`${fmtNum(row.wins)} / ${fmtNum(row.matches)}`}
            />
            <Stat
              label={t("ironBanner.opponentsDefeated")}
              value={fmtNum(row.opponentsDefeated)}
            />
          </div>

          <div className="panel p-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold">{t("ironBanner.record")}</span>
              <span className="text-bungie-muted tabular-nums">
                {fmtNum(row.wins)} W · {fmtNum(row.losses)} L
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full border border-white/5 bg-black/40">
              <div
                className="h-full bg-emerald-400/70"
                style={{ width: `${row.winRate * 100}%` }}
              />
              <div
                className="h-full bg-red-400/70"
                style={{ width: `${(1 - row.winRate) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label={t("ironBanner.bestKills")}
              value={fmtNum(row.bestKills)}
            />
            <Stat
              label={t("ironBanner.longestKill")}
              value={`${fmtNum(row.longestKill)}m`}
            />
            <Stat
              label={t("ironBanner.avgKillDist")}
              value={`${fmtNum(row.avgKillDist)}m`}
            />
            <Stat
              label={t("ironBanner.precisionKills")}
              value={fmtNum(row.precision)}
              hint={`${fmtPct(row.precisionPct)} ${t("ironBanner.ofKills")}`}
            />
            <Stat
              label={t("ironBanner.avgLifespan")}
              value={`${fmtNum(row.lifespan)}s`}
            />
            <Stat
              label={t("ironBanner.timePlayed")}
              value={fmtTime(row.secondsPlayed)}
            />
          </div>
        </>
      )}
    </div>
  )
}
